const WALLET_KEY = 'orbi_wallet';

export interface StoredWallet {
  walletAddress: string;
  credentialId: string;
  passkeyId: string;
  email: string;
}

export function saveWallet(wallet: StoredWallet): void {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
}

export function loadWallet(): StoredWallet | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(WALLET_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearWallet(): void {
  localStorage.removeItem(WALLET_KEY);
}
