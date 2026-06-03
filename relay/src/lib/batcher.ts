import {
  TransactionBuilder,
  Contract,
  xdr,
  Address,
  Transaction,
  BASE_FEE,
  nativeToScVal,
  authorizeEntry,
  rpc,
} from '@stellar/stellar-sdk';
import { getServer, getDeployerKeypair, getBundlerContractId, getPassphrase, getNativeSacId, getFeeCollector } from './stellar';
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

async function attachAuthAndSimulate(
  server: ReturnType<typeof getServer>,
  tx: Transaction,
  networkPassphrase: string,
  authEntries: xdr.SorobanAuthorizationEntry[],
): Promise<rpc.Api.SimulateTransactionSuccessResponse> {
  const envelope = tx.toEnvelope();
  envelope.v1().tx().operations()[0].body().invokeHostFunctionOp().auth(authEntries);
  const txWithAuth = new Transaction(envelope.toXDR('base64'), networkPassphrase);
  const simResult = await server.simulateTransaction(txWithAuth);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation error: ${(simResult as rpc.Api.SimulateTransactionErrorResponse).error}`);
  }
  return simResult as rpc.Api.SimulateTransactionSuccessResponse;
}

async function submitTx(
  server: ReturnType<typeof getServer>,
  tx: Transaction,
  authEntries: xdr.SorobanAuthorizationEntry[],
  simResult: rpc.Api.SimulateTransactionSuccessResponse,
  networkPassphrase: string,
  signer: ReturnType<typeof getDeployerKeypair>,
): Promise<string> {
  const assembled = rpc.assembleTransaction(tx, simResult).build();
  const envelope = assembled.toEnvelope();
  envelope.v1().tx().operations()[0].body().invokeHostFunctionOp().auth(authEntries);
  const finalTx = new Transaction(envelope.toXDR('base64'), networkPassphrase);
  finalTx.sign(signer);

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

async function attemptSubmit(ops: PendingOp[], sponsorPublicKey?: string): Promise<string> {
  const server = getServer();
  const deployer = getDeployerKeypair();
  const networkPassphrase = getPassphrase();
  const nativeSacId = getNativeSacId();
  const feeCollector = getFeeCollector();

  // Orbi's deployer is always the transaction source — we pay the Stellar network fee.
  const account = await server.getAccount(deployer.publicKey());

  const userAuthEntries = ops.map(op =>
    xdr.SorobanAuthorizationEntry.fromXDR(Buffer.from(op.authEntryXdr, 'base64')),
  );

  if (sponsorPublicKey) {
    // dApp-sponsored batch:
    // - Each execute_with_fee gets fee=0 (user pays nothing)
    // - execute_batch_sponsored collects total_fee from dApp's account via native XLM SAC
    // - Orbi's deployer key is co-signer on the dApp's classic G... account
    const totalFee = ops.reduce((sum, op) => sum + op.feeStroops, 0);

    const calls = ops.map(op => {
      const opArgs = (op.argsXdr as unknown as string[]).map(a =>
        xdr.ScVal.fromXDR(Buffer.from(a, 'base64')),
      );
      return buildExecuteWithFeeCall(
        op.walletAddress, op.contractId, op.functionName, opArgs,
        nativeSacId, feeCollector, 0,
      );
    });

    const bundlerContract = new Contract(getBundlerContractId());
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
      .addOperation(bundlerContract.call(
        'execute_batch_sponsored',
        xdr.ScVal.scvVec(calls),
        new Address(sponsorPublicKey).toScVal(),
        new Address(nativeSacId).toScVal(),
        new Address(feeCollector).toScVal(),
        nativeToScVal(BigInt(totalFee), { type: 'i128' }),
      ))
      .setTimeout(300)
      .build();

    // Recording mode: get the unsigned auth entry for the dApp's SAC transfer.
    // The RPC generates it with a valid nonce; we sign it with our deployer key
    // (which is a co-signer on the dApp's classic Stellar account).
    const recSimResult = await server.simulateTransaction(tx, undefined, 'record');
    if (rpc.Api.isSimulationError(recSimResult)) {
      throw new Error(`Recording simulation error: ${(recSimResult as rpc.Api.SimulateTransactionErrorResponse).error}`);
    }

    const recSim = recSimResult as rpc.Api.SimulateTransactionSuccessResponse;
    const recAuthEntries = recSim.result?.auth ?? [];

    const dAppEntry = recAuthEntries.find(e => {
      try {
        const creds = e.credentials();
        if (creds.switch().value !== xdr.SorobanCredentialsType.sorobanCredentialsAddress().value) return false;
        return Address.fromScAddress(creds.address().address()).toString() === sponsorPublicKey;
      } catch { return false; }
    });

    if (!dAppEntry) throw new Error('dApp SAC transfer auth entry not found in recording simulation');

    const validUntilLedger = recSim.latestLedger + 100;
    const signedDAppEntry = await authorizeEntry(dAppEntry, deployer, validUntilLedger, networkPassphrase);

    // Enforcement mode: validate all auth entries and get final resource budget.
    const allEntries = [...userAuthEntries, signedDAppEntry];
    const simResult = await attachAuthAndSimulate(server, tx, networkPassphrase, allEntries);

    return submitTx(server, tx, allEntries, simResult, networkPassphrase, deployer);
  }

  // Regular batch: user pays their own fee via execute_with_fee.
  const bundlerContractId = getBundlerContractId();
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

  const simResult = await attachAuthAndSimulate(server, tx, networkPassphrase, userAuthEntries);
  return submitTx(server, tx, userAuthEntries, simResult, networkPassphrase, deployer);
}

/**
 * Submit a batch of ops with adaptive binary splitting.
 * If the batch exceeds Stellar's resource budget, it splits in half and retries.
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
