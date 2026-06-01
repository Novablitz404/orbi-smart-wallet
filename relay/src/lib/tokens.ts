import { Asset } from '@stellar/stellar-sdk';
import { getNetwork, getNativeSacId, getPassphrase } from './stellar';

export interface TrackedToken {
  code: string;
  sacId: string;
}

interface TokenDef { code: string; issuer: string; }

// Curated defaults per network. SAC contract IDs are derived at runtime for
// the active network so this stays in sync with the frontend (app/lib/tokens.ts).
const DEFAULTS: Record<'mainnet' | 'testnet', TokenDef[]> = {
  mainnet: [
    { code: 'USDC', issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVV' },
    { code: 'EURC', issuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP' },
    { code: 'AQUA', issuer: 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA' },
    { code: 'yXLM', issuer: 'GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55' },
  ],
  testnet: [
    // Circle's testnet USDC issuer
    { code: 'USDC', issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' },
  ],
};

export function getTrackedTokens(): TrackedToken[] {
  const passphrase = getPassphrase();
  const native: TrackedToken = { code: 'XLM', sacId: getNativeSacId() };
  const defaults = DEFAULTS[getNetwork()].map(t => ({
    code: t.code,
    sacId: new Asset(t.code, t.issuer).contractId(passphrase),
  }));
  return [native, ...defaults];
}

export function getSacToCodeMap(): Map<string, string> {
  return new Map(getTrackedTokens().map(t => [t.sacId, t.code]));
}
