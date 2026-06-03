'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatePasskey, derivePasskeyId } from '../../lib/passkey';
import BackButton from '../../components/BackButton';
import { saveWallet } from '../../lib/storage';

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;

export default function SignInPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSignIn() {
    setStatus('loading');
    setError('');
    try {
      // Prompt passkey — no credential hint, browser shows all Orbi passkeys
      const credentialId = await authenticatePasskey();

      // Derive the passkeyId the relay knows about (already hex)
      const passkeyId = await derivePasskeyId(credentialId);

      // Look up wallet in relay DB
      const res = await fetch(`${RELAY_URL}/v1/wallet/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkeyId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Wallet not found');
      }

      const { walletAddress, email } = await res.json() as { walletAddress: string; email: string };

      saveWallet({ walletAddress, credentialId, passkeyId, email });
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'Sign in failed');
      setStatus('error');
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#020817]">
      <div className="w-full max-w-sm">
        <div className="mb-8"><BackButton href="/" /></div>
      </div>

      <div className="flex flex-col items-center gap-3 mb-10">
        <img src="/Orbi%20Icon.png" alt="Orbi" className="w-16 h-16 rounded-2xl" />
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="text-slate-400 text-center text-sm max-w-xs">
          Use your passkey to sign in to your Orbi wallet.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <button
          onClick={handleSignIn}
          disabled={status === 'loading'}
          className="w-full py-4 rounded-2xl bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Signing in…
            </>
          ) : (
            'Sign in with passkey'
          )}
        </button>

        {status === 'error' && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <p className="text-slate-600 text-xs text-center">
          Lost access?{' '}
          <a href="/recover" className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            Recover with email
          </a>
        </p>
      </div>
    </main>
  );
}
