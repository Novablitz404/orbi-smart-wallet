export type OrbiNetwork = 'testnet' | 'mainnet';

export interface OrbiClientConfig {
  apiUrl: string;
  apiKey: string;
  network?: 'testnet' | 'mainnet';
}

export interface QuoteResult {
  quoteId: string;
  feeStroops: number;
  feeXlm: string;
  expiresAtLedger: number;
}

export interface BundleResult {
  opId: string;
}

export interface OpStatus {
  opId: string;
  status: 'pending' | 'batched' | 'confirmed' | 'failed';
  txHash: string | null;
  error: string | null;
}

export interface CallParams {
  contractId: string;
  functionName: string;
  argsXdr: string[];
  walletAddress: string;
  authEntryXdr: string;
  feeAuthEntryXdr?: string;
  quoteId?: string;
}
