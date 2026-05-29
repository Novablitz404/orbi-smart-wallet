import { createHmac } from 'crypto';
import { Keypair } from '@stellar/stellar-sdk';

/**
 * Derive a unique guardian keypair for a wallet.
 * guardian_secret = HMAC-SHA256(GUARDIAN_MASTER_SECRET, wallet_contract_address)
 *
 * One master secret held by Orbi. Every wallet gets a unique derived keypair.
 * Compromising one derived secret does not expose other wallets.
 */
export function deriveGuardianKeypair(walletAddress: string): Keypair {
  const master = process.env.GUARDIAN_MASTER_SECRET;
  if (!master) throw new Error('GUARDIAN_MASTER_SECRET env var not set');

  // Derive 32 bytes → valid Stellar secret seed
  const derived = createHmac('sha256', master)
    .update(walletAddress)
    .digest();

  return Keypair.fromRawEd25519Seed(derived);
}

export function deriveGuardianAddress(walletAddress: string): string {
  return deriveGuardianKeypair(walletAddress).publicKey();
}
