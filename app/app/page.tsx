'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadWallet } from '../lib/storage';

const KEYS_URL = 'https://keys.orbiwallet.xyz';
const ACCOUNT_URL = 'https://account.orbiwallet.xyz';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect bare keys.orbiwallet.xyz to account.orbiwallet.xyz
    if (typeof window !== 'undefined' && window.location.hostname === 'keys.orbiwallet.xyz') {
      window.location.replace('https://account.orbiwallet.xyz');
      return;
    }
    if (loadWallet()) router.replace('/dashboard');
  }, [router]);

  function handleSignIn() {
    const redirect = encodeURIComponent(`${ACCOUNT_URL}/auth-callback`);
    const origin = encodeURIComponent(window.location.origin);
    window.location.href = `${KEYS_URL}/connect?redirect=${redirect}&origin=${origin}`;
  }

  function handleCreate() {
    const redirect = encodeURIComponent(`${ACCOUNT_URL}/auth-callback`);
    window.location.href = `${KEYS_URL}/create?redirect=${redirect}`;
  }

  return (
    <main className="min-h-screen bg-[#020817] overflow-hidden relative">

      {/* Desktop: two-column grid */}
      <div className="min-h-screen hidden md:grid grid-cols-2">

        {/* LEFT */}
        <div className="flex flex-col px-14 py-10 relative z-10">
          <img src="/Orbi%20logo%20-%20Landscape%20white.png" alt="Orbi" className="h-12 w-auto max-w-[160px]" />

          <h1 className="mt-12 text-[clamp(3rem,6.5vw,6rem)] font-bold text-white leading-[0.95] tracking-tight">
            <span className="whitespace-nowrap">Your smart wallet,</span><br />
            unchained.
          </h1>

          <div className="mt-2 flex items-center gap-3 ml-2">
            <span className="text-white text-2xl font-light tracking-wide">Born on</span>
            <img src="/stellar-logo-white.png" alt="Stellar" className="h-6 w-auto" />
          </div>

          <div className="mt-auto pt-16 flex flex-col gap-3">
            <button onClick={handleSignIn} className="w-full max-w-xs py-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-base transition-colors">
              Sign in
            </button>
            <button onClick={handleCreate} className="w-full max-w-xs py-5 rounded-2xl bg-transparent border border-slate-700 hover:border-slate-500 text-white font-semibold text-base transition-colors">
              Create wallet
            </button>
            <p className="mt-2 text-slate-600 text-xs leading-relaxed">
              By using this product, you agree to our{' '}
              <span className="text-slate-500 underline cursor-pointer">terms</span>{' '}
              and{' '}
              <span className="text-slate-500 underline cursor-pointer">privacy policy</span>.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="relative flex flex-col px-8 py-10">
          <p className="mt-[7rem] text-white text-[clamp(1rem,1.8vw,1.4rem)] leading-snug font-light max-w-md ml-55 whitespace-pre-line">{`Sign in with passkeys—no\npasswords, no seed phrases.\nOne account for sending,\nreceiving, and connecting to dApps.`}</p>
          <img src="/Background.png" alt="" aria-hidden="true"
            className="absolute bottom-[-50vh] right-[-14vw] w-[85vw] max-w-none opacity-60 pointer-events-none select-none" />
        </div>
      </div>

      {/* Mobile: single column, clean stacked layout */}
      <div className="md:hidden flex flex-col min-h-screen px-6 py-8 relative overflow-hidden">

        {/* Background — full mobile background */}
        <img src="/Background.png" alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none select-none" />

        <div className="relative z-10 flex flex-col flex-1">
          {/* Logo */}
          <img src="/Orbi%20logo%20-%20Landscape%20white.png" alt="Orbi" className="h-9 w-auto max-w-[140px]" />

          {/* Headline */}
          <h1 className="mt-10 text-[2.8rem] font-bold text-white leading-[0.95] tracking-tight">
            <span className="whitespace-nowrap">Your smart wallet,</span><br />
            unchained.
          </h1>

          {/* Born on Stellar */}
          <div className="mt-3 flex items-center gap-2 ml-1">
            <span className="text-white text-lg font-light tracking-wide">Born on</span>
            <img src="/stellar-logo-white.png" alt="Stellar" className="h-5 w-auto" />
          </div>

          {/* Description */}
          <p className="mt-6 text-white text-base font-light leading-relaxed opacity-80">
            Sign in with passkeys—no passwords, no seed phrases. One account for sending, receiving, and connecting to dApps.
          </p>

          {/* CTA */}
          <div className="mt-auto pt-10 flex flex-col gap-3">
            <button onClick={handleSignIn} className="w-full py-4 rounded-2xl bg-white text-slate-900 font-semibold text-base transition-colors">
              Sign in
            </button>
            <button onClick={handleCreate} className="w-full py-4 rounded-2xl bg-transparent border border-slate-700 text-white font-semibold text-base transition-colors">
              Create wallet
            </button>
            <p className="mt-2 text-slate-600 text-xs leading-relaxed text-center">
              By using this product, you agree to our{' '}
              <span className="text-slate-500 underline cursor-pointer">terms</span>{' '}
              and{' '}
              <span className="text-slate-500 underline cursor-pointer">privacy policy</span>.
            </p>
          </div>
        </div>
      </div>

    </main>
  );
}
