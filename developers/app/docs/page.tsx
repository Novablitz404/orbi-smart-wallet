'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative">
      <pre className="bg-[#020817] border border-[#1e293b] rounded-xl px-4 py-4 text-xs text-slate-300 leading-relaxed overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 text-xs text-slate-500 hover:text-slate-200 transition-colors bg-[#0f172a] border border-[#1e293b] rounded-lg px-2 py-1"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
      <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-slate-400 text-xs leading-relaxed">{children}</p>
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
      <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p className="text-amber-300/80 text-xs leading-relaxed">{children}</p>
    </div>
  );
}

function StepBadge({ n }: { n: string }) {
  return (
    <div className="shrink-0 w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
      {n}
    </div>
  );
}

function Divider() {
  return <hr className="border-[#1e293b]" />;
}

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'templates', label: 'Templates' },
  { id: 'install', label: '1. Install' },
  { id: 'connect', label: '2. Connect Wallet' },
  { id: 'sign', label: '3. Sign Transaction' },
  { id: 'gasless', label: '4. Gasless Setup' },
  { id: 'watch-asset', label: 'Watch Asset' },
  { id: 'api-reference', label: 'API Reference' },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-slate-100">

      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-[#020817]/90 backdrop-blur border-b border-[#1e293b] px-4 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Image
              src="https://account.orbiwallet.xyz/Orbi%20logo%20-%20Landscape%20white.png"
              alt="Orbi"
              width={100}
              height={28}
              style={{ height: 'auto' }}
              unoptimized
            />
            <span className="text-slate-500 text-sm hidden sm:block">Developer Docs</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://npmjs.com/package/@orbi-wallet/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors hidden sm:block"
            >
              npm
            </a>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
              Dashboard →
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 flex gap-12">

        {/* Sidebar */}
        <aside className="hidden lg:block w-48 shrink-0">
          <nav className="sticky top-24 space-y-0.5">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">On this page</p>
            {NAV.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="block text-sm text-slate-500 hover:text-white py-1.5 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-16">

          {/* ── Overview ─────────────────────────────────────────────────────── */}
          <section id="overview" className="scroll-mt-24">
            <h1 className="text-3xl font-bold text-white mb-3">Orbi SDK — Integration Guide</h1>
            <p className="text-slate-400 leading-relaxed max-w-prose mb-6">
              Add Orbi passkey wallets to any Stellar dApp. Users sign with Face ID or Touch ID — no seed phrase, no extension. Everything is a redirect — works on all devices including mobile.
            </p>

            {/* Files to create */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">You only need to create 3 new files</p>
              <div className="space-y-3">
                {[
                  { file: 'lib/orbi.ts', desc: 'Initialize the client — import this everywhere' },
                  { file: 'app/orbi-callback/page.tsx', desc: 'Handles the return after connect' },
                  { file: 'app/sign-callback/page.tsx', desc: 'Handles the return after signing' },
                ].map(({ file, desc }) => (
                  <div key={file} className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <code className="text-green-300 text-xs">{file}</code>
                      <span className="text-slate-500 text-xs ml-2">— {desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-slate-600 text-xs mt-4">
                The connect button and sign trigger go into your <span className="text-slate-400">existing</span> pages — no new files needed for those.
              </p>
            </div>

          </section>

          <Divider />

          {/* ── Templates ────────────────────────────────────────────────────── */}
          <section id="templates" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Templates</h2>
              <p className="text-slate-400 text-sm">
                Create these three files in order. Replace the URLs and contract details with your own — everything else stays as-is.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StepBadge n="1" />
                <p className="text-xs font-semibold text-slate-400">lib/orbi.ts</p>
              </div>
              <CodeBlock code={`import { OrbiClient } from '@orbi-wallet/sdk';

export const orbi = new OrbiClient({
  apiUrl: 'https://api.orbiwallet.xyz',
  // apiKey: process.env.NEXT_PUBLIC_ORBI_API_KEY, // uncomment to enable gasless
});`} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StepBadge n="2" />
                <p className="text-xs font-semibold text-slate-400">app/orbi-callback/page.tsx</p>
                <span className="text-xs text-slate-600">— create this route in your app</span>
              </div>
              <CodeBlock code={`'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orbi } from '../../lib/orbi';

export default function OrbiCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    orbi.handleCallback().then((wallet) => {
      if (!wallet) {
        router.replace('/');
        return;
      }

      localStorage.setItem('walletAddress', wallet.walletAddress);
      router.replace('/dashboard'); // ← change to your post-connect route
    });
  }, [router]);

  return <div>Connecting…</div>;
}`} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StepBadge n="3" />
                <p className="text-xs font-semibold text-slate-400">app/sign-callback/page.tsx</p>
                <span className="text-xs text-slate-600">— create this route in your app</span>
              </div>
              <CodeBlock code={`'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orbi } from '../../lib/orbi';

export default function SignCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const result = orbi.handleSignCallback();
    if (!result) {
      router.replace('/');
      return;
    }

    // Read the contract details saved before orbi.sign() was called
    const contractId   = sessionStorage.getItem('pendingContractId')!;
    const functionName = sessionStorage.getItem('pendingFunctionName')!;

    orbi
      .bundle({
        walletAddress: result.walletAddress,
        quoteId: result.quoteId,
        signedAuthEntryXdr: result.signedAuthEntryXdr,
        contractId,
        functionName,
        argsXdr: result.argsXdr,
      })
      .then(({ opId }) => orbi.waitForConfirmation(opId))
      .then((status) => {
        if (status.status === 'confirmed') {
          router.replace('/dashboard'); // ← change to your post-tx route
        } else {
          setError(status.error ?? 'Transaction failed');
        }
      })
      .catch((err: Error) => setError(err.message));
  }, [router]);

  if (error) return <div>Error: {error}</div>;
  return <div>Submitting transaction…</div>;
}`} />
              <p className="text-slate-500 text-xs mt-2">
                Before calling <code className="text-slate-400 bg-slate-800 px-1 rounded">orbi.sign()</code> in your app, save the contract details to sessionStorage so this page can read them:
              </p>
              <CodeBlock code={`// In your app, before calling orbi.sign():
sessionStorage.setItem('pendingContractId', 'YOUR_CONTRACT_ID');
sessionStorage.setItem('pendingFunctionName', 'YOUR_FUNCTION_NAME');

orbi.sign({ walletAddress, contractId, functionName, argsXdr, redirectUrl });`} />
            </div>
          </section>

          <Divider />

          {/* ── 1. Install ───────────────────────────────────────────────────── */}
          <section id="install" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-white">1. Install</h2>
            <CodeBlock code={`npm install @orbi-wallet/sdk @stellar/stellar-sdk`} />
          </section>

          <Divider />

          {/* ── 2. Connect Wallet ────────────────────────────────────────────── */}
          <section id="connect" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">2. Connect Wallet</h2>
              <p className="text-slate-400 text-sm">
                Two calls — one to start the flow, one to handle the return.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="A" />
                <p className="text-sm font-semibold text-white">Inside your existing connect button click handler</p>
              </div>
              <p className="text-slate-400 text-xs ml-10">
                Wherever your "Connect Wallet" button already is — navbar, homepage, a login page. Just add this to its click handler.
              </p>
              <CodeBlock code={`import { orbi } from './lib/orbi';

orbi.connect({
  redirectUrl: 'https://yourapp.com/orbi-callback',
});`} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="B" />
                <p className="text-sm font-semibold text-white">Inside your orbi-callback page (file 2 from templates)</p>
              </div>
              <p className="text-slate-400 text-xs ml-10">
                This is already handled in the template — no changes needed here unless you want to redirect somewhere other than <code className="text-slate-300 bg-slate-800 px-1 rounded">/dashboard</code>.
              </p>
              <CodeBlock code={`import { orbi } from './lib/orbi';

const wallet = await orbi.handleCallback();
// wallet = { walletAddress, passkeyId, email } — or null if no token in URL

if (wallet) {
  localStorage.setItem('walletAddress', wallet.walletAddress);
  // redirect to your dashboard
}`} />
              <Note>
                Save <code className="text-slate-300">walletAddress</code> — you need it for every sign request.
                On future page loads, check if it exists in storage to know the user is already connected.
              </Note>
            </div>
          </section>

          <Divider />

          {/* ── 4. Sign a Transaction ────────────────────────────────────────── */}
          <section id="sign" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">3. Sign a Transaction</h2>
              <p className="text-slate-400 text-sm">
                Two calls — one to send the user to approve, one to submit the result.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="A" />
                <p className="text-sm font-semibold text-white">Encode your args and redirect the user to approve</p>
              </div>
              <p className="text-slate-400 text-xs ml-10">
                Put this inside the click handler of whichever button triggers the transaction — a Send button, a Stake button, whatever already exists in your app. The <code className="text-slate-300 bg-slate-800 px-1 rounded">redirectUrl</code> must point to your <code className="text-slate-300 bg-slate-800 px-1 rounded">sign-callback</code> page (file 3 from the templates).
              </p>
              <CodeBlock code={`import { nativeToScVal } from '@stellar/stellar-sdk';
import { orbi } from './lib/orbi';

const walletAddress = localStorage.getItem('walletAddress')!;

const argsXdr = [
  nativeToScVal(walletAddress, { type: 'address' }).toXDR('base64'),
  nativeToScVal(recipientAddress, { type: 'address' }).toXDR('base64'),
  nativeToScVal(BigInt(amount), { type: 'i128' }).toXDR('base64'),
  // one entry per argument your contract function expects
];

orbi.sign({
  walletAddress,
  contractId: 'YOUR_CONTRACT_ID',
  functionName: 'YOUR_FUNCTION_NAME',
  argsXdr,
  redirectUrl: 'https://yourapp.com/sign-callback',
});`} />
              <div className="ml-0 mt-3 bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Arg types — quick reference</p>
                <CodeBlock code={`// Address (G... or C...)
nativeToScVal('GBXXX...', { type: 'address' }).toXDR('base64')

// Numbers
nativeToScVal(42, { type: 'i32' }).toXDR('base64')
nativeToScVal(42, { type: 'u32' }).toXDR('base64')
nativeToScVal(BigInt(10_000_000), { type: 'i128' }).toXDR('base64')  // always BigInt for i128/u128
nativeToScVal(BigInt(10_000_000), { type: 'u128' }).toXDR('base64')

// Boolean
nativeToScVal(true, { type: 'bool' }).toXDR('base64')

// String / Symbol
nativeToScVal('hello', { type: 'string' }).toXDR('base64')
nativeToScVal('Approved', { type: 'symbol' }).toXDR('base64')`} />
                <Note>
                  XLM amounts are in stroops — 1 XLM = 10,000,000 stroops. Always use <code className="text-slate-300">BigInt</code> for <code className="text-slate-300">i128</code>/<code className="text-slate-300">u128</code>.
                </Note>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="B" />
                <p className="text-sm font-semibold text-white">On your sign-callback page — submit the signed tx</p>
              </div>
              <CodeBlock code={`import { orbi } from './lib/orbi';

const result = orbi.handleSignCallback();
// result = { signedAuthEntryXdr, quoteId, argsXdr, walletAddress } — or null if cancelled

if (!result) return;

const { opId } = await orbi.bundle({
  walletAddress: result.walletAddress,
  quoteId: result.quoteId,
  signedAuthEntryXdr: result.signedAuthEntryXdr,
  contractId: 'YOUR_CONTRACT_ID',    // same as in orbi.sign()
  functionName: 'YOUR_FUNCTION_NAME', // same as in orbi.sign()
  argsXdr: result.argsXdr,
});

const status = await orbi.waitForConfirmation(opId);
// status.status  — 'confirmed' or 'failed'
// status.txHash  — Stellar transaction hash (when confirmed)`} />
              <Note>
                <code className="text-slate-300">waitForConfirmation()</code> uses SSE and resolves in ~5–10s.
                Use <code className="text-slate-300">getStatus(opId)</code> instead for a one-shot poll without holding a connection open.
              </Note>
            </div>
          </section>

          <Divider />

          {/* ── 5. Gasless ───────────────────────────────────────────────────── */}
          <section id="gasless" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">4. Gasless Transactions</h2>
              <p className="text-slate-400 text-sm">
                Sponsor Stellar fees for your users — they see{' '}
                <span className="text-green-400">"Sponsored by [your app]"</span> and pay nothing.
                One code change, five setup steps.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4">
                <StepBadge n="1" />
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm font-semibold text-white">Get your API key</p>
                  <p className="text-slate-400 text-sm">
                    Create an account at <a href="https://developers.orbiwallet.xyz" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">developers.orbiwallet.xyz</a>. Your API key is shown once — save it immediately. Rotate it from the dashboard anytime.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <StepBadge n="2" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-white">Generate a Stellar keypair for your gas tank</p>
                  <p className="text-slate-400 text-sm">This account pays fees on behalf of your users. Keep the secret key private.</p>
                  <CodeBlock code={`import { Keypair } from '@stellar/stellar-sdk';

const kp = Keypair.random();
console.log('Public key:', kp.publicKey()); // G... — you will register this
console.log('Secret key:', kp.secret());    // S... — never commit this`} />
                </div>
              </div>

              <div className="flex gap-4">
                <StepBadge n="3" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-white">Fund the gas tank</p>
                  <CodeBlock code={`# Testnet — free
curl "https://friendbot.stellar.org?addr=YOUR_G_ADDRESS"

# Mainnet — send XLM from any wallet to your G... address
# Minimum 1 XLM to activate. Recommended: 50–100 XLM to start.`} />
                </div>
              </div>

              <div className="flex gap-4">
                <StepBadge n="4" />
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm font-semibold text-white">Register the deployer in your dashboard</p>
                  <p className="text-slate-400 text-sm">
                    Go to <a href="https://developers.orbiwallet.xyz/setup" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">developers.orbiwallet.xyz/setup</a>, paste your public key (G...). Done — Orbi now knows which account pays fees.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <StepBadge n="5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-white">Add your API key to the client — one line change</p>
                  <CodeBlock code={`// lib/orbi.ts
import { OrbiClient } from '@orbi-wallet/sdk';

export const orbi = new OrbiClient({
  apiUrl: 'https://api.orbiwallet.xyz',
  apiKey: process.env.NEXT_PUBLIC_ORBI_API_KEY,  // ← add this
});`} />
                  <Note>
                    That is the only code change needed. Connect, sign, and bundle work exactly the same — users with Orbi wallets now pay zero gas. Users on other wallets are unaffected.
                  </Note>
                </div>
              </div>
            </div>

            <Warn>
              Never put your secret key (S...) in client-side code or commit it to git. Only the public key (G...) is registered with Orbi.
            </Warn>
          </section>

          <Divider />

          {/* ── Watch Asset ──────────────────────────────────────────────────── */}
          <section id="watch-asset" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-white">Watch Asset (Add Token)</h2>
            <p className="text-slate-400 text-sm">
              Let users add your token to their Orbi wallet in one click.
            </p>
            <CodeBlock code={`// Trigger — redirect user to add the token
orbi.watchAsset({
  contractId: 'YOUR_TOKEN_CONTRACT_ID',
  redirectUrl: 'https://yourapp.com/watch-asset-callback',
});`} />
            <CodeBlock code={`// On your callback page — handle the return
const result = orbi.handleWatchAssetCallback();
// result = { contractId: string, added: boolean } — or null if nothing to process`} />
          </section>

          <Divider />

          {/* ── API Reference ────────────────────────────────────────────────── */}
          <section id="api-reference" className="scroll-mt-24 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">API Reference</h2>
              <p className="text-slate-400 text-sm">All methods on <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">OrbiClient</code>.</p>
            </div>

            {([
              {
                group: 'Constructor',
                methods: [
                  { name: 'new OrbiClient({ apiUrl, apiKey? })', returns: 'OrbiClient', description: 'apiUrl is always https://api.orbiwallet.xyz. Optional apiKey enables gas sponsorship.' },
                ],
              },
              {
                group: 'Wallet Connection',
                methods: [
                  { name: 'connect({ redirectUrl })', returns: 'void', description: 'Redirect user to Orbi to sign in. Returns to redirectUrl?token=...' },
                  { name: 'handleCallback()', returns: 'Promise<{ walletAddress, passkeyId, email } | null>', description: 'Exchange the ?token= in the URL for wallet data. Returns null if no token.' },
                ],
              },
              {
                group: 'Transaction Signing',
                methods: [
                  { name: 'sign({ walletAddress, contractId, functionName, argsXdr, redirectUrl })', returns: 'void', description: 'Redirect user to approve a contract call with their passkey. argsXdr is an array of base64 XDR-encoded args. If apiKey is set, fee is sponsored.' },
                  { name: 'handleSignCallback()', returns: '{ signedAuthEntryXdr, quoteId, argsXdr, nativeSacId, walletAddress } | null', description: 'Extract signed data from the URL. Pass directly to bundle(). Returns null if user cancelled.' },
                ],
              },
              {
                group: 'Relay',
                methods: [
                  { name: 'bundle({ walletAddress, quoteId, signedAuthEntryXdr, contractId, functionName, argsXdr })', returns: 'Promise<{ opId }>', description: 'Submit signed operation to the relay for on-chain execution.' },
                  { name: 'waitForConfirmation(opId)', returns: 'Promise<{ opId, status, txHash, error }>', description: 'Wait for confirmed or failed via SSE. Resolves in ~5–10s. status is "confirmed" or "failed".' },
                  { name: 'getStatus(opId)', returns: 'Promise<{ opId, status, txHash, error }>', description: 'One-shot status poll — non-blocking alternative to waitForConfirmation().' },
                ],
              },
              {
                group: 'Token Management',
                methods: [
                  { name: 'watchAsset({ contractId, redirectUrl })', returns: 'void', description: 'Redirect user to add a Soroban token to their Orbi wallet.' },
                  { name: 'handleWatchAssetCallback()', returns: '{ contractId, added } | null', description: 'Returns whether the user added the token. Returns null if nothing in URL.' },
                ],
              },
              {
                group: 'Gas Tank',
                methods: [
                  { name: 'getDeployerBalance()', returns: 'Promise<{ address, balanceXlm, balanceStroops }>', description: 'Check your gas tank balance. Requires apiKey.' },
                  { name: 'setDeployer(publicKey)', returns: 'Promise<void>', description: 'Set the G... address that funds gas. Requires apiKey. Can also be done in the dashboard.' },
                ],
              },
            ] as { group: string; methods: { name: string; returns: string; description: string }[] }[]).map(({ group, methods }) => (
              <div key={group}>
                <p className="text-sm font-semibold text-slate-300 mb-3 pb-2 border-b border-[#1e293b]">{group}</p>
                <div className="space-y-3">
                  {methods.map((m) => (
                    <div key={m.name} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <code className="text-blue-300 text-xs font-mono">{m.name}</code>
                        <code className="text-slate-500 text-xs font-mono">{m.returns}</code>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">{m.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Footer */}
          <footer className="pt-10 pb-6 border-t border-[#1e293b]">
            <div className="flex flex-wrap gap-6 text-xs text-slate-600">
              <a href="https://npmjs.com/package/@orbi-wallet/sdk" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
                @orbi-wallet/sdk on npm
              </a>
              <a href="https://github.com/Novablitz404/orbi-smart-wallet" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
                GitHub
              </a>
              <a href="https://orbiwallet.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
                orbiwallet.xyz
              </a>
            </div>
          </footer>

        </main>
      </div>
    </div>
  );
}
