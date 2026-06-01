/**
 * @orbi/sdk — Orbi Smart Wallet SDK
 *
 * Lets any Stellar dApp integrate Orbi passkey wallets.
 * Uses the OAuth-style redirect flow — no popups, no extensions.
 *
 * Quick start:
 *   const orbi = new OrbiClient({ apiUrl: 'https://api.orbiwallet.xyz' });
 *
 *   // 1. Connect — redirect user to Orbi, get wallet address back
 *   orbi.connect({ redirectUrl: 'https://your-app.com/callback' });
 *
 *   // 2. On callback page — exchange token for wallet address
 *   const { walletAddress } = await orbi.handleCallback();
 *
 *   // 3. Sign a transaction — redirect user to Orbi sign page
 *   orbi.sign({ walletAddress, contractId, functionName, argsXdr,
 *               redirectUrl: 'https://your-app.com/sign-callback' });
 *
 *   // 4. On sign-callback page — get the signed result and bundle
 *   const result = await orbi.handleSignCallback();
 *   const { opId } = await orbi.bundle(result);
 *   await orbi.waitForConfirmation(opId);
 */

import type { OrbiClientConfig, OpStatus } from './types';

const KEYS_URL = 'https://keys.orbiwallet.xyz';

export class OrbiClient {
  private apiUrl: string;

  constructor(config: OrbiClientConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
  }

  // ── dApp integration ────────────────────────────────────────────────────────

  /**
   * Redirect the user to Orbi to connect their wallet.
   * On return, call handleCallback() to get the wallet address.
   */
  connect(params: { redirectUrl: string; origin?: string }) {
    const url = new URL(`${KEYS_URL}/connect`);
    url.searchParams.set('redirect', params.redirectUrl);
    url.searchParams.set('origin', params.origin ?? window.location.origin);
    window.location.href = url.toString();
  }

  /**
   * Exchange the token from the redirect callback for wallet session data.
   * Call this on your callback page after orbi.connect().
   * Returns null if no token in URL (user not yet connected).
   */
  async handleCallback(): Promise<{ walletAddress: string; passkeyId: string; email: string } | null> {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return null;

    const res = await fetch(`${this.apiUrl}/v1/auth/tokens/${token}`);
    if (!res.ok) throw new Error('Invalid or expired Orbi token');

    const data = await res.json() as { walletAddress: string; passkeyId: string; email: string };
    return data;
  }

  /**
   * Redirect the user to Orbi to sign a transaction.
   * On return, call handleSignCallback() to get the signed result.
   */
  sign(params: {
    walletAddress: string;
    contractId: string;
    functionName: string;
    argsXdr: string[];
    redirectUrl: string;
    origin?: string;
  }) {
    const url = new URL(`${KEYS_URL}/sign`);
    url.searchParams.set('redirect', params.redirectUrl);
    url.searchParams.set('origin', params.origin ?? window.location.origin);
    url.searchParams.set('walletAddress', params.walletAddress);
    url.searchParams.set('contractId', params.contractId);
    url.searchParams.set('functionName', params.functionName);
    url.searchParams.set('argsXdr', JSON.stringify(params.argsXdr));
    window.location.href = url.toString();
  }

  /**
   * Extract signed transaction data from the URL after orbi.sign() redirect.
   * Returns null if no sign data in URL.
   */
  handleSignCallback(): {
    signedAuthEntryXdr: string;
    quoteId: string;
    argsXdr: string[];
    nativeSacId: string;
    walletAddress: string;
  } | null {
    const params = new URLSearchParams(window.location.search);
    const signedXdr = params.get('signedXdr');
    const quoteId = params.get('quoteId');
    const argsXdrRaw = params.get('argsXdr');
    const nativeSacId = params.get('nativeSacId');
    const walletAddress = params.get('walletAddress');

    if (!signedXdr || !quoteId || !argsXdrRaw || !nativeSacId || !walletAddress) return null;

    return {
      signedAuthEntryXdr: signedXdr,
      quoteId,
      argsXdr: JSON.parse(argsXdrRaw) as string[],
      nativeSacId,
      walletAddress,
    };
  }

  /**
   * Ask the user to add a token to their Orbi wallet so it shows in their balances.
   * Mirrors MetaMask's wallet_watchAsset — useful right after a swap/purchase on a DEX.
   * Redirects the user to Orbi to confirm; on return call handleWatchAssetCallback().
   */
  watchAsset(params: { contractId: string; redirectUrl: string; origin?: string }) {
    const url = new URL(`${KEYS_URL}/watch-asset`);
    url.searchParams.set('contractId', params.contractId);
    url.searchParams.set('redirect', params.redirectUrl);
    url.searchParams.set('origin', params.origin ?? window.location.origin);
    window.location.href = url.toString();
  }

  /**
   * Read the result of watchAsset() from the URL after the redirect back.
   * Returns null if there's no watch-asset result in the URL.
   */
  handleWatchAssetCallback(): { contractId: string; added: boolean } | null {
    const params = new URLSearchParams(window.location.search);
    const contractId = params.get('watchedContractId');
    if (!contractId) return null;
    return { contractId, added: params.get('watched') === 'true' };
  }

  // ── Relay API ───────────────────────────────────────────────────────────────

  /** Submit a signed operation to the Orbi relay for batching + on-chain execution. */
  async bundle(params: {
    walletAddress: string;
    quoteId: string;
    signedAuthEntryXdr: string;
    contractId: string;
    functionName: string;
    argsXdr: string[];
  }): Promise<{ opId: string }> {
    const res = await fetch(`${this.apiUrl}/v1/bundle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: params.walletAddress,
        quoteId: params.quoteId,
        authEntryXdr: params.signedAuthEntryXdr,
        call: {
          contractId: params.contractId,
          function: params.functionName,
          argsXdr: params.argsXdr,
        },
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Bundle failed: ${res.status}`);
    }
    return res.json() as Promise<{ opId: string }>;
  }

  /** Poll for operation status. */
  async getStatus(opId: string): Promise<OpStatus> {
    const res = await fetch(`${this.apiUrl}/v1/status/${opId}`);
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
    return res.json() as Promise<OpStatus>;
  }

  /** Poll until confirmed or failed (max ~60 seconds). */
  async waitForConfirmation(opId: string): Promise<OpStatus> {
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const status = await this.getStatus(opId);
      if (status.status === 'confirmed' || status.status === 'failed') return status;
    }
    throw new Error(`Op ${opId} timed out`);
  }
}
