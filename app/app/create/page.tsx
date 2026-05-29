'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPasskey } from '../../lib/passkey';
import { createWallet } from '../../lib/relay';
import { saveWallet } from '../../lib/storage';

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;

type Step = 'email' | 'passkey' | 'deploying' | 'done';
type EmailStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function CreateWalletPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!email.trim() || !email.includes('@')) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${RELAY_URL}/v1/wallet/check-email?email=${encodeURIComponent(email)}`);
        const { available } = await res.json() as { available: boolean };
        setEmailStatus(available ? 'available' : 'taken');
      } catch {
        setEmailStatus('idle');
      }
    }, 500);
  }, [email]);

  async function handleCreate() {
    if (!email.trim() || emailStatus === 'taken') return;
    setError('');
    setLoading(true);

    try {
      const credential = await createPasskey(email, email);
      setStep('deploying');
      const { walletAddress } = await createWallet({
        passkeyId: credential.passkeyId,
        publicKey: credential.publicKey,
        email,
      });

      saveWallet({
        walletAddress,
        credentialId: credential.credentialId,
        passkeyId: credential.passkeyId,
        email,
      });

      setWalletAddress(walletAddress);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('passkey');
    } finally {
      setLoading(false);
    }
  }

  const canContinue = email.trim() && emailStatus !== 'taken' && emailStatus !== 'checking';

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#020817]">
      <div className="w-full max-w-sm">
        <a href="/" className="text-slate-500 hover:text-slate-300 text-sm mb-8 flex items-center gap-1">
          ← Back
        </a>

        {step === 'email' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Create your wallet</h2>
              <p className="text-slate-400 text-sm mt-1">Enter your email. Your Face ID will secure your wallet.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canContinue && setStep('passkey')}
                className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  emailStatus === 'taken'
                    ? 'border-red-500 focus:border-red-400'
                    : emailStatus === 'available'
                    ? 'border-green-500 focus:border-green-400'
                    : 'border-slate-700 focus:border-blue-500'
                }`}
              />

              {emailStatus === 'checking' && (
                <p className="text-slate-500 text-xs flex items-center gap-1.5">
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Checking availability…
                </p>
              )}
              {emailStatus === 'taken' && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  This email already has a wallet.{' '}
                  <a href="/signin" className="underline hover:text-red-300">Sign in instead</a>
                </p>
              )}
              {emailStatus === 'available' && (
                <p className="text-green-400 text-xs flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email available
                </p>
              )}
            </div>

            <button
              onClick={() => canContinue && setStep('passkey')}
              disabled={!canContinue}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'passkey' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Secure with Face ID</h2>
              <p className="text-slate-400 text-sm mt-1">
                Your device will ask you to authenticate. This creates your wallet key — no seed phrase needed.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11c0-2.76 2.24-5 5-5s5 2.24 5 5v2M5 11v2a7 7 0 0014 0v-2M12 18v2m-3-2h6" />
                </svg>
              </div>
              <p className="text-slate-300 text-sm text-center">
                Creating wallet for<br />
                <span className="text-white font-medium">{email}</span>
              </p>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Preparing…' : 'Create with Face ID'}
            </button>
          </div>
        )}

        {step === 'deploying' && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <svg className="animate-spin w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Deploying your wallet</h2>
              <p className="text-slate-400 text-sm mt-2">
                Publishing your smart contract to Stellar.<br />This takes about 10 seconds.
              </p>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Wallet created!</h2>
              <p className="text-slate-400 text-sm text-center">Your smart wallet is ready on Stellar.</p>
            </div>

            <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
              <p className="text-slate-500 text-xs mb-1">Your wallet address</p>
              <p className="text-slate-200 text-xs font-mono break-all">{walletAddress}</p>
            </div>

            <p className="text-slate-500 text-xs text-center">
              Your wallet is live on Stellar. Send this address to receive XLM.
            </p>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
