import type { OrbiClientConfig, QuoteResult, BundleResult, OpStatus, CallParams } from './types';

const KEYS_URL = 'https://keys.orbiwallet.xyz';
const POPUP_WIDTH = 480;
const POPUP_HEIGHT = 640;

export class OrbiClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(config: OrbiClientConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  // ── Popup helpers ───────────────────────────────────────────────────────────

  private openPopup(url: string): Window | null {
    const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
    const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;
    return window.open(url, 'orbi_popup',
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},popup=1`
    );
  }

  private waitForMessage<T>(channelId: string, expectedType: string, timeout = 120_000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        bc.close();
        reject(new Error('Orbi popup timed out'));
      }, timeout);

      const bc = new BroadcastChannel(channelId);
      bc.onmessage = (e) => {
        if (e.data?.type === expectedType) {
          clearTimeout(timer);
          bc.close();
          resolve(e.data as T);
        } else if (e.data?.type === 'orbi_cancelled') {
          clearTimeout(timer);
          bc.close();
          reject(new Error('User cancelled'));
        }
      };

      // Also listen via window.postMessage fallback
      const handler = (e: MessageEvent) => {
        if (e.data?.type === expectedType) {
          clearTimeout(timer);
          bc.close();
          window.removeEventListener('message', handler);
          resolve(e.data as T);
        } else if (e.data?.type === 'orbi_cancelled') {
          clearTimeout(timer);
          bc.close();
          window.removeEventListener('message', handler);
          reject(new Error('User cancelled'));
        }
      };
      window.addEventListener('message', handler);
    });
  }

  // ── dApp integration ────────────────────────────────────────────────────────

  /**
   * Open the Orbi connect popup.
   * Returns the user's wallet address once they approve.
   */
  async connect(): Promise<string> {
    const channelId = crypto.randomUUID();
    const origin = encodeURIComponent(window.location.origin);
    const url = `${KEYS_URL}/connect?origin=${origin}&channelId=${channelId}`;

    const popup = this.openPopup(url);
    if (!popup) throw new Error('Popup blocked — please allow popups for this site');

    const result = await this.waitForMessage<{ type: string; address: string }>(channelId, 'orbi_connected');
    return result.address;
  }

  /**
   * Open the Orbi sign popup for a transaction.
   * Returns the signed auth entry XDR.
   */
  async signTransaction(params: {
    walletAddress: string;
    contractId: string;
    functionName: string;
    argsXdr: string[];
  }): Promise<string> {
    const channelId = crypto.randomUUID();
    const origin = encodeURIComponent(window.location.origin);
    const argsParam = encodeURIComponent(JSON.stringify(params.argsXdr));
    const url = `${KEYS_URL}/sign?origin=${origin}&channelId=${channelId}`
      + `&walletAddress=${params.walletAddress}`
      + `&contractId=${params.contractId}`
      + `&functionName=${params.functionName}`
      + `&argsXdr=${argsParam}`;

    const popup = this.openPopup(url);
    if (!popup) throw new Error('Popup blocked — please allow popups for this site');

    const result = await this.waitForMessage<{ type: string; signedAuthEntryXdr: string }>(channelId, 'orbi_signed');
    return result.signedAuthEntryXdr;
  }

  // ── Relay API ───────────────────────────────────────────────────────────────

  async quote(params: {
    contractId: string;
    functionName: string;
    argsXdr: string[];
    walletAddress: string;
  }): Promise<QuoteResult> {
    const res = await fetch(`${this.apiUrl}/v1/quote`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Quote failed: ${res.status}`);
    }
    return res.json() as Promise<QuoteResult>;
  }

  async bundle(params: CallParams): Promise<BundleResult> {
    const res = await fetch(`${this.apiUrl}/v1/bundle`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        authEntryXdr: params.authEntryXdr,
        feeAuthEntryXdr: params.feeAuthEntryXdr ?? '',
        quoteId: params.quoteId,
        walletAddress: params.walletAddress,
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
    return res.json() as Promise<BundleResult>;
  }

  async getStatus(opId: string): Promise<OpStatus> {
    const res = await fetch(`${this.apiUrl}/v1/status/${opId}`, {
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
    return res.json() as Promise<OpStatus>;
  }

  async waitForConfirmation(
    opId: string,
    opts?: { intervalMs?: number; maxAttempts?: number },
  ): Promise<OpStatus> {
    const intervalMs = opts?.intervalMs ?? 3000;
    const maxAttempts = opts?.maxAttempts ?? 20;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, intervalMs));
      const status = await this.getStatus(opId);
      if (status.status === 'confirmed' || status.status === 'failed') return status;
    }
    throw new Error(`Op ${opId} timed out waiting for confirmation`);
  }
}
