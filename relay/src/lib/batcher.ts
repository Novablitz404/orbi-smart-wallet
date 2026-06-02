import {
  TransactionBuilder,
  Contract,
  xdr,
  Address,
  Transaction,
  BASE_FEE,
  nativeToScVal,
  rpc,
} from '@stellar/stellar-sdk';
import { getServer, getDeployerKeypair, getBundlerContractId, getDappBundlerContractId, getPassphrase, getNativeSacId, getFeeCollector } from './stellar';
import { PendingOp, createBatch, markBatched, markConfirmed, markFailed } from './queue';

function buildExecuteWithFeeCall(
  walletAddress: string,
  opContractId: string,
  opFunctionName: string,
  opArgs: xdr.ScVal[],
  nativeSacId: string,
  feeCollector: string,
  feeStroops: number,
): xdr.ScVal {
  const feeAmount = nativeToScVal(BigInt(feeStroops), { type: 'i128' });
  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('args'),
      val: xdr.ScVal.scvVec([
        new Address(opContractId).toScVal(),
        xdr.ScVal.scvSymbol(opFunctionName),
        xdr.ScVal.scvVec(opArgs),
        new Address(nativeSacId).toScVal(),
        new Address(feeCollector).toScVal(),
        feeAmount,
      ]),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('contract'),
      val: new Address(walletAddress).toScVal(),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('function'),
      val: xdr.ScVal.scvSymbol('execute_with_fee'),
    }),
  ]);
}

function isResourceError(err: unknown): boolean {
  const msg = String((err as any)?.message ?? err).toLowerCase();
  return msg.includes('exceeded') || msg.includes('budget') || msg.includes('resources');
}

async function attemptSubmit(ops: PendingOp[], sponsorPublicKey?: string): Promise<string> {
  const server = getServer();
  const deployer = getDeployerKeypair();
  // Sponsored ops: source account = dApp's Stellar account (dApp pays network fee).
  // Orbi's deployer key is a co-signer on the dApp account, so it can sign for it.
  const bundlerContractId = sponsorPublicKey ? getDappBundlerContractId() : getBundlerContractId();
  const sourceKey = sponsorPublicKey ?? deployer.publicKey();
  const networkPassphrase = getPassphrase();
  const nativeSacId = getNativeSacId();
  const feeCollector = getFeeCollector();

  const account = await server.getAccount(sourceKey);

  // Each op → wallet.execute_with_fee(...) call inside execute_batch
  const calls = ops.map(op => {
    const opArgs = (op.argsXdr as unknown as string[]).map(a =>
      xdr.ScVal.fromXDR(Buffer.from(a, 'base64')),
    );
    return buildExecuteWithFeeCall(
      op.walletAddress, op.contractId, op.functionName, opArgs,
      nativeSacId, feeCollector, op.feeStroops,
    );
  });

  const bundlerContract = new Contract(bundlerContractId);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(bundlerContract.call('execute_batch', xdr.ScVal.scvVec(calls)))
    .setTimeout(300)
    .build();

  // Each user's signed auth entry covers their own execute_with_fee sub-tree
  const userAuthEntries = ops.map(op =>
    xdr.SorobanAuthorizationEntry.fromXDR(Buffer.from(op.authEntryXdr, 'base64')),
  );

  // Attach signed auth entries BEFORE simulation → enforcement mode (not recording).
  // Required for secp256r1 passkey auth and non-root auth (bundler → wallet → SAC).
  const preTx = tx.toEnvelope();
  preTx.v1().tx().operations()[0].body().invokeHostFunctionOp().auth(userAuthEntries);
  const txWithAuth = new Transaction(preTx.toXDR('base64'), networkPassphrase);

  const simResult = await server.simulateTransaction(txWithAuth);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation error: ${simResult.error}`);
  }

  // assembleTransaction merges fees + soroban resources from simulation.
  // Use the original tx (clean base); re-attach auth after, as assemble overwrites it.
  const assembled = rpc.assembleTransaction(tx, simResult).build();
  const envelope = assembled.toEnvelope();
  envelope.v1().tx().operations()[0].body().invokeHostFunctionOp().auth(userAuthEntries);

  const finalTx = new Transaction(envelope.toXDR('base64'), networkPassphrase);
  finalTx.sign(deployer);

  const result = await server.sendTransaction(finalTx);
  if (result.status === 'ERROR') throw new Error(`Submit error: ${JSON.stringify(result.errorResult)}`);

  const txHash = result.hash;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const status = await server.getTransaction(txHash);
    if (status.status === 'SUCCESS') return txHash;
    if (status.status === 'FAILED') throw new Error(`Transaction failed: ${txHash}`);
  }
  throw new Error(`Transaction timed out: ${txHash}`);
}

/**
 * Submit a batch of ops with adaptive binary splitting.
 * If the batch exceeds Stellar's resource budget, it splits in half and retries
 * each sub-batch independently — automatically adapts to any op complexity.
 */
export async function submitBatch(ops: PendingOp[], sponsorPublicKey?: string): Promise<void> {
  if (ops.length === 0) return;

  const batchId = await createBatch(ops.length);
  await markBatched(ops.map(o => o.id), batchId);

  try {
    const txHash = await attemptSubmit(ops, sponsorPublicKey);
    await markConfirmed(batchId, txHash);
    console.log(`[batcher] Confirmed batch ${batchId} (${ops.length} ops) → ${txHash}`);
  } catch (err: unknown) {
    if (isResourceError(err) && ops.length > 1) {
      // Resource budget exceeded — split in half and retry each independently
      console.log(`[batcher] Resource limit hit with ${ops.length} ops — splitting`);
      await markFailed(batchId, 'resource limit — splitting into sub-batches');
      const mid = Math.floor(ops.length / 2);
      await submitBatch(ops.slice(0, mid), sponsorPublicKey);
      await submitBatch(ops.slice(mid), sponsorPublicKey);
    } else {
      await markFailed(batchId, String(err));
      throw err;
    }
  }
}
