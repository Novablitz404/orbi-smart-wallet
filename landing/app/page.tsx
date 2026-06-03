import Image from 'next/image';
import Link from 'next/link';
import HeroBackground from '../components/HeroBackground';
import SignInButton from '../components/SignInButton';

const DEVELOPERS_URL = 'https://developers.orbiwallet.xyz';
const NPM_URL = 'https://npmjs.com/package/@orbi-wallet/sdk';

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#020817]">

      {/* ───────────────────────── Nav ───────────────────────── */}
      <nav className="fixed top-5 inset-x-0 z-50 flex justify-center px-6">
        <div className="flex items-center gap-2 sm:gap-1 rounded-full border border-white/10 bg-[#020817]/80 backdrop-blur-xl px-3 py-2 shadow-xl shadow-black/30">
          <Image
            src="/Orbi Icon.png"
            alt="Orbi"
            width={28}
            height={28}
            className="mr-3"
            priority
          />
          <Link href="#features" className="hidden md:block text-slate-400 hover:text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/5 transition-colors">Features</Link>
          <Link href="#how" className="hidden md:block text-slate-400 hover:text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/5 transition-colors">How it works</Link>
          <Link href={DEVELOPERS_URL} className="hidden md:block text-slate-400 hover:text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/5 transition-colors">Developers</Link>
          <SignInButton className="bg-white text-slate-900 text-sm font-semibold px-5 py-1.5 rounded-full hover:bg-slate-100 transition-colors ml-2 cursor-pointer" />
        </div>
      </nav>

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <HeroBackground />

        {/* Background image — same as app home */}
        <Image
          src="/Background.png"
          alt=""
          aria-hidden
          fill
          priority
          className="object-cover opacity-25 pointer-events-none select-none"
        />

        {/* Desktop: two-column */}
        <div className="relative z-10 w-full hidden md:grid grid-cols-2 min-h-screen">

          {/* LEFT */}
          <div className="flex flex-col px-14 pt-32 pb-16">
            <h1 className="mt-12 text-[clamp(3rem,6.5vw,6rem)] font-bold text-white leading-[0.95] tracking-tight">
              <span className="whitespace-nowrap">Your smart wallet,</span><br />
              unchained.
            </h1>

            <div className="mt-3 flex items-center gap-3 ml-1">
              <span className="text-white text-2xl font-light tracking-wide">Live on</span>
              <Image src="/stellar-logo-white.png" alt="Stellar" width={96} height={24} />
            </div>

            <div className="mt-auto pt-16 flex flex-col gap-3 max-w-xs">
              <SignInButton className="w-full py-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-base transition-colors cursor-pointer" />
              <p className="text-slate-600 text-xs leading-relaxed">
                By using this product, you agree to our{' '}
                <Link href="/terms" className="text-slate-500 underline">terms</Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-slate-500 underline">privacy policy</Link>.
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col px-8 pt-32 pb-16">
            <p className="mt-auto mb-48 ml-40 text-white text-[clamp(1rem,1.8vw,1.4rem)] leading-snug font-light max-w-sm whitespace-pre-line opacity-80">
              {`Sign in with passkeys—no\npasswords, no seed phrases.\nOne account for sending,\nreceiving, and connecting to dApps.`}
            </p>
          </div>
        </div>

        {/* Mobile: single column */}
        <div className="relative z-10 w-full md:hidden flex flex-col min-h-screen px-6 py-8">
          <Image
            src="/Orbi logo - Landscape white.png"
            alt="Orbi"
            width={0}
            height={0}
            className="w-[140px] h-auto mt-16"
          />

          <h1 className="mt-10 text-[2.8rem] font-bold text-white leading-[0.95] tracking-tight">
            <span className="whitespace-nowrap">Your smart wallet,</span><br />
            unchained.
          </h1>

          <div className="mt-3 flex items-center gap-2 ml-1">
            <span className="text-white text-lg font-light tracking-wide">Live on</span>
            <Image src="/stellar-logo-white.png" alt="Stellar" width={80} height={20} />
          </div>

          <p className="mt-6 text-white text-base font-light leading-relaxed opacity-80">
            Sign in with passkeys — no passwords, no seed phrases. One account for sending, receiving, and connecting to dApps.
          </p>

          <div className="mt-auto pt-10 flex flex-col gap-3">
            <SignInButton className="w-full py-4 rounded-2xl bg-white text-slate-900 font-semibold text-base transition-colors cursor-pointer" />
            <p className="text-slate-600 text-xs leading-relaxed text-center">
              By using this product, you agree to our{' '}
              <Link href="/terms" className="text-slate-500 underline">terms</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-slate-500 underline">privacy policy</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Features ───────────────────────── */}
      <section id="features" className="relative z-10 mx-auto max-w-[1600px] px-6 lg:px-12 py-28">
        <div className="max-w-2xl mb-16">
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-[0.2em] mb-4">Why Orbi</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Everything a wallet should be.<br />Nothing it shouldn&apos;t.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
          {[
            { t: 'No seed phrase', d: 'Your passkey is your wallet — backed up automatically by iCloud Keychain or Google Password Manager.', i: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
            { t: 'Face ID & Touch ID', d: 'Every transaction is approved with your biometrics. Nobody can move your funds but you.', i: 'M7 10V7a5 5 0 0110 0v3m-9 0h8a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2z' },
            { t: 'Gasless transactions', d: 'dApps can sponsor network fees on your behalf — so you pay absolutely nothing to interact.', i: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { t: 'Instant finality', d: 'Stellar settles in under five seconds. No waiting, no pending limbo, no uncertainty.', i: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { t: 'Multi-token', d: 'Hold XLM, USDC, and any Stellar asset in one place with live USD valuations.', i: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
            { t: 'Smart contract wallet', d: 'Built on Soroban — programmable, upgradeable, and fully non-custodial by design.', i: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
          ].map((f) => (
            <div key={f.t} className="group bg-[#040b18] p-8 hover:bg-[#0a1424] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:border-white/20 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.i} /></svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.t}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── How it works ───────────────────────── */}
      <section id="how" className="relative z-10 border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 py-28">
          <div className="max-w-2xl mb-16">
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-[0.2em] mb-4">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Up and running in 30 seconds.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', t: 'Create with your passkey', d: 'Tap once. Your wallet is generated and secured by Face ID or Touch ID — no phrase to write down.' },
              { n: '02', t: 'Fund & transact', d: 'Receive XLM, USDC, or any Stellar token. Send instantly with biometric approval.' },
              { n: '03', t: 'Connect to dApps', d: 'Use any Orbi-integrated app. Developers can sponsor your gas, so you pay nothing.' },
            ].map((s) => (
              <div key={s.n} className="relative">
                <span className="text-6xl font-bold text-white/5 absolute -top-4 -left-2 select-none">{s.n}</span>
                <div className="relative pt-10">
                  <h3 className="text-white font-semibold text-xl mb-3">{s.t}</h3>
                  <p className="text-slate-400 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── For Developers ───────────────────────── */}
      <section className="relative z-10 mx-auto max-w-[1600px] px-6 lg:px-12 py-28">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-[0.2em] mb-4">For Developers</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6">
              Drop Orbi into<br />your dApp.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-md">
              One npm package. No backend required. Sponsor gas for every user
              with a single line of configuration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={DEVELOPERS_URL} className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-7 py-3.5 rounded-2xl transition-colors">
                Get your API key
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link href={NPM_URL} className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-7 py-3.5 rounded-2xl transition-colors">
                View on npm
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#040b18] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
              <span className="w-3 h-3 rounded-full bg-white/10" />
              <span className="w-3 h-3 rounded-full bg-white/10" />
              <span className="w-3 h-3 rounded-full bg-white/10" />
              <span className="ml-2 text-slate-500 text-xs font-mono">orbi.ts</span>
            </div>
            <pre className="p-6 text-sm font-mono leading-relaxed overflow-x-auto">
<span className="text-slate-600">{`// Install\n`}</span>
<span className="text-slate-300">{`npm install @orbi-wallet/sdk\n\n`}</span>
<span className="text-slate-600">{`// Enable gasless for your users\n`}</span>
<span className="text-purple-400">{`import`}</span><span className="text-slate-300">{` { OrbiClient } `}</span><span className="text-purple-400">{`from`}</span><span className="text-emerald-400">{` '@orbi-wallet/sdk'`}</span><span className="text-slate-300">{`;\n\n`}</span>
<span className="text-purple-400">{`const`}</span><span className="text-slate-300">{` orbi = `}</span><span className="text-purple-400">{`new`}</span><span className="text-sky-400">{` OrbiClient`}</span><span className="text-slate-300">{`({\n`}</span>
<span className="text-slate-300">{`  apiUrl: `}</span><span className="text-emerald-400">{`'https://api.orbiwallet.xyz'`}</span><span className="text-slate-300">{`,\n`}</span>
<span className="text-slate-300">{`  apiKey: `}</span><span className="text-emerald-400">{`'YOUR_API_KEY'`}</span><span className="text-slate-300">{`,  `}</span><span className="text-slate-600">{`// gasless`}</span><span className="text-slate-300">{`\n});`}</span>
            </pre>
          </div>
        </div>
      </section>

      {/* ───────────────────────── CTA ───────────────────────── */}
      <section className="relative z-10 border-t border-white/5">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 py-32 text-center">
          <h2 className="text-5xl sm:text-6xl font-bold text-white tracking-tight mb-6">
            Ready to go unchained?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
            Create your Orbi wallet in under 30 seconds. No download. No seed phrase.
          </p>
          <SignInButton className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-bold px-10 py-4 rounded-2xl text-lg transition-colors cursor-pointer" />
        </div>
      </section>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <Image src="/Orbi logo - Landscape white.png" alt="Orbi" width={0} height={0} className="w-[88px] h-auto opacity-60" />
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-slate-400 text-sm">
            <Link href={DEVELOPERS_URL} className="hover:text-white transition-colors">Developers</Link>
            <Link href={NPM_URL} className="hover:text-white transition-colors">SDK</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
          <p className="text-slate-600 text-xs">© 2025 Orbi. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
