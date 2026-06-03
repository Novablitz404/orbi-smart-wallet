/**
 * @orbi/sdk — Orbi Smart Wallet SDK
 *
 * Lets any Stellar dApp integrate Orbi passkey wallets.
 * Uses a popup or redirect flow — no browser extensions needed.
 *
 * Quick start (user-pays gas):
 *   const orbi = new OrbiClient({ apiUrl: 'https://api.orbiwallet.xyz' });
 *
 * Quick start (dApp sponsors gas):
 *   const orbi = new OrbiClient({
 *     apiUrl: 'https://api.orbiwallet.xyz',
 *     apiKey: 'your-orbi-api-key',   // <-- enables gas sponsorship
 *   });
 *
 * Flow (popup):
 *   1. Connect  — open Orbi popup, get wallet address back via postMessage
 *   2. Sign     — open Orbi sign popup, get signed auth entry back
 *   3. Bundle   — POST to relay (with API key if sponsoring)
 *   4. Wait     — poll until confirmed
 *
 * Flow (redirect):
 *   1. orbi.connect({ redirectUrl })
 *   2. On callback — orbi.handleCallback()
 *   3. orbi.sign({ ..., redirectUrl })
 *   4. On sign-callback — orbi.handleSignCallback() → orbi.bundle()
 */

import type { OrbiClientConfig, OpStatus, DeployerBalance } from './types';

const KEYS_URL = 'https://keys.orbiwallet.xyz';

export class OrbiClient {
  private apiUrl: string;
  private apiKey?: string;

  constructor(config: OrbiClientConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private authHeaders(): Record<string, string> {
    return this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
  }

  // ── dApp wallet connection ──────────────────────────────────────────────────

  /**
   * Open Orbi as a popup and wait for the user to connect.
   * Resolves with wallet address, passkeyId, and email once connected.
   * Rejects if the user cancels.
   */
  openConnect(): Promise<{ walletAddress: string; passkeyId: string; email: string }> {
    return new Promise((resolve, reject) => {
      const channelId = `orbi_connect_${Date.now()}`;
      const url = new URL(`${KEYS_URL}/connect`);
      url.searchParams.set('channelId', channelId);
      url.searchParams.set('origin', window.location.origin);

      const popup = window.open(url.toString(), 'orbi_connect', 'width=420,height=600');
      if (!popup) return reject(new Error('Popup blocked — allow popups for this site'));

      const bc = new BroadcastChannel(channelId);
      const onMessage = (e: MessageEvent) => {
        if (e.data?.type === 'orbi_connected') {
          bc.removeEventListener('message', onMessage);
          bc.close();
          resolve({ walletAddress: e.data.walletAddress, passkeyId: e.data.passkeyId, email: e.data.email });
        } else if (e.data?.type === 'orbi_cancelled') {
          bc.removeEventListener('message', onMessage);
          bc.close();
          reject(new Error('User cancelled'));
        }
      };
      bc.addEventListener('message', onMessage);

      // Fallback: listen for postMessage in case BroadcastChannel is blocked cross-origin
      window.addEventListener('message', (e) => {
        if (e.data?.type === 'orbi_connected') {
          bc.removeEventListener('message', onMessage);
          bc.close();
          resolve({ walletAddress: e.data.walletAddress, passkeyId: e.data.passkeyId, email: e.data.email });
        }
      }, { once: true });
    });
  }

  /**
   * Open Orbi as a popup and wait for the user to sign a transaction.
   * Returns the signed auth entry XDR and quote ID.
   * If the dApp has an API key with a deployer configured, gas is automatically sponsored.
   */
  openSign(params: {
    walletAddress: string;
    contractId: string;
    functionName: string;
    argsXdr: string[];
  }): Promise<{ signedAuthEntryXdr: string; quoteId: string; argsXdr: string[]; nativeSacId: string }> {
    return new Promise((resolve, reject) => {
      const channelId = `orbi_sign_${Date.now()}`;
      const url = new URL(`${KEYS_URL}/sign`);
      url.searchParams.set('channelId', channelId);
      url.searchParams.set('origin', window.location.origin);
      url.searchParams.set('walletAddress', params.walletAddress);
      url.searchParams.set('contractId', params.contractId);
      url.searchParams.set('functionName', params.functionName);
      url.searchParams.set('argsXdr', JSON.stringify(params.argsXdr));
      if (this.apiKey) url.searchParams.set('apiKey', this.apiKey);

      const popup = window.open(url.toString(), 'orbi_sign', 'width=420,height=600');
      if (!popup) return reject(new Error('Popup blocked — allow popups for this site'));

      const bc = new BroadcastChannel(channelId);
      const onMessage = (e: MessageEvent) => {
        if (e.data?.type === 'orbi_signed') {
          bc.removeEventListener('message', onMessage);
          bc.close();
          resolve({
            signedAuthEntryXdr: e.data.signedAuthEntryXdr,
            quoteId: e.data.quoteId,
            argsXdr: e.data.argsXdr,
            nativeSacId: e.data.nativeSacId,
          });
        } else if (e.data?.type === 'orbi_cancelled') {
          bc.removeEventListener('message', onMessage);
          bc.close();
          reject(new Error('User cancelled'));
        }
      };
      bc.addEventListener('message', onMessage);

      window.addEventListener('message', (e) => {
        if (e.data?.type === 'orbi_signed') {
          bc.removeEventListener('message', onMessage);
          bc.close();
          resolve({
            signedAuthEntryXdr: e.data.signedAuthEntryXdr,
            quoteId: e.data.quoteId,
            argsXdr: e.data.argsXdr,
            nativeSacId: e.data.nativeSacId,
          });
        }
      }, { once: true });
    });
  }

  // ── Redirect flow (alternative to popup) ───────────────────────────────────

  /** Redirect the user to Orbi to connect their wallet. */
  connect(params: { redirectUrl: string }) {
    const url = new URL(`${KEYS_URL}/connect`);
    url.searchParams.set('redirect', params.redirectUrl);
    url.searchParams.set('origin', window.location.origin);
    window.location.href = url.toString();
  }

  /** Exchange the token from the connect redirect for wallet session data. */
  async handleCallback(): Promise<{ walletAddress: string; passkeyId: string; email: string } | null> {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return null;

    const res = await fetch(`${this.apiUrl}/v1/auth/tokens/${token}`);
    if (!res.ok) throw new Error('Invalid or expired Orbi token');
    return res.json() as Promise<{ walletAddress: string; passkeyId: string; email: string }>;
  }

  /** Redirect the user to Orbi to sign a transaction. */
  sign(params: {
    walletAddress: string;
    contractId: string;
    functionName: string;
    argsXdr: string[];
    redirectUrl: string;
  }) {
    const url = new URL(`${KEYS_URL}/sign`);
    url.searchParams.set('redirect', params.redirectUrl);
    url.searchParams.set('origin', window.location.origin);
    url.searchParams.set('walletAddress', params.walletAddress);
    url.searchParams.set('contractId', params.contractId);
    url.searchParams.set('functionName', params.functionName);
    url.searchParams.set('argsXdr', JSON.stringify(params.argsXdr));
    window.location.href = url.toString();
  }

  /** Extract signed transaction data from the URL after orbi.sign() redirect. */
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

  /** Ask the user to add a token to their Orbi wallet (mirrors MetaMask wallet_watchAsset). */
  watchAsset(params: { contractId: string; redirectUrl: string }) {
    const url = new URL(`${KEYS_URL}/watch-asset`);
    url.searchParams.set('contractId', params.contractId);
    url.searchParams.set('redirect', params.redirectUrl);
    url.searchParams.set('origin', window.location.origin);
    window.location.href = url.toString();
  }

  handleWatchAssetCallback(): { contractId: string; added: boolean } | null {
    const params = new URLSearchParams(window.location.search);
    const contractId = params.get('watchedContractId');
    if (!contractId) return null;
    return { contractId, added: params.get('watched') === 'true' };
  }

  // ── Relay API ───────────────────────────────────────────────────────────────

  /**
   * Submit a signed operation to the Orbi relay.
   * If this client was constructed with an apiKey and that key has a deployer
   * configured, the Stellar network fee is automatically paid by the dApp's
   * Stellar account — the user pays nothing for gas.
   */
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
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
      },
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

  // ── Gas sponsorship onboarding ──────────────────────────────────────────────

  /**
   * Register a new developer account with Orbi.
   * Returns a one-time API key — save it, it won't be shown again.
   * Pass deployerPublicKey if you already have a funded Stellar account ready.
   */
  async register(params: {
    developerName: string;
    email: string;
    deployerPublicKey?: string;
  }): Promise<{ apiKey: string; message: string }> {
    const res = await fetch(`${this.apiUrl}/v1/account/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Registration failed: ${res.status}`);
    }
    return res.json() as Promise<{ apiKey: string; message: string }>;
  }

  /**
   * Set or update the Stellar deployer address for this API key.
   * Call this after:
   *   1. Generating a Stellar keypair (e.g. with Stellar Laboratory)
   *   2. Funding the account with XLM
   *   3. Adding Orbi's relay key (GAQC2DZFSROS52IVXZSTA7RBYDAQDOTAKYTDPJPBLVWSRJO6ZETQKYIA)
   *      as a co-signer on your Stellar account
   * After this, all bundle() calls using this client will have gas sponsored automatically.
   */
  async setDeployer(deployerPublicKey: string): Promise<void> {
    if (!this.apiKey) throw new Error('apiKey required — pass it in the OrbiClient constructor');
    const res = await fetch(`${this.apiUrl}/v1/account/deployer`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
      },
      body: JSON.stringify({ deployerPublicKey }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Set deployer failed: ${res.status}`);
    }
  }

  /**
   * Check the XLM balance of your configured deployer account.
   * Use this to monitor your gas tank and top it up when low.
   */
  async getDeployerBalance(): Promise<DeployerBalance> {
    if (!this.apiKey) throw new Error('apiKey required — pass it in the OrbiClient constructor');
    const res = await fetch(`${this.apiUrl}/v1/account/balance`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Balance fetch failed: ${res.status}`);
    }
    return res.json() as Promise<DeployerBalance>;
  }
}
