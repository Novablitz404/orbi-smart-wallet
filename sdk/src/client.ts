/**
 * @orbi-wallet/sdk — Orbi Smart Wallet SDK
 *
 * Lets any Stellar dApp integrate Orbi passkey wallets using a redirect flow.
 * Works on all devices and browsers — no popups, no extensions needed.
 *
 * Quick start (user pays gas):
 *   const orbi = new OrbiClient({ apiUrl: 'https://api.orbiwallet.xyz' });
 *
 * Quick start (dApp sponsors gas):
 *   const orbi = new OrbiClient({
 *     apiUrl: 'https://api.orbiwallet.xyz',
 *     apiKey: 'YOUR_API_KEY',  // <-- enables gasless
 *   });
 *
 * Flow:
 *   1. orbi.connect({ redirectUrl })          — redirect user to connect wallet
 *   2. orbi.handleCallback()                  — on return, exchange token for wallet data
 *   3. orbi.sign({ ..., redirectUrl })        — redirect user to approve transaction
 *   4. orbi.handleSignCallback() → bundle()   — on return, submit signed tx
 *   5. orbi.waitForConfirmation(opId)         — wait for on-chain confirmation
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

  // ── Wallet connection ───────────────────────────────────────────────────────

  /** Redirect the user to Orbi to connect their wallet. */
  connect(params: { redirectUrl: string }) {
    const url = new URL(`${KEYS_URL}/connect`);
    url.searchParams.set('redirect', params.redirectUrl);
    url.searchParams.set('origin', window.location.origin);
    window.location.href = url.toString();
  }

  /** Call this on your callback page after orbi.connect() redirects back. */
  async handleCallback(): Promise<{ walletAddress: string; passkeyId: string; email: string } | null> {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return null;

    const res = await fetch(`${this.apiUrl}/v1/auth/tokens/${token}`);
    if (!res.ok) throw new Error('Invalid or expired Orbi token');
    return res.json() as Promise<{ walletAddress: string; passkeyId: string; email: string }>;
  }

  // ── Transaction signing ─────────────────────────────────────────────────────

  /**
   * Redirect the user to Orbi to approve a transaction with their passkey.
   * If apiKey is set, the user will see the fee as sponsored — they pay nothing.
   */
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
    if (this.apiKey) url.searchParams.set('apiKey', this.apiKey);
    window.location.href = url.toString();
  }

  /** Call this on your sign-callback page after orbi.sign() redirects back. */
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

  // ── Token management ────────────────────────────────────────────────────────

  /** Redirect the user to add a token to their Orbi wallet. */
  watchAsset(params: { contractId: string; redirectUrl: string }) {
    const url = new URL(`${KEYS_URL}/watch-asset`);
    url.searchParams.set('contractId', params.contractId);
    url.searchParams.set('redirect', params.redirectUrl);
    url.searchParams.set('origin', window.location.origin);
    window.location.href = url.toString();
  }

  /** Call this on your callback page after orbi.watchAsset() redirects back. */
  handleWatchAssetCallback(): { contractId: string; added: boolean } | null {
    const params = new URLSearchParams(window.location.search);
    const contractId = params.get('watchedContractId');
    if (!contractId) return null;
    return { contractId, added: params.get('watched') === 'true' };
  }

  // ── Relay API ───────────────────────────────────────────────────────────────

  /**
   * Submit a signed operation to the Orbi relay.
   * If apiKey is set and a deployer is configured, gas is sponsored automatically.
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

  /** One-shot status check for an operation. */
  async getStatus(opId: string): Promise<OpStatus> {
    const res = await fetch(`${this.apiUrl}/v1/status/${opId}`);
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
    return res.json() as Promise<OpStatus>;
  }

  /** Wait for confirmed or failed via SSE (~5s on Stellar). */
  waitForConfirmation(opId: string): Promise<OpStatus> {
    return new Promise((resolve, reject) => {
      const es = new EventSource(`${this.apiUrl}/v1/wallet/events/${opId}`);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data as string) as { status: string; txHash?: string; error?: string };
          es.close();
          if (data.status === 'confirmed') {
            resolve({ opId, status: 'confirmed', txHash: data.txHash ?? null, error: null });
          } else if (data.status === 'failed') {
            resolve({ opId, status: 'failed', txHash: null, error: data.error ?? 'Transaction failed' });
          } else if (data.status === 'timeout') {
            reject(new Error(`Op ${opId} timed out`));
          }
        } catch {
          es.close();
          reject(new Error('Invalid SSE response'));
        }
      };
      es.onerror = () => {
        es.close();
        reject(new Error(`Lost connection waiting for op ${opId}`));
      };
    });
  }

  // ── Gas sponsorship onboarding ──────────────────────────────────────────────

  /** Register a new developer account. Returns a one-time API key — save it. */
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

  /** Set or update the deployer (gas tank) address for this API key. */
  async setDeployer(deployerPublicKey: string): Promise<void> {
    if (!this.apiKey) throw new Error('apiKey required — pass it in the OrbiClient constructor');
    const res = await fetch(`${this.apiUrl}/v1/account/deployer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify({ deployerPublicKey }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Set deployer failed: ${res.status}`);
    }
  }

  /** Check the XLM balance of your gas tank. */
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
