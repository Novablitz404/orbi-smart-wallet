import Image from 'next/image';
import Link from 'next/link';
import SignInButton from '../components/SignInButton';
import AnimateIn from '../components/AnimateIn';
import DevDropdown from '../components/DevDropdown';

const DEVELOPERS_URL = 'https://developers.orbiwallet.xyz';
const NPM_URL = 'https://npmjs.com/package/@orbi-wallet/sdk';

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#020817]">

      {/* ───────────────────────── Nav ───────────────────────── */}
      <nav className="animate-fade-down fixed top-5 inset-x-0 z-50 flex justify-center px-6">
        <div className="flex items-center gap-2 sm:gap-1 rounded-full border border-white/10 bg-[#020817]/80 backdrop-blur-xl px-3 py-2 shadow-xl shadow-black/30">
          <Image
            src="/Orbi Icon.png"
            alt="Orbi"
            width={28}
            height={28}
            className="mr-3"
            priority
          />
          <Link href="#features" className="text-slate-400 hover:text-white text-xs md:text-sm px-2.5 md:px-4 py-1.5 rounded-full hover:bg-white/5 transition-colors">Features</Link>
          <Link href="#how" className="hidden md:block text-slate-400 hover:text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/5 transition-colors">How it works</Link>
          <DevDropdown />
          <SignInButton className="bg-white text-slate-900 text-sm font-semibold px-5 py-1.5 rounded-full hover:bg-slate-100 transition-colors ml-2 cursor-pointer" />
        </div>
      </nav>

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        {/* Background image — same as app home */}
        <Image
          src="/Background.png"
          alt=""
          aria-hidden
          fill
          priority
          className="object-cover opacity-40 pointer-events-none select-none"
        />

        {/* Bottom fade into next section */}
        <div aria-hidden className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[#020817] to-transparent pointer-events-none" />

        {/* Desktop: two-column */}
        <div className="relative z-10 w-full hidden md:grid grid-cols-2 min-h-screen">

          {/* LEFT */}
          <div className="flex flex-col px-14 pt-32 pb-16">
            <h1 className="animate-fade-up mt-12 text-[clamp(3rem,6.5vw,6rem)] font-bold text-white leading-[0.95] tracking-tight">
              <span className="whitespace-nowrap">Your smart wallet,</span><br />
              unchained.
            </h1>

            <div className="animate-fade-up-delay-1 mt-3 flex items-center gap-2 ml-1">
              <span className="text-white text-2xl font-light tracking-wide">Live on</span>
              <Image src="/stellar-logo-white.png" alt="Stellar" width={96} height={24} />
            </div>

            <div className="animate-fade-up-delay-2 mt-auto pt-16 flex flex-col gap-2 max-w-xs">
              <SignInButton label="Create wallet" action="create" className="w-full py-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-base transition-colors cursor-pointer" />
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
            <p className="animate-fade-up-delay-3 mt-auto mb-48 ml-40 text-white text-[clamp(1rem,1.8vw,1.4rem)] leading-snug font-light max-w-sm whitespace-pre-line opacity-80">
              {`Sign in with passkeys—no\npasswords, no seed phrases.\nOne account for sending,\nreceiving, and connecting to dApps.`}
            </p>
          </div>
        </div>

        {/* Mobile: single column */}
        <div className="relative z-10 w-full md:hidden flex flex-col h-[100dvh] px-6 pb-8 pt-16">
          <h1 className="animate-fade-up text-[2.8rem] font-bold text-white leading-[0.95] tracking-tight">
            <span className="whitespace-nowrap">Your smart wallet,</span><br />
            unchained.
          </h1>

          <div className="animate-fade-up-delay-2 mt-3 flex items-center gap-2 ml-1">
            <span className="text-white text-lg font-light tracking-wide">Live on</span>
            <Image src="/stellar-logo-white.png" alt="Stellar" width={80} height={20} />
          </div>

          <p className="animate-fade-up-delay-3 mt-6 text-white text-base font-light leading-relaxed opacity-80">
            Sign in with passkeys — no passwords, no seed phrases. One account for sending, receiving, and connecting to dApps.
          </p>

          <div className="animate-fade-up-delay-3 mt-12 flex flex-col gap-2">
            <SignInButton label="Create wallet" action="create" className="w-full py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-base transition-colors cursor-pointer" />
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
        <AnimateIn className="max-w-2xl mb-16">
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-[0.2em] mb-4">Why Orbi</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Everything a wallet should be.<br />Nothing it shouldn&apos;t.
          </h2>
        </AnimateIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
          {[
            { t: 'No seed phrase', d: 'Your passkey is your wallet — backed up automatically by iCloud Keychain or Google Password Manager.', i: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
            { t: 'Face ID & Touch ID', d: 'Every transaction is approved with your biometrics. Nobody can move your funds but you.', i: 'M7 10V7a5 5 0 0110 0v3m-9 0h8a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2z' },
            { t: 'Gasless transactions', d: 'dApps can sponsor network fees on your behalf — so you pay absolutely nothing to interact.', i: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { t: 'Instant finality', d: 'Stellar settles in under five seconds. No waiting, no pending limbo, no uncertainty.', i: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { t: 'Multi-token', d: 'Hold XLM, USDC, and any Stellar asset in one place with live USD valuations.', i: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
            { t: 'Smart contract wallet', d: 'Built on Soroban — programmable, upgradeable, and fully non-custodial by design.', i: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
          ].map((f, i) => (
            <AnimateIn key={f.t} delay={i * 70}>
              <div className="group bg-[#040b18] p-8 hover:bg-[#0a1424] transition-colors h-full">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:border-white/20 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.i} /></svg>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.t}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.d}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ───────────────────────── How it works ───────────────────────── */}
      <section id="how" className="relative z-10 border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 py-28">
          <AnimateIn className="max-w-2xl mb-16">
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-[0.2em] mb-4">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Up and running in 30 seconds.</h2>
          </AnimateIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', t: 'Create with your passkey', d: 'Tap once. Your wallet is generated and secured by Face ID or Touch ID — no phrase to write down.' },
              { n: '02', t: 'Fund & transact', d: 'Receive XLM, USDC, or any Stellar token. Send instantly with biometric approval.' },
              { n: '03', t: 'Connect to dApps', d: 'Use any Orbi-integrated app. Developers can sponsor your gas, so you pay nothing.' },
            ].map((s, i) => (
              <AnimateIn key={s.n} delay={i * 100}>
                <div className="relative">
                  <span className="text-6xl font-bold absolute -top-4 -left-2 select-none" style={{ color: '#30b27c4d' }}>{s.n}</span>
                  <div className="relative pt-10">
                    <h3 className="text-white font-semibold text-xl mb-3">{s.t}</h3>
                    <p className="text-slate-400 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── For Developers ───────────────────────── */}
      <section className="relative z-10 mx-auto max-w-[1600px] px-6 lg:px-12 py-28">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <AnimateIn>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-[0.2em] mb-4">For Developers</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6">
              Drop Orbi into<br />your dApp.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-md">
              One npm package. No backend required. Sponsor gas for every user
              with a single line of configuration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={DEVELOPERS_URL} className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-7 py-3.5 rounded-2xl transition-colors w-full sm:w-auto">
                Get your API key
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link href={NPM_URL} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-7 py-3.5 rounded-2xl transition-colors w-full sm:w-auto">
                View on npm
              </Link>
            </div>
          </AnimateIn>

          <AnimateIn delay={120} className="min-w-0">
            <div className="rounded-3xl border border-white/10 bg-[#040b18] overflow-hidden w-full">
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
          </AnimateIn>
        </div>
      </section>

      {/* ───────────────────────── CTA ───────────────────────── */}
      <section className="relative z-10 border-t border-white/5">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 py-32 text-center">
          <AnimateIn>
            <h2 className="text-5xl sm:text-6xl font-bold text-white tracking-tight mb-6">
              Ready to go unchained?
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
              Create your Orbi wallet in under 30 seconds. No download. No seed phrase.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignInButton label="Create account" action="create" className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-7 py-3.5 rounded-2xl transition-colors cursor-pointer w-full sm:w-auto" />
              <SignInButton label="Sign in" className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-7 py-3.5 rounded-2xl transition-colors cursor-pointer w-full sm:w-auto" />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 pt-16 pb-10">

          {/* Columns */}
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-16">

            {/* Brand */}
            <div className="shrink-0">
              <Image src="/Orbi logo - Landscape white.png" alt="Orbi" width={88} height={31} className="opacity-80 mb-4" />
              <p className="text-slate-500 text-sm leading-relaxed max-w-[280px]">
                Sign in with passkeys—no passwords, no seed phrases. One account for sending, receiving, and connecting to dApps.
              </p>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-3 gap-6">

              {/* Product */}
              <div>
                <p className="text-white text-sm font-semibold mb-4">Product</p>
                <ul className="flex flex-col gap-2">
                  <li><Link href="#features" className="text-slate-400 text-sm hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="#how" className="text-slate-400 text-sm hover:text-white transition-colors">How it works</Link></li>
                  <li><SignInButton className="text-slate-400 text-sm hover:text-white transition-colors text-left cursor-pointer" /></li>
                </ul>
              </div>

              {/* Developers */}
              <div>
                <p className="text-white text-sm font-semibold mb-4">Developers</p>
                <ul className="flex flex-col gap-2">
                  <li><Link href={DEVELOPERS_URL} className="text-slate-400 text-sm hover:text-white transition-colors">Documentation</Link></li>
                  <li><Link href={NPM_URL} className="text-slate-400 text-sm hover:text-white transition-colors">SDK on npm</Link></li>
                  <li><Link href={DEVELOPERS_URL} className="text-slate-400 text-sm hover:text-white transition-colors">Get API key</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <p className="text-white text-sm font-semibold mb-4">Legal</p>
                <ul className="flex flex-col gap-2">
                  <li><Link href="/terms" className="text-slate-400 text-sm hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="text-slate-400 text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs">© 2026 Orbi Smart Wallet. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
