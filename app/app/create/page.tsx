'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPasskey } from '../../lib/passkey';
import { createWallet } from '../../lib/relay';
import { saveWallet } from '../../lib/storage';

type Step = 'email' | 'passkey' | 'done';

export default function CreateWalletPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  async function handleCreate() {
    if (!email.trim()) return;
    setError('');
    setLoading(true);

    try {
      const credential = await createPasskey(email, email);
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#020817]">
      <div className="w-full max-w-sm">
        {/* Back */}
        <a href="/" className="text-slate-500 hover:text-slate-300 text-sm mb-8 flex items-center gap-1">
          ← Back
        </a>

        {step === 'email' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Create your wallet</h2>
              <p className="text-slate-400 text-sm mt-1">Enter your email. Your Face ID will secure your wallet.</p>
            </div>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setStep('passkey')}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={() => {
                if (!email.trim()) return;
                setStep('passkey');
              }}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50"
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
              {loading ? 'Creating wallet…' : 'Create with Face ID'}
            </button>
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
              Your wallet will be deployed on-chain the first time you send a transaction.
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
