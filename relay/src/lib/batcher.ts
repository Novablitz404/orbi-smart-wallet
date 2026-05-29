import {
  TransactionBuilder,
  Contract,
  xdr,
  Address,
  Transaction,
  BASE_FEE,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { getServer, getDeployerKeypair, getBundlerContractId, getPassphrase, getNativeSacId, getFeeCollector } from './stellar';
import { PendingOp, createBatch, markBatched, markConfirmed, markFailed } from './queue';
import { isWalletDeployed, buildDeployOperation } from './wallet';
import { pool } from './db';

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

interface WalletInfo {
  passkeyId: string;
  publicKey: string;
}

async function getWalletInfo(walletAddress: string): Promise<WalletInfo | null> {
  const { rows } = await pool.query(
    `SELECT passkey_id, public_key FROM users WHERE wallet_address = $1`,
    [walletAddress],
  );
  return rows.length > 0 ? { passkeyId: rows[0].passkey_id, publicKey: rows[0].public_key } : null;
}

async function attemptSubmit(ops: PendingOp[]): Promise<string> {
  const server = getServer();
  const deployer = getDeployerKeypair();
  const bundlerContractId = getBundlerContractId();
  const networkPassphrase = getPassphrase();

  const account = await server.getAccount(deployer.publicKey());

  const uniqueWallets = [...new Set(ops.map(op => op.walletAddress))];
  const deploymentOps: ReturnType<typeof buildDeployOperation>[] = [];

  await Promise.all(
    uniqueWallets.map(async walletAddress => {
      const deployed = await isWalletDeployed(walletAddress);
      if (!deployed) {
        const info = await getWalletInfo(walletAddress);
        if (!info) return;
        console.log(`[batcher] Deploying wallet ${walletAddress}`);
        deploymentOps.push(buildDeployOperation(
          Buffer.from(info.passkeyId, 'hex'),
          Buffer.from(info.publicKey, 'hex'),
          walletAddress,
        ));
      }
    }),
  );

  const nativeSacId = getNativeSacId();
  const feeCollector = getFeeCollector();

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
  const txBuilder = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase });

  for (const deployOp of deploymentOps) {
    txBuilder.addOperation(deployOp);
  }
  txBuilder.addOperation(bundlerContract.call('execute_batch', xdr.ScVal.scvVec(calls))).setTimeout(300);

  const tx = txBuilder.build();

  const authEntries = ops.map(op =>
    xdr.SorobanAuthorizationEntry.fromXDR(Buffer.from(op.authEntryXdr, 'base64')),
  );

  const simResult = await server.simulateTransaction(tx);
  if ('error' in simResult) throw new Error(`Simulation error: ${(simResult as any).error}`);

  const assembled = await server.prepareTransaction(tx);

  const operations = assembled.toEnvelope().v1().tx().operations();
  const batchOp = operations[operations.length - 1];
  if (batchOp.body().value() instanceof xdr.InvokeHostFunctionOp) {
    (batchOp.body().value() as xdr.InvokeHostFunctionOp).auth(authEntries);
  }

  assembled.sign(deployer);

  const feeBump = TransactionBuilder.buildFeeBumpTransaction(
    deployer,
    String(Math.ceil(Number(BASE_FEE) * 1.5 * (ops.length + deploymentOps.length + 1))),
    assembled as unknown as Transaction,
    networkPassphrase,
  );
  feeBump.sign(deployer);

  const result = await server.sendTransaction(feeBump);
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
export async function submitBatch(ops: PendingOp[]): Promise<void> {
  if (ops.length === 0) return;

  const batchId = await createBatch(ops.length);
  await markBatched(ops.map(o => o.id), batchId);

  try {
    const txHash = await attemptSubmit(ops);
    await markConfirmed(batchId, txHash);
    console.log(`[batcher] Confirmed batch ${batchId} (${ops.length} ops) → ${txHash}`);
  } catch (err: unknown) {
    if (isResourceError(err) && ops.length > 1) {
      // Resource budget exceeded — split in half and retry each independently
      console.log(`[batcher] Resource limit hit with ${ops.length} ops — splitting`);
      await markFailed(batchId, 'resource limit — splitting into sub-batches');
      const mid = Math.floor(ops.length / 2);
      await submitBatch(ops.slice(0, mid));
      await submitBatch(ops.slice(mid));
    } else {
      await markFailed(batchId, String(err));
      throw err;
    }
  }
}
