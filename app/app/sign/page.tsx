'use client';

import { useEffect, useState } from 'react';
import { xdr, Address, Networks, Asset, nativeToScVal } from '@stellar/stellar-sdk';
import { loadWallet } from '../../lib/storage';
import { signAuthEntryWithPasskey } from '../../lib/authEntry';

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
const STROOPS_PER_XLM = 10_000_000;

type Step = 'loading' | 'review' | 'signing' | 'done' | 'error';

interface SignRequest {
  channelId: string;
  walletAddress: string;
  contractId: string;
  functionName: string;
  argsXdr: string[];
  origin: string;
}

/**
 * keys.orbiwallet.xyz/sign
 *
 * Opened as a popup by dApps when they need the user to sign a transaction.
 * URL params:
 *   channelId     — BroadcastChannel name for result
 *   origin        — dApp origin (for display)
 *   walletAddress — the wallet to sign with
 *   contractId    — contract being called
 *   functionName  — function name
 *   argsXdr       — base64 ScVal args (JSON array)
 *
 * Flow:
 *   1. Show what the dApp is asking the user to authorize
 *   2. User taps "Approve" → Face ID → signs auth entry
 *   3. Post { type: 'orbi_signed', signedAuthEntryXdr } back
 *   4. Popup closes
 */
export default function SignPage() {
  const [step, setStep] = useState<Step>('loading');
  const [req, setReq] = useState<SignRequest | null>(null);
  const [trusted, setTrusted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r: SignRequest = {
      channelId: params.get('channelId') ?? '',
      walletAddress: params.get('walletAddress') ?? '',
      contractId: params.get('contractId') ?? '',
      functionName: params.get('functionName') ?? '',
      argsXdr: JSON.parse(params.get('argsXdr') ?? '[]') as string[],
      origin: params.get('origin') ?? '',
    };

    if (!r.walletAddress || !r.contractId || !r.functionName) {
      setError('Invalid sign request — missing parameters');
      setStep('error');
      return;
    }

    setReq(r);

    // Check if this dApp has previously been granted permission
    if (r.walletAddress && r.origin) {
      fetch(`${RELAY_URL}/v1/connections/check?walletAddress=${r.walletAddress}&origin=${encodeURIComponent(r.origin)}`)
        .then(res => res.json())
        .then((d: { connected?: boolean }) => setTrusted(d.connected ?? false))
        .catch(() => setTrusted(false));
    }

    setStep('review');
  }, []);

  function sendResult(signedAuthEntryXdr: string) {
    const msg = { type: 'orbi_signed', signedAuthEntryXdr };

    if (req?.channelId) {
      const bc = new BroadcastChannel(req.channelId);
      bc.postMessage(msg);
      bc.close();
    }
    try {
      if (window.opener) window.opener.postMessage(msg, '*');
    } catch { /* COOP */ }

    setTimeout(() => window.close(), 500);
  }

  function sendCancel() {
    const msg = { type: 'orbi_cancelled' };
    if (req?.channelId) {
      const bc = new BroadcastChannel(req.channelId);
      bc.postMessage(msg);
      bc.close();
    }
    try {
      if (window.opener) window.opener.postMessage(msg, '*');
    } catch { /* COOP */ }
    window.close();
  }

  async function handleSign() {
    if (!req) return;
    setStep('signing');
    setError('');

    try {
      const wallet = loadWallet();
      if (!wallet) throw new Error('Not signed in');

      const nativeSacId = Asset.native().contractId(NETWORK_PASSPHRASE);
      const args = req.argsXdr.map(a => xdr.ScVal.fromXDR(Buffer.from(a, 'base64')));

      // Get quote for the fee + build combined auth entry
      const quoteRes = await fetch(`${RELAY_URL}/v1/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: req.walletAddress,
          contractId: req.contractId,
          functionName: req.functionName,
          argsXdr: req.argsXdr,
        }),
      });
      if (!quoteRes.ok) throw new Error('Failed to get fee quote');
      const quote = await quoteRes.json() as { authEntryXdr: string; currentLedger: number; nativeSacId: string; feeXlm: string };

      const entry = xdr.SorobanAuthorizationEntry.fromXDR(Buffer.from(quote.authEntryXdr, 'base64'));

      const { authEntryXdr: signedXdr, argsXdr: signedArgs } = await signAuthEntryWithPasskey({
        entry,
        args,
        credentialId: wallet.credentialId,
        passkeyId: wallet.passkeyId,
        currentLedger: quote.currentLedger,
      });

      sendResult(signedXdr);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signing failed');
      setStep('error');
    }
  }

  const appName = req?.origin ? (() => { try { return new URL(req.origin).hostname; } catch { return req.origin; } })() : 'this app';
  const isTransfer = req?.functionName === 'transfer' && req.argsXdr.length >= 3;
  let transferAmount = '';
  if (isTransfer) {
    try {
      const amountScVal = xdr.ScVal.fromXDR(Buffer.from(req!.argsXdr[2], 'base64'));
      const i128 = amountScVal.i128();
      const stroops = BigInt(i128.lo().toString());
      transferAmount = (Number(stroops) / STROOPS_PER_XLM).toFixed(2);
    } catch { /* ignore */ }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 bg-[#020817]">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <span className="text-white text-xl font-bold">O</span>
        </div>

        {step === 'loading' && (
          <div className="animate-pulse text-slate-500 text-sm">Loading…</div>
        )}

        {step === 'review' && req && (
          <>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">Approve Transaction</h1>
              <p className="text-slate-400 text-sm mt-1">{appName} is requesting your signature</p>
              {!trusted && (
                <p className="mt-2 text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5">
                  ⚠ New connection — {appName} hasn't connected before
                </p>
              )}
              {trusted && (
                <p className="mt-2 text-xs text-green-500/80 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                  ✓ Trusted — you've connected to {appName} before
                </p>
              )}
            </div>

            <div className="w-full rounded-2xl bg-slate-800/50 border border-slate-700 p-4 flex flex-col gap-3 text-sm">
              {isTransfer ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Action</span>
                    <span className="text-white font-medium">Send XLM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-white font-medium">{transferAmount} XLM</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Function</span>
                    <span className="text-white font-mono text-xs">{req.functionName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contract</span>
                    <span className="text-white font-mono text-xs">{req.contractId.slice(0, 8)}…</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Requested by</span>
                <span className="text-white">{appName}</span>
              </div>
            </div>

            <button
              onClick={handleSign}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              Approve with Face ID
            </button>

            <button onClick={sendCancel} className="text-slate-500 text-sm hover:text-slate-300">
              Reject
            </button>
          </>
        )}

        {step === 'signing' && (
          <>
            <svg className="animate-spin w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-white text-sm">Waiting for Face ID…</p>
          </>
        )}

        {step === 'done' && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold">Signed!</p>
            <p className="text-slate-500 text-xs">Returning to {appName}…</p>
          </>
        )}

        {step === 'error' && (
          <>
            <p className="text-red-400 text-sm text-center">{error}</p>
            <button onClick={() => setStep('review')} className="text-blue-400 text-sm hover:underline">
              Try again
            </button>
            <button onClick={sendCancel} className="text-slate-500 text-sm hover:text-slate-300">
              Cancel
            </button>
          </>
        )}
      </div>
    </main>
  );
}
