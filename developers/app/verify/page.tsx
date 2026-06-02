'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL ?? 'https://api.orbiwallet.xyz';
const SESSION_KEY = 'orbi_dev_session';

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('Missing token — check the link in your email.');
      setStatus('error');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${RELAY_URL}/v1/dev/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? 'Verification failed');
        }

        const { sessionToken, expiresAt } = await res.json() as { sessionToken: string; expiresAt: string };
        localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionToken, expiresAt }));
        router.replace('/dashboard');
      } catch (err: any) {
        setError(err.message ?? 'Verification failed');
        setStatus('error');
      }
    })();
  }, [params, router]);

  if (status === 'error') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-sm bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Link expired or invalid</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <a
            href="/"
            className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Request a new link
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Signing you in...</p>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
