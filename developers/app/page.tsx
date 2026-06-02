'use client';

import { useState } from 'react';
import Image from 'next/image';

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL ?? 'https://api.orbiwallet.xyz';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setError('');

    try {
      await fetch(`${RELAY_URL}/v1/dev/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Always show "check your inbox" — never reveal whether email exists
      setStatus('sent');
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">

        <div className="flex justify-center mb-10">
          <Image
            src="https://account.orbiwallet.xyz/Orbi%20logo%20-%20Landscape%20white.png"
            alt="Orbi"
            width={140}
            height={40}
            style={{ height: 'auto' }}
            unoptimized
          />
        </div>

        {status === 'sent' ? (
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Check your inbox</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              If <span className="text-slate-300">{email}</span> is registered, we sent a sign-in link. It expires in 15 minutes.
            </p>
            <button
              onClick={() => { setStatus('idle'); setEmail(''); }}
              className="mt-6 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">Developer Portal</p>
            <h1 className="text-2xl font-bold text-white mb-1">Sign in</h1>
            <p className="text-slate-400 text-sm mb-8">
              Enter your registered email and we&apos;ll send you a magic link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="dev@yourdapp.xyz"
                  required
                  className="w-full bg-[#020817] border border-[#334155] rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                {status === 'loading' ? 'Sending...' : 'Send magic link'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#1e293b]">
              <p className="text-slate-500 text-xs text-center">
                Don&apos;t have an account?{' '}
                <a href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Register your dApp
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
