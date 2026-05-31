'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadWallet, saveWallet } from '../lib/storage';

const KEYS_URL = 'https://keys.orbiwallet.xyz';
const POPUP = 'width=480,height=660,left=400,top=100,popup=1';

function openPopup(url: string) {
  return window.open(url, 'orbi_popup', POPUP);
}

function listenForMessage<T>(channelId: string, type: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { bc.close(); reject(new Error('Timeout')); }, 120_000);
    const bc = new BroadcastChannel(channelId);
    bc.onmessage = (e) => {
      if (e.data?.type === type) { clearTimeout(timer); bc.close(); resolve(e.data as T); }
      if (e.data?.type === 'orbi_cancelled') { clearTimeout(timer); bc.close(); reject(new Error('Cancelled')); }
    };
  });
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (loadWallet()) router.replace('/dashboard');
  }, [router]);

  async function handleSignIn() {
    const channelId = crypto.randomUUID();
    const origin = encodeURIComponent(window.location.origin);
    openPopup(`${KEYS_URL}/connect?channelId=${channelId}&origin=${origin}`);
    try {
      const data = await listenForMessage<{ address: string; credentialId: string; passkeyId: string; email: string }>(channelId, 'orbi_connected');
      saveWallet({ walletAddress: data.address, credentialId: data.credentialId, passkeyId: data.passkeyId, email: data.email });
      router.replace('/dashboard');
    } catch { /* user cancelled */ }
  }

  async function handleCreate() {
    const channelId = crypto.randomUUID();
    openPopup(`${KEYS_URL}/create?popup=1&channelId=${channelId}`);
    try {
      const data = await listenForMessage<{ walletAddress: string; credentialId: string; passkeyId: string; email: string }>(channelId, 'orbi_wallet_created');
      saveWallet(data);
      router.replace('/dashboard');
    } catch { /* user cancelled */ }
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
            <img src="/Stellar%20Logo%20Final%20White%20RGB.png" alt="Stellar" className="h-6 w-auto" />
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
          <p className="mt-[7rem] text-slate-300 text-[clamp(1.1rem,2vw,1.6rem)] leading-snug font-light max-w-md ml-55 whitespace-pre-line">{`Sign in with passkeys—no\npasswords, no seed phrases.\nOne account for sending,\nreceiving, and connecting to dApps.`}</p>

          {/* Background visual — large, anchored bottom-right, bleeds off */}
          <img
            src="/Background.png"
            alt=""
            aria-hidden="true"
            className="absolute bottom-[-90%] right-[-40%] w-[210%] max-w-none opacity-80 pointer-events-none select-none"
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
