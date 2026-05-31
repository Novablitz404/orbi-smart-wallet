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
    <main className="min-h-screen bg-[#020817] overflow-hidden relative">

      {/* Two-column grid — full viewport */}
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

        {/* LEFT — logo + headline + CTA */}
        <div className="flex flex-col px-8 md:px-14 py-10 relative z-10">

          {/* Logo — no header, just here */}
          <img
            src="/Orbi%20logo%20-%20Landscape%20white.png"
            alt="Orbi"
            className="h-7 w-auto"
          />

          {/* Big headline */}
          <h1 className="mt-12 text-[clamp(3rem,8vw,6.5rem)] font-bold text-white leading-[0.95] tracking-tight">
            Your universal<br />
            Stellar<br />
            account
          </h1>

          {/* Push CTA to bottom */}
          <div className="mt-auto pt-16">
            <a
              href="/create"
              className="block w-full max-w-xs py-5 text-center rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-base transition-colors"
            >
              Create wallet
            </a>
            <p className="mt-4 text-slate-600 text-xs leading-relaxed">
              By using this product, you agree to our{' '}
              <span className="text-slate-500 underline cursor-pointer">terms</span>{' '}
              and{' '}
              <span className="text-slate-500 underline cursor-pointer">privacy policy</span>.
            </p>
          </div>
        </div>

        {/* RIGHT — description top + background image bleeding off */}
        <div className="relative hidden md:flex flex-col px-8 py-10">

          {/* Description text — upper right */}
          <p className="text-slate-300 text-[clamp(1.1rem,2vw,1.6rem)] leading-snug font-light max-w-sm ml-auto">
            Sign in with passkeys—no passwords, no seed phrases.
            One account for sending, receiving, and connecting to dApps.
          </p>

          {/* Background visual — large, anchored bottom-right, bleeds off */}
          <img
            src="/Background.png"
            alt=""
            aria-hidden="true"
            className="absolute bottom-[-20%] right-[-15%] w-[130%] max-w-none opacity-80 pointer-events-none select-none"
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
