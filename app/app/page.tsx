'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadWallet } from '../lib/storage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (loadWallet()) router.replace('/dashboard');
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#020817]">
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <span className="text-white text-2xl font-bold">O</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Orbi Wallet</h1>
        <p className="text-slate-400 text-center max-w-xs text-sm">
          The first smart wallet on Stellar.<br />
          No seed phrase. No gas. Just your face.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <a
          href="/create"
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-center transition-colors shadow-lg shadow-blue-600/30"
        >
          Create Wallet
        </a>
        <a
          href="/signin"
          className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-center transition-colors border border-slate-700"
        >
          Sign In
        </a>
      </div>

      <p className="mt-8 text-slate-600 text-xs text-center">
        Lost access?{' '}
        <a href="/recover" className="text-blue-500 hover:underline">
          Recover with email
        </a>
      </p>
    </main>
  );
}
