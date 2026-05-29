'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { xdr, Address, Networks, Asset, nativeToScVal } from '@stellar/stellar-sdk';
import { loadWallet } from '../../lib/storage';
import { signAuthEntryWithPasskey } from '../../lib/authEntry';

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;
const STROOPS_PER_XLM = 10_000_000;
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

type Step = 'form' | 'quoting' | 'confirm' | 'signing' | 'submitted' | 'error';

interface Quote {
  quoteId: string;
  feeStroops: number;
  feeXlm: string;
  authEntryXdr: string;
  currentLedger: number;
  nativeSacId: string;
}

export default function SendPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [opId, setOpId] = useState('');
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState<ReturnType<typeof loadWallet>>(null);

  useEffect(() => {
    const w = loadWallet();
    if (!w) { router.replace('/'); return; }
    setWallet(w);
  }, [router]);

  function buildTransferArgs(from: string, recipient: string, stroops: number): xdr.ScVal[] {
    return [
      new Address(from).toScVal(),
      new Address(recipient).toScVal(),
      nativeToScVal(BigInt(stroops), { type: 'i128' }),
    ];
  }

  async function handlePreview() {
    if (!wallet || !to.trim() || !amount) return;
    setStep('quoting');
    setError('');

    try {
      const amountStroops = Math.round(parseFloat(amount) * STROOPS_PER_XLM);
      const nativeSacId = Asset.native().contractId(NETWORK_PASSPHRASE);
      const args = buildTransferArgs(wallet.walletAddress, to, amountStroops);
      const argsXdr = args.map(a => Buffer.from(a.toXDR()).toString('base64'));

      const res = await fetch(`${RELAY_URL}/v1/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer dev' },
        body: JSON.stringify({
          walletAddress: wallet.walletAddress,
          contractId: nativeSacId,
          functionName: 'transfer',
          argsXdr,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Quote failed');
      }

      setQuote(await res.json() as Quote);
      setStep('confirm');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Quote failed');
      setStep('error');
    }
  }

  async function handleSend() {
    if (!wallet || !quote) return;
    setStep('signing');
    setError('');

    try {
      const amountStroops = Math.round(parseFloat(amount) * STROOPS_PER_XLM);
      const args = buildTransferArgs(wallet.walletAddress, to, amountStroops);

      // Deserialize the pre-built combined auth entry from the relay
      const entry = xdr.SorobanAuthorizationEntry.fromXDR(
        Buffer.from(quote.authEntryXdr, 'base64'),
      );

      // One Face ID prompt signs fee transfer + user op together
      const { authEntryXdr, argsXdr } = await signAuthEntryWithPasskey({
        entry,
        args,
        credentialId: wallet.credentialId,
        currentLedger: quote.currentLedger,
      });

      const res = await fetch(`${RELAY_URL}/v1/bundle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer dev' },
        body: JSON.stringify({
          walletAddress: wallet.walletAddress,
          quoteId: quote.quoteId,
          authEntryXdr,
          call: {
            contractId: quote.nativeSacId,
            function: 'transfer',
            argsXdr,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Bundle failed');
      }

      const { opId: id } = await res.json() as { opId: string };
      setOpId(id);
      setStep('submitted');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Send failed');
      setStep('error');
    }
  }

  if (!wallet) return null;

  return (
    <main className="flex flex-col min-h-screen bg-[#020817] px-4">
      <div className="flex items-center gap-3 pt-6 pb-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
          ← Back
        </button>
        <h1 className="text-white font-semibold">Send</h1>
      </div>

      {(step === 'form' || step === 'quoting' || step === 'confirm') && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-slate-400 text-sm">To</label>
            <input
              type="text"
              placeholder="G... or C..."
              value={to}
              onChange={e => setTo(e.target.value)}
              disabled={step !== 'form'}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-slate-400 text-sm">Amount (XLM)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={step !== 'form'}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-xl font-semibold disabled:opacity-60"
            />
          </div>

          <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-4 flex justify-between text-sm">
            <span className="text-slate-500">Orbi fee</span>
            <span className="text-slate-300">
              {step === 'quoting' ? (
                <span className="animate-pulse">Calculating…</span>
              ) : quote ? (
                `${quote.feeXlm} XLM`
              ) : '—'}
            </span>
          </div>

          {step === 'form' && (
            <button
              onClick={handlePreview}
              disabled={!to.trim() || !amount}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-40 mt-2"
            >
              Preview
            </button>
          )}

          {step === 'confirm' && quote && (
            <button
              onClick={handleSend}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors mt-2"
            >
              Send with Face ID
            </button>
          )}
        </div>
      )}

      {step === 'signing' && (
        <div className="flex flex-col items-center gap-4 py-16">
          <svg className="animate-spin w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-white font-semibold">Waiting for Face ID…</p>
          <p className="text-slate-400 text-sm text-center">Signing fee + transfer in one prompt</p>
        </div>
      )}

      {step === 'submitted' && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Submitted!</h2>
          <p className="text-slate-400 text-sm text-center">
            Your transaction is being processed.<br />
            <span className="font-mono text-xs text-slate-500 break-all">{opId}</span>
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 w-full max-w-xs py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {step === 'error' && (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-red-400 text-sm text-center">{error}</p>
          <button
            onClick={() => { setStep('form'); setQuote(null); setError(''); }}
            className="text-blue-400 text-sm hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
