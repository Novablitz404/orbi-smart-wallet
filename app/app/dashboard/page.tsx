'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadWallet, clearWallet } from '../../lib/storage';

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<ReturnType<typeof loadWallet>>(null);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);
  const [xlmPrice, setXlmPrice] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeNav, setActiveNav] = useState('assets');

  useEffect(() => {
    const w = loadWallet();
    if (!w) { router.replace('/'); return; }
    setWallet(w);

    // Fetch XLM balance
    fetch(`${RELAY_URL}/v1/wallet/balance/${w.walletAddress}`)
      .then(r => r.json())
      .then((d: { xlm?: string }) => setXlmBalance(d.xlm ?? '0.0000000'))
      .catch(() => setXlmBalance('0.0000000'));

    // Fetch XLM price in USD from CoinGecko
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd')
      .then(r => r.json())
      .then((d: { stellar?: { usd?: number } }) => setXlmPrice(d.stellar?.usd ?? null))
      .catch(() => setXlmPrice(null));
  }, [router]);

  function copyAddress() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function signOut() {
    clearWallet();
    window.location.href = 'https://keys.orbiwallet.xyz/signout?redirect=https://account.orbiwallet.xyz';
  }

  const xlmFloat = xlmBalance ? parseFloat(xlmBalance) : 0;
  const usdValue = xlmPrice ? xlmFloat * xlmPrice : null;

  if (!wallet) return null;

  return (
    <div className="flex min-h-screen bg-[#020817]">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 border-r border-slate-800 px-4 py-6 shrink-0">
        {/* Logo */}
        <img src="/Orbi%20logo%20-%20Landscape%20white.png" alt="Orbi" className="h-7 w-auto max-w-[120px] mb-8" />

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {[
            { id: 'assets', label: 'Assets', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2"/></svg>
            )},
            { id: 'activity', label: 'Activity', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            )},
            { id: 'apps', label: 'Apps', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            )},
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveNav(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeNav === id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}>
              {icon}{label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="mt-8">
          <p className="text-slate-600 text-xs font-medium uppercase tracking-wider px-3 mb-2">Actions</p>
          <div className="flex flex-col gap-1">
            <a href="/send" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
              Send
            </a>
            <button onClick={copyAddress} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 text-sm transition-colors text-left">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
              Receive
            </button>
          </div>
        </div>

        {/* Bottom: account + sign out */}
        <div className="mt-auto flex flex-col gap-2">
          <button onClick={copyAddress}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 text-xs hover:bg-slate-700/50 transition-colors">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shrink-0" />
            <span className="font-mono truncate">{truncate(wallet.walletAddress)}</span>
            <span className="ml-auto">{copied ? '✓' : '⎘'}</span>
          </button>
          <div className="flex gap-2">
            <a href="/settings" className="flex-1 text-center text-slate-600 hover:text-slate-400 text-xs py-1.5 transition-colors">Settings</a>
            <button onClick={signOut} className="flex-1 text-center text-slate-600 hover:text-slate-400 text-xs py-1.5 transition-colors">Sign out</button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col">

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 pt-6 pb-4 border-b border-slate-800">
          <img src="/Orbi%20logo%20-%20Landscape%20white.png" alt="Orbi" className="h-6 w-auto" />
          <div className="flex items-center gap-3">
            <a href="/settings" className="text-slate-500 text-sm">Settings</a>
            <button onClick={signOut} className="text-slate-500 text-sm">Sign out</button>
          </div>
        </div>

        <div className="px-6 md:px-10 py-8 flex-1">

          {/* Balance header */}
          <div className="mb-8">
            <p className="text-slate-400 text-base mb-1">Your balance:</p>
            <p className="text-5xl md:text-6xl font-bold text-white">
              {usdValue === null ? (
                <span className="animate-pulse text-slate-600">$···</span>
              ) : (
                `$${usdValue.toFixed(2)}`
              )}
            </p>
          </div>

          {/* Assets tab */}
          {activeNav === 'assets' && (
            <>
              {/* Coins header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-medium">Coins</h2>
                <span className="text-xs text-slate-500 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50">
                  Stellar Testnet
                </span>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-4 px-4 pb-2 border-b border-slate-800 text-slate-500 text-xs font-medium">
                <span>Asset</span>
                <span className="text-right">Balance</span>
                <span className="text-right hidden md:block">Portfolio %</span>
                <span className="text-right hidden md:block">Price</span>
              </div>

              {/* XLM row */}
              <div className="grid grid-cols-4 px-4 py-4 border-b border-slate-800/50 items-center hover:bg-slate-800/20 transition-colors rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                    <img src="/stellar-logo-white.png" alt="XLM" className="w-5 h-5 object-contain opacity-80" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Stellar</p>
                    <p className="text-slate-500 text-xs">XLM</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">
                    {usdValue !== null ? `$${usdValue.toFixed(2)}` : '—'}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {xlmBalance !== null ? `${parseFloat(xlmBalance).toFixed(4)} XLM` : <span className="animate-pulse">···</span>}
                  </p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-white text-sm">100%</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-white text-sm">
                    {xlmPrice ? `$${xlmPrice.toFixed(4)}` : '—'}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Activity tab */}
          {activeNav === 'activity' && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-slate-500 text-sm">No transactions yet</p>
              <p className="text-slate-600 text-xs text-center max-w-xs">Your transaction history will appear here after your first send or receive.</p>
            </div>
          )}

          {/* Apps tab */}
          {activeNav === 'apps' && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-slate-500 text-sm">No apps connected</p>
              <p className="text-slate-600 text-xs text-center max-w-xs">Connect Orbi to Stellar dApps and they'll appear here.</p>
              <a href="/settings" className="mt-2 text-blue-400 text-xs hover:underline">Manage connections →</a>
            </div>
          )}
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden border-t border-slate-800 px-4 py-3 flex justify-around">
          {[
            { id: 'assets', label: 'Assets' },
            { id: 'activity', label: 'Activity' },
            { id: 'apps', label: 'Apps' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setActiveNav(id)}
              className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${
                activeNav === id ? 'text-white bg-slate-800' : 'text-slate-500'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
