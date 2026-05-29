import type { OrbiClientConfig, QuoteResult, BundleResult, OpStatus, CallParams } from './types';

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

  /** Get a gas fee quote for an operation. Call this before asking the user to sign. */
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

  /** Submit a signed auth entry to the bundler. */
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

  /** Poll for op status. */
  async getStatus(opId: string): Promise<OpStatus> {
    const res = await fetch(`${this.apiUrl}/v1/status/${opId}`, {
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
    return res.json() as Promise<OpStatus>;
  }

  /** Poll until confirmed or failed. */
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
