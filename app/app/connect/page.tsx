'use client';

import { useEffect, useState } from 'react';
import { authenticatePasskey, derivePasskeyId } from '../../lib/passkey';
import { loadWallet, saveWallet } from '../../lib/storage';

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;

type Step = 'loading' | 'connect' | 'connecting' | 'done' | 'error';

/**
 * keys.orbiwallet.xyz/connect
 *
 * Opened as a popup by dApps via the @orbi/sdk.
 * URL params:
 *   origin   — the dApp's origin (for display)
 *   channelId — BroadcastChannel name to send the result back
 *
 * Flow:
 *   1. User taps "Connect with Face ID"
 *   2. Passkey auth → derive passkeyId → relay lookup → get wallet address
 *   3. Post { type: 'orbi_connected', address } to opener via postMessage + BroadcastChannel
 *   4. Popup closes
 */
export default function ConnectPage() {
  const [step, setStep] = useState<Step>('loading');
  const [origin, setOrigin] = useState('');
  const [channelId, setChannelId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const o = params.get('origin') ?? '';
    const c = params.get('channelId') ?? '';
    setOrigin(o);
    setChannelId(c);

    // Already signed in — auto-connect
    const existing = loadWallet();
    if (existing) {
      sendResult(existing.walletAddress, c);
      setStep('done');
      return;
    }

    setStep('connect');
  }, []);

  function sendResult(address: string, channel: string) {
    const msg = { type: 'orbi_connected', address };

    // Primary: BroadcastChannel (works even with COOP headers)
    if (channel) {
      const bc = new BroadcastChannel(channel);
      bc.postMessage(msg);
      bc.close();
    }

    // Fallback: postMessage to opener
    try {
      if (window.opener) window.opener.postMessage(msg, '*');
    } catch { /* COOP may block this */ }

    setTimeout(() => window.close(), 500);
  }

  async function handleConnect() {
    setStep('connecting');
    setError('');
    try {
      const credentialId = await authenticatePasskey();
      const passkeyId = await derivePasskeyId(credentialId);

      const res = await fetch(`${RELAY_URL}/v1/wallet/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkeyId }),
      });

      if (!res.ok) throw new Error('Wallet not found. Create one at account.orbiwallet.xyz');
      const { walletAddress, email } = await res.json() as { walletAddress: string; email: string };

      saveWallet({ walletAddress, credentialId, passkeyId, email });
      sendResult(walletAddress, channelId);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setStep('error');
    }
  }

  const appName = origin ? new URL(origin).hostname : 'this app';

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 bg-[#020817]">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Orbi logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <span className="text-white text-xl font-bold">O</span>
        </div>

        {step === 'loading' && (
          <div className="animate-pulse text-slate-500 text-sm">Loading…</div>
        )}

        {step === 'connect' && (
          <>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">Connect to {appName}</h1>
              <p className="text-slate-400 text-sm mt-2">
                Sign in with Face ID to connect your Orbi wallet.
              </p>
            </div>

            <div className="w-full rounded-2xl bg-slate-800/50 border border-slate-700 p-4 flex flex-col gap-3 text-sm">
              <p className="text-slate-400">This will allow <span className="text-white">{appName}</span> to:</p>
              <div className="flex items-center gap-2 text-slate-300">
                <span>✓</span> See your wallet address
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span>✓</span> Request transaction signatures
              </div>
            </div>

            <button
              onClick={handleConnect}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              Connect with Face ID
            </button>

            <button onClick={() => window.close()} className="text-slate-500 text-sm hover:text-slate-300">
              Cancel
            </button>
          </>
        )}

        {step === 'connecting' && (
          <>
            <svg className="animate-spin w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-white text-sm">Connecting…</p>
          </>
        )}

        {step === 'done' && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold">Connected!</p>
            <p className="text-slate-500 text-xs">You can close this window.</p>
          </>
        )}

        {step === 'error' && (
          <>
            <p className="text-red-400 text-sm text-center">{error}</p>
            <button onClick={() => setStep('connect')} className="text-blue-400 text-sm hover:underline">
              Try again
            </button>
            <button onClick={() => window.close()} className="text-slate-500 text-sm hover:text-slate-300">
              Cancel
            </button>
          </>
        )}
      </div>
    </main>
  );
}
