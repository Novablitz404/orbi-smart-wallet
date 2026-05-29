'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadWallet, clearWallet } from '../../lib/storage';

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<ReturnType<typeof loadWallet>>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const w = loadWallet();
    if (!w) { router.replace('/'); return; }
    setWallet(w);
  }, [router]);

  function copyAddress() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function signOut() {
    clearWallet();
    router.replace('/');
  }

  if (!wallet) return null;

  return (
    <main className="flex flex-col min-h-screen bg-[#020817] px-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
          <span className="text-white font-semibold">Orbi</span>
        </div>
        <button onClick={signOut} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
          Sign out
        </button>
      </div>

      {/* Balance card */}
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 p-6 flex flex-col items-center gap-2">
        <p className="text-slate-400 text-sm">Total Balance</p>
        <p className="text-4xl font-bold text-white">0 XLM</p>
        <p className="text-slate-500 text-xs">≈ $0.00 USD</p>

        {/* Address */}
        <button
          onClick={copyAddress}
          className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 text-xs hover:bg-slate-700/50 transition-colors"
        >
          <span className="font-mono">{truncate(wallet.walletAddress)}</span>
          <span>{copied ? '✓' : '⎘'}</span>
        </button>
      </div>

      {/* Actions */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <a
          href="/send"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
          <span className="text-white text-sm font-medium">Send</span>
        </a>

        <button
          onClick={copyAddress}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <span className="text-white text-sm font-medium">Receive</span>
        </button>
      </div>

      {/* Transactions */}
      <div className="mt-6">
        <h3 className="text-slate-400 text-sm font-medium mb-3">Activity</h3>
        <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-8 flex flex-col items-center gap-2">
          <p className="text-slate-500 text-sm">No transactions yet</p>
          <p className="text-slate-600 text-xs text-center">
            Your wallet deploys automatically on your first transaction.
          </p>
        </div>
      </div>

      {/* Network badge */}
      <div className="mt-auto pt-8 flex justify-center">
        <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-500 text-xs">
          Stellar Testnet
        </span>
      </div>
    </main>
  );
}
