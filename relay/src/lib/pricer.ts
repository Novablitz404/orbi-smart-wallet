import {
  TransactionBuilder,
  Contract,
  xdr,
  Address,
  nativeToScVal,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { getServer, getDeployerKeypair, getBundlerContractId, getPassphrase } from './stellar';

const SPREAD = 0.20; // 20% margin over actual Stellar resource fee
const STROOPS_PER_XLM = 10_000_000;
const QUOTE_VALIDITY_LEDGERS = 100; // ~8 minutes on testnet

export interface GasQuote {
  quoteId: string;
  feeStroops: number;
  feeXlm: string;
  expiresAtLedger: number;
  simulatedAt: number;
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
  const bundlerContractId = getBundlerContractId();

  const account = await server.getAccount(deployer.publicKey());
  const ledger = await server.getLatestLedger();

  // Build execute_batch call with a single op for simulation
  const call = xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('args'),
      val: xdr.ScVal.scvVec(args),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('contract'),
      val: new Address(contractId).toScVal(),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('function'),
      val: xdr.ScVal.scvSymbol(functionName),
    }),
  ]);

  const bundlerContract = new Contract(bundlerContractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getPassphrase(),
  })
    .addOperation(
      bundlerContract.call('execute_batch', xdr.ScVal.scvVec([call]))
    )
    .setTimeout(300)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if ('error' in simResult) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const minResourceFee = Number((simResult as any).minResourceFee ?? 0);
  const baseFee = Number(BASE_FEE);
  const totalFee = Math.ceil((minResourceFee + baseFee) * (1 + SPREAD));

  const quoteId = crypto.randomUUID();
  const expiresAtLedger = ledger.sequence + QUOTE_VALIDITY_LEDGERS;

  return {
    quoteId,
    feeStroops: totalFee,
    feeXlm: (totalFee / STROOPS_PER_XLM).toFixed(7),
    expiresAtLedger,
    simulatedAt: Date.now(),
  };
}
