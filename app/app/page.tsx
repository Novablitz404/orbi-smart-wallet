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
    <main className="min-h-screen bg-[#020817] flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <img src="/Orbi%20logo%20-%20Landscape%20white.png" alt="Orbi" className="h-7 w-auto" />
        <a
          href="/signin"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Sign in
        </a>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col md:flex-row items-center px-6 py-12 md:px-12 md:py-0 gap-12 max-w-6xl mx-auto w-full">

        {/* Left — headline + CTA */}
        <div className="flex-1 flex flex-col gap-8">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight">
            Your universal<br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Stellar
            </span>{' '}
            account
          </h1>

          <a
            href="/create"
            className="inline-flex items-center justify-center w-full md:w-64 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-base transition-colors shadow-lg shadow-white/5"
          >
            Create wallet
          </a>

          <p className="text-slate-600 text-xs">
            By using this product, you agree to our{' '}
            <span className="text-slate-500 underline cursor-pointer">terms</span>{' '}
            and{' '}
            <span className="text-slate-500 underline cursor-pointer">privacy policy</span>.
          </p>
        </div>

        {/* Right — tagline + visual */}
        <div className="flex-1 flex flex-col justify-center gap-8">
          <p className="text-slate-300 text-xl md:text-2xl leading-relaxed font-light">
            Sign in with passkeys—no passwords, no seed phrases.
            One account for sending, receiving, and connecting to dApps.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {[
              '✦ No seed phrase',
              '✦ Gasless transactions',
              '✦ Face ID only',
              '✦ Connect any dApp',
            ].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 text-xs">
                {f}
              </span>
            ))}
          </div>

          {/* Stellar globe — dot grid visual */}
          <div className="relative w-full max-w-xs mx-auto md:mx-0 aspect-square opacity-30 select-none pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {Array.from({ length: 20 }, (_, row) =>
                Array.from({ length: 20 }, (_, col) => {
                  const cx = col * 10 + 5;
                  const cy = row * 10 + 5;
                  const dx = cx - 100;
                  const dy = cy - 100;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist > 95) return null;
                  const opacity = 0.3 + 0.7 * (1 - dist / 95);
                  const isPlus = (row + col) % 3 === 0;
                  return isPlus ? (
                    <g key={`${row}-${col}`} opacity={opacity}>
                      <line x1={cx - 3} y1={cy} x2={cx + 3} y2={cy} stroke="#818cf8" strokeWidth="1" />
                      <line x1={cx} y1={cy - 3} x2={cx} y2={cy + 3} stroke="#818cf8" strokeWidth="1" />
                    </g>
                  ) : (
                    <rect key={`${row}-${col}`} x={cx - 1} y={cy - 1} width="2" height="2" fill="#60a5fa" opacity={opacity} />
                  );
                })
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-6 py-4 md:px-12 border-t border-slate-800/50">
        <span className="text-slate-600 text-xs">Stellar Testnet</span>
        <span className="text-slate-600 text-xs">The first smart wallet on Stellar</span>
      </div>

    </main>
  );
}
