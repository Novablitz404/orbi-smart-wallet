'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL ?? 'https://api.orbiwallet.xyz';

export default function RegisterPage() {
  const [form, setForm] = useState({ developerName: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const res = await fetch(`${RELAY_URL}/v1/account/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ developerName: form.developerName.trim(), email: form.email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Registration failed');
      }
      const data = await res.json() as { apiKey: string };
      setApiKey(data.apiKey);
      setStatus('done');
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
      setStatus('error');
    }
  }

  async function copyKey() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {status === 'done' ? (
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You&apos;re registered</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Save your API key below — this is the <strong className="text-white">only time</strong> it will be shown.
            </p>

            <div className="bg-[#020817] border border-[#334155] rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">API Key</p>
              <div className="flex items-center gap-3">
                <code className="text-green-400 text-sm break-all flex-1">{apiKey}</code>
                <button
                  onClick={copyKey}
                  className="shrink-0 text-slate-400 hover:text-white transition-colors"
                  title="Copy"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Link
              href="/"
              className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors mt-2"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">Developer Portal</p>
            <h1 className="text-2xl font-bold text-white mb-1">Register your dApp</h1>
            <p className="text-slate-400 text-sm mb-8">
              Get an API key to enable gas sponsorship for your users.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  App / company name
                </label>
                <input
                  type="text"
                  value={form.developerName}
                  onChange={e => setForm(f => ({ ...f, developerName: e.target.value }))}
                  placeholder="MyDex"
                  required
                  className="w-full bg-[#020817] border border-[#334155] rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="dev@mydex.xyz"
                  required
                  className="w-full bg-[#020817] border border-[#334155] rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {(status === 'error') && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                {status === 'loading' ? 'Registering...' : 'Create account'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#1e293b]">
              <p className="text-slate-500 text-xs text-center">
                Already registered?{' '}
                <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
