'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadWallet } from '../../lib/storage';

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;

export default function SignCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'bundling' | 'confirming' | 'confirmed' | 'error'>('bundling');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signedXdr = params.get('signedXdr');
    const quoteId = params.get('quoteId');
    const argsXdrRaw = params.get('argsXdr');
    const nativeSacId = params.get('nativeSacId');
    const walletAddress = params.get('walletAddress');

    if (!signedXdr || !quoteId || !argsXdrRaw || !nativeSacId || !walletAddress) {
      setError('Invalid sign callback — missing parameters');
      setStatus('error');
      return;
    }

    const argsXdr = JSON.parse(argsXdrRaw) as string[];

    fetch(`${RELAY_URL}/v1/bundle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        quoteId,
        authEntryXdr: signedXdr,
        call: { contractId: nativeSacId, function: 'transfer', argsXdr },
      }),
    })
      .then(res => res.json() as Promise<{ opId?: string; error?: string }>)
      .then(async data => {
        if (!data.opId) throw new Error(data.error ?? 'Bundle failed');
        setStatus('confirming');

        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const s = await fetch(`${RELAY_URL}/v1/status/${data.opId}`).then(r => r.json()) as { status: string; txHash: string | null };
          if (s.status === 'confirmed' && s.txHash) {
            setTxHash(s.txHash);
            setStatus('confirmed');
            return;
          }
          if (s.status === 'failed') {
            setError('Transaction failed on-chain');
            setStatus('error');
            return;
          }
        }
        setError('Timed out waiting for confirmation');
        setStatus('error');
      })
      .catch(err => {
        setError(err.message);
        setStatus('error');
      });
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#020817]">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {(status === 'bundling' || status === 'confirming') && (
          <>
            <svg className="animate-spin w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-white font-semibold">
              {status === 'bundling' ? 'Submitting…' : 'Confirming on Stellar…'}
            </p>
            <p className="text-slate-400 text-sm">Usually takes 5–10 seconds</p>
          </>
        )}

        {status === 'confirmed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Confirmed!</h2>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-xs font-mono break-all text-center hover:underline"
            >
              {txHash.slice(0, 16)}…{txHash.slice(-8)} ↗
            </a>
            <button onClick={() => router.push('/dashboard')} className="mt-2 w-full max-w-xs py-4 rounded-2xl bg-white text-slate-900 font-semibold">
              Back to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="text-red-400 text-sm text-center">{error}</p>
            <button onClick={() => router.push('/dashboard')} className="text-blue-400 text-sm hover:underline">Try again</button>
          </>
        )}
      </div>
    </main>
  );
}
