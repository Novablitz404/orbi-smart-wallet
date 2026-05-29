import { Keypair, Networks, rpc as StellarRpc } from '@stellar/stellar-sdk';

export type OrbiNetwork = 'testnet' | 'mainnet';

const RPC_URLS: Record<OrbiNetwork, string> = {
  testnet: 'https://soroban-testnet.stellar.org',
  mainnet: 'https://mainnet.stellar.validationcloud.io/v1/dLMqhBxNFT6Dg2JRpSMT3g',
};

const PASSPHRASES: Record<OrbiNetwork, string> = {
  testnet: Networks.TESTNET,
  mainnet: Networks.PUBLIC,
};

export function getNetwork(): OrbiNetwork {
  const n = process.env.STELLAR_NETWORK ?? 'testnet';
  if (n !== 'testnet' && n !== 'mainnet') throw new Error(`Invalid STELLAR_NETWORK: ${n}`);
  return n;
}

export function getPassphrase(): string {
  return PASSPHRASES[getNetwork()];
}

export function getRpcUrl(): string {
  return RPC_URLS[getNetwork()];
}

export function getServer(): StellarRpc.Server {
  return new StellarRpc.Server(getRpcUrl());
}

export function getDeployerKeypair(): Keypair {
  const secret = process.env.STELLAR_DEPLOYER_SECRET;
  if (!secret) throw new Error('STELLAR_DEPLOYER_SECRET env var not set');
  return Keypair.fromSecret(secret);
}

export function getBundlerContractId(): string {
  const id = process.env.BUNDLER_CONTRACT_ID;
  if (!id) throw new Error('BUNDLER_CONTRACT_ID env var not set');
  return id;
}
