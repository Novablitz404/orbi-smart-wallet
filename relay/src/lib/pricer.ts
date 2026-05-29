import {
  TransactionBuilder,
  Contract,
  xdr,
  Address,
  BASE_FEE,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { getServer, getDeployerKeypair, getPassphrase, getNativeSacId, getFeeCollector } from './stellar';
import { pool } from './db';

const SPREAD = 0.20; // 20% margin over actual Stellar resource fee
const STROOPS_PER_XLM = 10_000_000;
const QUOTE_VALIDITY_LEDGERS = 100; // ~8 minutes on testnet

export interface GasQuote {
  quoteId: string;
  feeStroops: number;
  feeXlm: string;
  expiresAtLedger: number;
  currentLedger: number;
  simulatedAt: number;
  deploymentDebtStroops: number;
  nativeSacId: string;
  feeCollectorAddress: string;
}

export interface SimulateParams {
  contractId: string;
  functionName: string;
  args: xdr.ScVal[];
  walletAddress: string;
}

export async function simulateGasFee(params: SimulateParams): Promise<GasQuote> {
  const { contractId, functionName, args, walletAddress } = params;
  const server = getServer();
  const deployer = getDeployerKeypair();

  const account = await server.getAccount(deployer.publicKey());
  const ledger = await server.getLatestLedger();

  const nativeSacId = getNativeSacId();

  // Soroban recording mode can't simulate custom account require_auth() when the
  // wallet isn't the root invocation. Simulate the inner op directly from the
  // deployer using freshly-built args (avoids Long/Hyper XDR re-serialization bugs),
  // then apply a 3x multiplier for execute_batch + execute_with_fee + fee overhead.
  //
  // For transfer ops: rebuild as transfer(deployer, to, amount) with a fixed 1-stroop
  // amount — resource cost doesn't depend on the transfer amount.
  let simArgs: xdr.ScVal[];
  if (functionName === 'transfer') {
    const to = args[1] ?? new Address(deployer.publicKey()).toScVal();
    simArgs = [
      new Address(deployer.publicKey()).toScVal(),
      to,
      nativeToScVal(1n, { type: 'i128' }),
    ];
  } else {
    simArgs = args;
  }

  const innerContract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getPassphrase(),
  })
    .addOperation(innerContract.call(functionName, ...simArgs))
    .setTimeout(300)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if ('error' in simResult) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const minResourceFee = Number((simResult as any).minResourceFee ?? 0);
  const baseFee = Number(BASE_FEE);
  // 3x multiplier: accounts for execute_batch + execute_with_fee + fee transfer overhead
  const txFee = Math.ceil((minResourceFee * 3 + baseFee) * (1 + SPREAD));

  // Add unpaid deployment cost to the first send
  const { rows } = await pool.query(
    `SELECT deployment_fee_stroops FROM users
     WHERE wallet_address = $1 AND deployment_fee_charged = false`,
    [walletAddress],
  );
  const deploymentDebt = rows.length > 0 ? Number(rows[0].deployment_fee_stroops) : 0;
  const totalFee = txFee + deploymentDebt;

  const quoteId = crypto.randomUUID();
  const expiresAtLedger = ledger.sequence + QUOTE_VALIDITY_LEDGERS;

  // Persist so bundle route can validate and look up the agreed fee
  await pool.query(
    `INSERT INTO quotes (id, wallet_address, fee_stroops, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '8 minutes')`,
    [quoteId, walletAddress, totalFee],
  );

  return {
    quoteId,
    feeStroops: totalFee,
    feeXlm: (totalFee / STROOPS_PER_XLM).toFixed(7),
    expiresAtLedger,
    currentLedger: ledger.sequence,
    simulatedAt: Date.now(),
    deploymentDebtStroops: deploymentDebt,
    nativeSacId: getNativeSacId(),
    feeCollectorAddress: getFeeCollector(),
  };
}
