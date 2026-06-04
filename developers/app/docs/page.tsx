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
    <div className="relative group">
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

function Badge({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'green' | 'amber' }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ${colors[color]}`}>
      {children}
    </span>
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
  { id: 'install', label: '1. Install' },
  { id: 'initialize', label: '2. Initialize' },
  { id: 'connect', label: '3. Connect Wallet' },
  { id: 'sign', label: '4. Sign Transaction' },
  { id: 'gasless', label: '5. Gasless Setup' },
  { id: 'watch-asset', label: 'Watch Asset' },
  { id: 'xdr-args', label: 'Encoding Args (XDR)' },
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
            <p className="text-slate-400 leading-relaxed max-w-prose mb-5">
              Add Orbi passkey wallets to any Stellar dApp. Users sign transactions with Face ID or Touch ID — no seed phrase, no browser extension required. Everything runs through a redirect flow that works on all devices including mobile.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              <Badge color="blue">Redirect flow — works on mobile</Badge>
              <Badge color="green">No backend required</Badge>
              <Badge color="amber">Optional gasless — users pay nothing</Badge>
            </div>

            {/* Flow diagram */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">How the flow works</p>
              {[
                { arrow: '→', label: 'orbi.connect()', desc: 'Redirect user to Orbi — they tap "Sign in with passkey"' },
                { arrow: '←', label: 'handleCallback()', desc: 'User lands back on your site with walletAddress + passkeyId' },
                { arrow: '→', label: 'orbi.sign()', desc: 'Redirect user to approve a contract call with their passkey' },
                { arrow: '←', label: 'handleSignCallback()', desc: 'User returns with signed authorization entry' },
                { arrow: '→', label: 'orbi.bundle()', desc: 'Submit signed tx to the Orbi relay' },
                { arrow: '✓', label: 'waitForConfirmation()', desc: 'Confirmed on-chain via SSE in ~5 seconds' },
              ].map(({ arrow, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-blue-400 font-mono text-sm shrink-0 w-4">{arrow}</span>
                  <div>
                    <code className="text-slate-200 text-xs">{label}</code>
                    <span className="text-slate-500 text-xs ml-2">— {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* ── 1. Install ───────────────────────────────────────────────────── */}
          <section id="install" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-white">1. Install</h2>
            <p className="text-slate-400 text-sm">Install the Orbi SDK and its peer dependency.</p>
            <CodeBlock code={`npm install @orbi-wallet/sdk @stellar/stellar-sdk`} />
            <Note>
              <code className="text-slate-300">@stellar/stellar-sdk</code> is required for XDR encoding of contract arguments. Both packages are needed even if you only use the redirect flow.
            </Note>
          </section>

          <Divider />

          {/* ── 2. Initialize ────────────────────────────────────────────────── */}
          <section id="initialize" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-white">2. Initialize</h2>
            <p className="text-slate-400 text-sm">
              Create a single <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">lib/orbi.ts</code> file in your project. Export one shared <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">OrbiClient</code> instance — import it wherever you need it.
            </p>
            <CodeBlock code={`// lib/orbi.ts
import { OrbiClient } from '@orbi-wallet/sdk';

export const orbi = new OrbiClient({
  apiUrl: 'https://api.orbiwallet.xyz',

  // Optional: add this to enable gasless transactions (users pay nothing)
  // apiKey: process.env.NEXT_PUBLIC_ORBI_API_KEY,
});`} />
            <Note>
              The <code className="text-slate-300">apiUrl</code> is always <code className="text-slate-300">https://api.orbiwallet.xyz</code>.
              The optional <code className="text-slate-300">apiKey</code> enables gas sponsorship — covered in <a href="#gasless" className="text-blue-400 hover:underline">Step 5</a>.
            </Note>
          </section>

          <Divider />

          {/* ── 3. Connect Wallet ────────────────────────────────────────────── */}
          <section id="connect" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">3. Connect Wallet</h2>
              <p className="text-slate-400 text-sm">
                Call <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">orbi.connect()</code> from your "Connect Wallet" button. The user is redirected to <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">keys.orbiwallet.xyz</code>, signs in with their passkey, then lands back on your <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">redirectUrl</code> with a <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">?token=...</code> in the query string.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="A" />
                <p className="text-sm font-semibold text-white">Trigger the connect redirect</p>
              </div>
              <p className="text-slate-400 text-xs ml-10">
                Call this from your connect button. The page navigates away immediately — the user sees the Orbi authentication screen.
              </p>
              <CodeBlock code={`// components/ConnectButton.tsx
'use client';

import { orbi } from '../lib/orbi';

export function ConnectButton() {
  function handleConnect() {
    orbi.connect({
      // The page Orbi will redirect back to after the user signs in
      redirectUrl: 'https://yourapp.com/orbi-callback',
    });
    // Page navigates away — nothing else to do here
  }

  return (
    <button onClick={handleConnect}>
      Connect with Orbi
    </button>
  );
}`} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="B" />
                <p className="text-sm font-semibold text-white">Create your callback page</p>
              </div>
              <p className="text-slate-400 text-xs ml-10">
                Create a page at the path you used as <code className="text-slate-300 bg-slate-800 px-1 rounded">redirectUrl</code>.
                Call <code className="text-slate-300 bg-slate-800 px-1 rounded">orbi.handleCallback()</code> — it reads the <code className="text-slate-300 bg-slate-800 px-1 rounded">?token=</code> from the current URL and exchanges it with the relay for wallet data.
                Returns <code className="text-slate-300 bg-slate-800 px-1 rounded">null</code> if there is no token (user navigated here directly).
              </p>
              <CodeBlock code={`// app/orbi-callback/page.tsx  (Next.js App Router)
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orbi } from '../../lib/orbi';

export default function OrbiCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    orbi.handleCallback().then((wallet) => {
      if (!wallet) {
        // No token found — user came here directly
        router.replace('/');
        return;
      }

      // wallet = { walletAddress: string, passkeyId: string, email: string }
      //
      // walletAddress — the Stellar C... address of the user's smart wallet
      // passkeyId     — used to derive the address offline (see API reference)
      // email         — the user's email registered with Orbi
      localStorage.setItem('walletAddress', wallet.walletAddress);
      localStorage.setItem('passkeyId', wallet.passkeyId);
      localStorage.setItem('email', wallet.email);

      router.replace('/dashboard');
    });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-400 text-sm">Connecting your wallet…</p>
    </div>
  );
}`} />
            </div>

            <Note>
              After <code className="text-slate-300">handleCallback()</code> resolves, save <code className="text-slate-300">walletAddress</code> in local storage or state — you'll need it for every future sign request. The token is single-use and expires after a few minutes.
            </Note>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="C" />
                <p className="text-sm font-semibold text-white">Check if already connected (on app load)</p>
              </div>
              <p className="text-slate-400 text-xs ml-10">
                On page load, check local storage. If a wallet address exists, the user is already connected — no redirect needed.
              </p>
              <CodeBlock code={`// lib/wallet.ts — helpers for reading/writing wallet state
export function getWalletAddress(): string | null {
  return localStorage.getItem('walletAddress');
}

export function isConnected(): boolean {
  return !!getWalletAddress();
}

export function disconnect() {
  localStorage.removeItem('walletAddress');
  localStorage.removeItem('passkeyId');
  localStorage.removeItem('email');
}`} />
            </div>
          </section>

          <Divider />

          {/* ── 4. Sign a Transaction ────────────────────────────────────────── */}
          <section id="sign" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">4. Sign a Transaction</h2>
              <p className="text-slate-400 text-sm">
                To call a Soroban contract: encode your arguments as XDR, call <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">orbi.sign()</code> to redirect the user, then on return call <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">handleSignCallback()</code> + <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">bundle()</code> to submit. Stellar confirms in ~5 seconds.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="A" />
                <p className="text-sm font-semibold text-white">Encode args and trigger the sign redirect</p>
              </div>
              <p className="text-slate-400 text-xs ml-10">
                Every Soroban argument must be XDR-encoded as a base64 string using <code className="text-slate-300 bg-slate-800 px-1 rounded">nativeToScVal</code> from the Stellar SDK. The example below calls a standard token <code className="text-slate-300 bg-slate-800 px-1 rounded">transfer(from, to, amount)</code> function. See the <a href="#xdr-args" className="text-blue-400 hover:underline">Encoding Args</a> section for all types.
              </p>
              <CodeBlock code={`// Example: call transfer(from, to, amount) on a Soroban token
'use client';

import { nativeToScVal } from '@stellar/stellar-sdk';
import { orbi } from '../lib/orbi';

const TOKEN_CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN';

export function SendButton({ recipient, amountXlm }: { recipient: string; amountXlm: number }) {
  function handleSend() {
    const walletAddress = localStorage.getItem('walletAddress')!;

    // 1 XLM = 10,000,000 stroops — always use BigInt for i128
    const amountInStroops = BigInt(Math.round(amountXlm * 10_000_000));

    const argsXdr = [
      nativeToScVal(walletAddress, { type: 'address' }).toXDR('base64'), // from
      nativeToScVal(recipient, { type: 'address' }).toXDR('base64'),     // to
      nativeToScVal(amountInStroops, { type: 'i128' }).toXDR('base64'), // amount
    ];

    orbi.sign({
      walletAddress,
      contractId: TOKEN_CONTRACT_ID,
      functionName: 'transfer',
      argsXdr,
      // The page Orbi will redirect back to after the user approves
      redirectUrl: 'https://yourapp.com/sign-callback',
    });
    // Page navigates away — user sees the Orbi approval screen
    // They can see: function name, contract, fee (or "Sponsored" if apiKey is set)
  }

  return <button onClick={handleSend}>Send {amountXlm} XLM</button>;
}`} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="B" />
                <p className="text-sm font-semibold text-white">Create your sign-callback page</p>
              </div>
              <p className="text-slate-400 text-xs ml-10">
                When the user approves, Orbi redirects back to your <code className="text-slate-300 bg-slate-800 px-1 rounded">redirectUrl</code> with the signed authorization entry in the query string. Call <code className="text-slate-300 bg-slate-800 px-1 rounded">handleSignCallback()</code> to extract it, then <code className="text-slate-300 bg-slate-800 px-1 rounded">bundle()</code> to submit to the relay, then <code className="text-slate-300 bg-slate-800 px-1 rounded">waitForConfirmation()</code> to wait for the chain.
              </p>
              <CodeBlock code={`// app/sign-callback/page.tsx  (Next.js App Router)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orbi } from '../../lib/orbi';

// Must match what you passed to orbi.sign()
const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN';
const FUNCTION_NAME = 'transfer';

type Status = 'processing' | 'confirmed' | 'failed' | 'cancelled';

export default function SignCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('processing');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const result = orbi.handleSignCallback();

    if (!result) {
      // No signed data in URL — user cancelled or navigated here directly
      router.replace('/');
      return;
    }

    // result contains everything needed to submit:
    // {
    //   walletAddress: string       — the signer's wallet address
    //   quoteId: string             — ties this signed entry to the fee quote
    //   signedAuthEntryXdr: string  — the passkey-signed authorization
    //   argsXdr: string[]           — the re-signed contract arguments
    //   nativeSacId: string         — XLM SAC contract id (for fee payment)
    // }

    orbi
      .bundle({
        walletAddress: result.walletAddress,
        quoteId: result.quoteId,
        signedAuthEntryXdr: result.signedAuthEntryXdr,
        contractId: CONTRACT_ID,    // same as in orbi.sign()
        functionName: FUNCTION_NAME, // same as in orbi.sign()
        argsXdr: result.argsXdr,
      })
      .then(({ opId }) => {
        // opId lets you track this operation's status
        return orbi.waitForConfirmation(opId);
      })
      .then((op) => {
        // op.status is 'confirmed' or 'failed'
        // op.txHash is the Stellar transaction hash (when confirmed)
        if (op.status === 'confirmed') {
          setTxHash(op.txHash ?? '');
          setStatus('confirmed');
        } else {
          setError(op.error ?? 'Transaction failed');
          setStatus('failed');
        }
      })
      .catch((err: Error) => {
        setError(err.message);
        setStatus('failed');
      });
  }, [router]);

  if (status === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Submitting transaction…</p>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-green-400 font-semibold">Transaction confirmed!</p>
        <a
          href={\`https://stellar.expert/explorer/testnet/tx/\${txHash}\`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 text-xs hover:underline"
        >
          View on explorer →
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <p className="text-red-400 font-semibold">Transaction failed</p>
      <p className="text-slate-500 text-sm">{error}</p>
      <button onClick={() => router.replace('/')} className="text-blue-400 text-sm hover:underline">
        Go back
      </button>
    </div>
  );
}`} />
            </div>

            <Note>
              <code className="text-slate-300">waitForConfirmation()</code> uses SSE — it opens a streaming connection and resolves the moment the transaction lands on-chain (usually under 10 seconds). Use <code className="text-slate-300">getStatus(opId)</code> instead if you want a single one-shot poll without SSE.
            </Note>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="C" />
                <p className="text-sm font-semibold text-white">Handling multiple contract calls</p>
              </div>
              <p className="text-slate-400 text-xs ml-10">
                If your dApp calls multiple different functions, store <code className="text-slate-300 bg-slate-800 px-1 rounded">contractId</code> and <code className="text-slate-300 bg-slate-800 px-1 rounded">functionName</code> in <code className="text-slate-300 bg-slate-800 px-1 rounded">sessionStorage</code> before redirecting so the callback page knows what was being signed.
              </p>
              <CodeBlock code={`// Before calling orbi.sign():
sessionStorage.setItem('pendingContractId', TOKEN_CONTRACT_ID);
sessionStorage.setItem('pendingFunctionName', 'transfer');

orbi.sign({ walletAddress, contractId: TOKEN_CONTRACT_ID, functionName: 'transfer', argsXdr, redirectUrl });

// In your sign-callback page:
const contractId   = sessionStorage.getItem('pendingContractId')!;
const functionName = sessionStorage.getItem('pendingFunctionName')!;

const result = orbi.handleSignCallback();
if (result) {
  await orbi.bundle({ ...result, contractId, functionName });
}`} />
            </div>
          </section>

          <Divider />

          {/* ── 5. Gasless ───────────────────────────────────────────────────── */}
          <section id="gasless" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">5. Gasless Transactions</h2>
              <p className="text-slate-400 text-sm">
                Sponsor Stellar network fees for your users — they see the fee crossed out and{' '}
                <span className="text-green-400">"Sponsored by [your app]"</span> on the approval screen. They pay nothing. You only need two things: a funded Stellar account (your gas tank) and your API key in the client.
              </p>
            </div>

            <div className="space-y-6">

              {/* Step 1 */}
              <div className="flex gap-4">
                <StepBadge n="1" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-white">Get your API key from the developer portal</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Go to <a href="https://developers.orbiwallet.xyz" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">developers.orbiwallet.xyz</a>, create an account with your email. Your API key is shown once on registration — copy it immediately and store it somewhere safe (a password manager, <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">.env</code> file). You can always rotate it from the dashboard.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <StepBadge n="2" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-white">Create a Stellar keypair for your gas tank</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Your gas tank is a regular Stellar G... account. It needs to hold XLM — each sponsored transaction deducts the exact network fee (fractions of a cent). Keep the secret key secure and never commit it.
                  </p>
                  <CodeBlock code={`# Option A — Stellar CLI
stellar keys generate orbi-gas-tank

# Option B — via @stellar/stellar-sdk (run once, save output)
import { Keypair } from '@stellar/stellar-sdk';

const kp = Keypair.random();
console.log('Public key (G...):', kp.publicKey());  // share this with Orbi
console.log('Secret key (S...):', kp.secret());     // keep this private — never commit it`} />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <StepBadge n="3" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-white">Fund your gas tank with XLM</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    The account must be activated on-chain with at least 1 XLM (the Stellar minimum reserve). Add more to cover sponsorship — 100 XLM covers tens of thousands of transactions.
                  </p>
                  <CodeBlock code={`# Testnet — use friendbot to fund for free
curl "https://friendbot.stellar.org?addr=YOUR_G_ADDRESS"

# Mainnet — send XLM from any wallet (Lobstr, Freighter, exchange withdrawal)
# to your G... gas tank address. Minimum: 1 XLM to activate the account.
# Recommended: start with 50–100 XLM.`} />
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <StepBadge n="4" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-white">Set the deployer in your developer dashboard</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    In the <a href="https://developers.orbiwallet.xyz/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">developer dashboard</a>, open "Gas Tank" → "Set up gas tank". Paste your public key (G...). Orbi will now use this account to pay fees on behalf of your users. You can see the live balance and replace the account anytime.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <StepBadge n="5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-white">Add your API key to <code className="text-white font-mono text-xs">OrbiClient</code></p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    This is the <strong className="text-slate-200">only code change</strong> needed. Everything else — connect, sign, bundle — works exactly the same. The Orbi approval screen will show the fee as sponsored.
                  </p>
                  <CodeBlock code={`// .env.local  (never commit this file)
NEXT_PUBLIC_ORBI_API_KEY=orbi_your_key_here`} />
                  <CodeBlock code={`// lib/orbi.ts  — updated
import { OrbiClient } from '@orbi-wallet/sdk';

export const orbi = new OrbiClient({
  apiUrl: 'https://api.orbiwallet.xyz',
  apiKey: process.env.NEXT_PUBLIC_ORBI_API_KEY,  // ← the only change
});

// That's it. Users with Orbi wallets now pay zero gas.`} />
                </div>
              </div>

              {/* Step 6 — monitor */}
              <div className="flex gap-4">
                <StepBadge n="6" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-white">Monitor your gas tank balance</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    The dashboard shows your live balance and warns you when it drops below 10 XLM. You can also check programmatically:
                  </p>
                  <CodeBlock code={`import { orbi } from '../lib/orbi';

const { balanceXlm, address } = await orbi.getDeployerBalance();
console.log(\`Gas tank (\${address}): \${balanceXlm} XLM remaining\`);

// Top up by sending XLM to \`address\` from any wallet`} />
                </div>
              </div>
            </div>

            <Warn>
              Never expose your Stellar secret key (S...) in client-side code or commit it to git. Keep it only in your backend environment or a secrets manager. The public key (G...) is safe to share — that is what you register in the portal.
            </Warn>
            <Note>
              Gas sponsorship only applies to users with Orbi wallets. Users on Freighter, Lobstr, or any other wallet are completely unaffected — the <code className="text-slate-300">apiKey</code> is silently ignored for non-Orbi wallets.
            </Note>
          </section>

          <Divider />

          {/* ── Watch Asset ──────────────────────────────────────────────────── */}
          <section id="watch-asset" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-white">Watch Asset (Add Token)</h2>
            <p className="text-slate-400 text-sm">
              Let users add your Soroban token to their Orbi wallet dashboard with one click. Useful for custom tokens — the user sees it in their token list after adding.
            </p>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">Trigger the watch-asset redirect</p>
              <CodeBlock code={`import { orbi } from '../lib/orbi';

function AddTokenButton() {
  function handleAddToken() {
    orbi.watchAsset({
      contractId: 'CYOUR_TOKEN_CONTRACT_ID',
      redirectUrl: 'https://yourapp.com/watch-asset-callback',
    });
  }

  return <button onClick={handleAddToken}>Add [TOKEN] to Orbi</button>;
}`} />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">Create your watch-asset callback page</p>
              <CodeBlock code={`// app/watch-asset-callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orbi } from '../../lib/orbi';

export default function WatchAssetCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const result = orbi.handleWatchAssetCallback();

    if (!result) {
      router.replace('/');
      return;
    }

    // result = { contractId: string, added: boolean }
    if (result.added) {
      console.log('Token added to Orbi wallet:', result.contractId);
      // Show a success message, update your UI, etc.
    } else {
      console.log('User declined to add the token');
    }

    router.replace('/');
  }, [router]);

  return <p>Processing…</p>;
}`} />
            </div>
          </section>

          <Divider />

          {/* ── XDR Args ─────────────────────────────────────────────────────── */}
          <section id="xdr-args" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-white">Encoding Contract Args (XDR)</h2>
            <p className="text-slate-400 text-sm">
              Soroban arguments must be passed as base64 XDR strings. Use <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">nativeToScVal</code> from <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">@stellar/stellar-sdk</code> to convert native JavaScript values to the XDR format. Each arg is encoded separately.
            </p>

            <CodeBlock code={`import { nativeToScVal, xdr } from '@stellar/stellar-sdk';

// ── Addresses (Stellar G... or C... accounts) ─────────────────────────────
const addressArg = nativeToScVal('GBXXX...', { type: 'address' }).toXDR('base64');

// ── Integers ──────────────────────────────────────────────────────────────
const i32Arg  = nativeToScVal(42, { type: 'i32' }).toXDR('base64');
const u32Arg  = nativeToScVal(42, { type: 'u32' }).toXDR('base64');
// Use BigInt for i128/u128 — regular numbers lose precision at large values
const i128Arg = nativeToScVal(BigInt(10_000_000), { type: 'i128' }).toXDR('base64');
const u128Arg = nativeToScVal(BigInt(10_000_000), { type: 'u128' }).toXDR('base64');

// ── Booleans ──────────────────────────────────────────────────────────────
const boolArg = nativeToScVal(true, { type: 'bool' }).toXDR('base64');

// ── Strings ───────────────────────────────────────────────────────────────
const strArg  = nativeToScVal('hello world', { type: 'string' }).toXDR('base64');
const symArg  = nativeToScVal('Approved', { type: 'symbol' }).toXDR('base64');

// ── Bytes ─────────────────────────────────────────────────────────────────
const bytesArg = nativeToScVal(Buffer.from('deadbeef', 'hex'), { type: 'bytes' }).toXDR('base64');

// ── Vectors (arrays) ──────────────────────────────────────────────────────
const vecArg = xdr.ScVal.scvVec([
  nativeToScVal('GBXXX...', { type: 'address' }),
  nativeToScVal('GBYYY...', { type: 'address' }),
]).toXDR('base64');

// ── Maps ──────────────────────────────────────────────────────────────────
const mapArg = xdr.ScVal.scvMap([
  new xdr.ScMapEntry({
    key: nativeToScVal('amount', { type: 'symbol' }),
    val: nativeToScVal(BigInt(1_000_000), { type: 'i128' }),
  }),
]).toXDR('base64');

// ── Full example: SAC token transfer(from, to, amount) ────────────────────
//   1 XLM = 10,000,000 stroops
const transferArgs = [
  nativeToScVal(senderAddress, { type: 'address' }).toXDR('base64'),   // from
  nativeToScVal(recipientAddress, { type: 'address' }).toXDR('base64'), // to
  nativeToScVal(BigInt(5_000_000), { type: 'i128' }).toXDR('base64'), // 0.5 XLM
];

orbi.sign({
  walletAddress: senderAddress,
  contractId: XLM_SAC_CONTRACT_ID,
  functionName: 'transfer',
  argsXdr: transferArgs,
  redirectUrl: 'https://yourapp.com/sign-callback',
});`} />

            <Note>
              <strong className="text-slate-300">XLM amounts are in stroops:</strong> 1 XLM = 10,000,000 stroops.
              Always use <code className="text-slate-300">BigInt</code> for <code className="text-slate-300">i128</code>/<code className="text-slate-300">u128</code> — JavaScript numbers are 64-bit floats and lose precision above ~9 quadrillion, which is well within realistic token amounts.
            </Note>

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">XLM SAC contract IDs</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-slate-500 shrink-0 w-20">Testnet</span>
                  <code className="text-slate-300 text-xs break-all">CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN</code>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs text-slate-500 shrink-0 w-20">Mainnet</span>
                  <code className="text-slate-300 text-xs break-all">CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWL</code>
                </div>
              </div>
            </div>
          </section>

          <Divider />

          {/* ── API Reference ────────────────────────────────────────────────── */}
          <section id="api-reference" className="scroll-mt-24 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">API Reference</h2>
              <p className="text-slate-400 text-sm">All methods available on the <code className="text-slate-300 bg-slate-800 px-1 rounded text-xs">OrbiClient</code> class.</p>
            </div>

            {([
              {
                group: 'Constructor',
                methods: [
                  {
                    name: 'new OrbiClient({ apiUrl, apiKey? })',
                    returns: 'OrbiClient',
                    description: 'Create a client instance. apiUrl is always https://api.orbiwallet.xyz. Optional apiKey enables gas sponsorship.',
                  },
                ],
              },
              {
                group: 'Wallet Connection',
                methods: [
                  {
                    name: 'connect({ redirectUrl })',
                    returns: 'void',
                    description: 'Redirect the user to keys.orbiwallet.xyz to sign in with their passkey. User lands back at redirectUrl?token=...',
                  },
                  {
                    name: 'handleCallback()',
                    returns: 'Promise<{ walletAddress, passkeyId, email } | null>',
                    description: 'Call on your callback page. Exchanges the ?token= in the current URL for wallet data. Returns null if no token is present.',
                  },
                ],
              },
              {
                group: 'Transaction Signing',
                methods: [
                  {
                    name: 'sign({ walletAddress, contractId, functionName, argsXdr, redirectUrl })',
                    returns: 'void',
                    description: 'Redirect the user to approve a contract call. argsXdr is an array of base64 XDR-encoded ScVal arguments. If apiKey is set, the user sees the fee as sponsored.',
                  },
                  {
                    name: 'handleSignCallback()',
                    returns: '{ signedAuthEntryXdr, quoteId, argsXdr, nativeSacId, walletAddress } | null',
                    description: 'Call on your sign-callback page. Extracts signed data from the URL. Pass the result directly to bundle(). Returns null if the user cancelled or there is nothing to process.',
                  },
                ],
              },
              {
                group: 'Relay',
                methods: [
                  {
                    name: 'bundle({ walletAddress, quoteId, signedAuthEntryXdr, contractId, functionName, argsXdr })',
                    returns: 'Promise<{ opId: string }>',
                    description: 'Submit a signed operation to the Orbi relay for on-chain execution. Returns an opId you can use to track status.',
                  },
                  {
                    name: 'waitForConfirmation(opId)',
                    returns: 'Promise<OpStatus>',
                    description: 'Wait for confirmed or failed via SSE. Resolves in ~5–10s. OpStatus: { opId, status: "confirmed" | "failed", txHash: string | null, error: string | null }.',
                  },
                  {
                    name: 'getStatus(opId)',
                    returns: 'Promise<OpStatus>',
                    description: 'One-shot status poll — non-blocking alternative to waitForConfirmation(). Useful when you want to check status without holding a connection open.',
                  },
                ],
              },
              {
                group: 'Token Management',
                methods: [
                  {
                    name: 'watchAsset({ contractId, redirectUrl })',
                    returns: 'void',
                    description: 'Redirect the user to add a Soroban token to their Orbi wallet. They will see the token in their dashboard after adding.',
                  },
                  {
                    name: 'handleWatchAssetCallback()',
                    returns: '{ contractId: string, added: boolean } | null',
                    description: 'Call on your watch-asset callback page. Returns the contractId and whether the user added it. Returns null if no result in URL.',
                  },
                ],
              },
              {
                group: 'Gas Tank (Developer)',
                methods: [
                  {
                    name: 'getDeployerBalance()',
                    returns: 'Promise<{ address, balanceXlm, balanceStroops }>',
                    description: 'Check the XLM balance of your registered gas tank. Requires apiKey in the constructor.',
                  },
                  {
                    name: 'setDeployer(deployerPublicKey)',
                    returns: 'Promise<void>',
                    description: 'Set or update the G... address that funds gas for your users. Requires apiKey. You can also do this in the dashboard.',
                  },
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
