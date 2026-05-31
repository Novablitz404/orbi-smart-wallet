'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadWallet } from '../lib/storage';

const KEYS_URL = 'https://keys.orbiwallet.xyz';
const ACCOUNT_URL = 'https://account.orbiwallet.xyz';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
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

      {/* Two-column grid — full viewport */}
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

        {/* LEFT — logo + headline + CTA */}
        <div className="flex flex-col px-8 md:px-14 py-10 relative z-10">

          {/* Logo — no header, just here */}
          <img
            src="/Orbi%20logo%20-%20Landscape%20white.png"
            alt="Orbi"
            className="h-12 w-auto max-w-[160px]"
          />

          {/* Big headline */}
          <h1 className="mt-12 text-[clamp(3rem,6.5vw,6rem)] font-bold text-white leading-[0.95] tracking-tight">
            <span className="whitespace-nowrap">Your smart wallet,</span><br />
            unchained.
          </h1>

          <div className="mt-2 flex items-center gap-3 ml-2">
            <span className="text-white text-2xl font-light tracking-wide">Born on</span>
            <img src="/stellar-logo-white.png" alt="Stellar" className="h-6 w-auto" />
          </div>

          {/* Push CTA to bottom */}
          <div className="mt-auto pt-16 flex flex-col gap-3">
            <button
              onClick={handleSignIn}
              className="w-full max-w-xs py-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-base transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={handleCreate}
              className="w-full max-w-xs py-5 rounded-2xl bg-transparent border border-slate-700 hover:border-slate-500 text-white font-semibold text-base transition-colors"
            >
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

        {/* RIGHT — description top + background image bleeding off */}
        <div className="relative hidden md:flex flex-col px-8 py-10">

          {/* Description text — aligned with headline (mt-12 matches left column) */}
          <p className="mt-[7rem] text-white text-[clamp(1rem,1.8vw,1.4rem)] leading-snug font-light max-w-md ml-55 whitespace-pre-line">{`Sign in with passkeys—no\npasswords, no seed phrases.\nOne account for sending,\nreceiving, and connecting to dApps.`}</p>

          {/* Background visual — large, anchored bottom-right, bleeds off */}
          <img
            src="/Background.png"
            alt=""
            aria-hidden="true"
            className="absolute bottom-[-50vh] right-[-14vw] w-[85vw] max-w-none opacity-60 pointer-events-none select-none"
          />
        </div>
      </div>

      {/* Mobile: description + visual below */}
      <div className="md:hidden px-8 pb-8 relative">
        <p className="text-slate-400 text-base leading-relaxed mb-6">
          Sign in with passkeys—no passwords, no seed phrases.
          One account for sending, receiving, and connecting to dApps.
        </p>
        <img
          src="/Background.png"
          alt=""
          aria-hidden="true"
          className="w-full opacity-60 pointer-events-none select-none rounded-2xl"
        />
      </div>

    </main>
  );
}
