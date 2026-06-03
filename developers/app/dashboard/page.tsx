'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSession, clearSession } from '../../lib/session';
import { getMe, getBalance, rotateKey, type DevAccount, type DeployerBalance } from '../../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [account, setAccount] = useState<DevAccount | null>(null);
  const [balance, setBalance] = useState<DeployerBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newKeyCopied, setNewKeyCopied] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }

    (async () => {
      try {
        const [me, bal] = await Promise.allSettled([
          getMe(session.sessionToken),
          getBalance(session.sessionToken),
        ]);
        if (me.status === 'fulfilled') setAccount(me.value);
        if (bal.status === 'fulfilled') setBalance(bal.value);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function handleSignOut() {
    clearSession();
    router.replace('/');
  }

  async function handleRotateKey() {
    if (!confirm('Generate a new API key? Your old key will stop working immediately.')) return;
    const session = getSession();
    if (!session) return;
    setRotating(true);
    try {
      const { apiKey } = await rotateKey(session.sessionToken);
      setNewKey(apiKey);
      if (account) setAccount({ ...account, apiKeyHint: `orbi_••••••••${apiKey.slice(-4)}` });
    } finally {
      setRotating(false);
    }
  }

  async function copyNewKey() {
    await navigator.clipboard.writeText(newKey);
    setNewKeyCopied(true);
    setTimeout(() => setNewKeyCopied(false), 2000);
  }

  async function copySnippet() {
    const snippet = `const { opId } = await fetch('https://api.orbiwallet.xyz/v1/bundle', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json',\n    'Authorization': 'Bearer YOUR_API_KEY',  // <-- sponsors the gas\n  },\n  body: JSON.stringify({\n    walletAddress,\n    quoteId: result.quoteId,\n    authEntryXdr: result.signedAuthEntryXdr,\n    call: {\n      contractId,\n      function: functionName,\n      argsXdr: result.argsXdr,\n    },\n  }),\n}).then(r => r.json());`;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Image
            src="https://account.orbiwallet.xyz/Orbi%20logo%20-%20Landscape%20white.png"
            alt="Orbi"
            width={120}
            height={34}
            style={{ height: 'auto' }}
            unoptimized
          />
          <div className="flex items-center gap-4">
            <span className="text-slate-500 text-sm hidden sm:block">{account?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">
          {account?.developerName ?? 'Developer'} Dashboard
        </h1>
        <p className="text-slate-400 text-sm mb-8">Manage your gas sponsorship and API access.</p>

        <div className="space-y-4">

          {/* API Key card */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">API Key</p>
              <button
                onClick={handleRotateKey}
                disabled={rotating}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {rotating ? 'Rotating...' : 'Rotate key'}
              </button>
            </div>

            {newKey ? (
              <div className="bg-[#020817] border border-green-800 rounded-xl p-4 mb-2">
                <p className="text-xs text-green-500 mb-2 font-medium">New key — save it now, won&apos;t be shown again</p>
                <div className="flex items-center gap-3">
                  <code className="text-green-400 text-sm break-all flex-1">{newKey}</code>
                  <button onClick={copyNewKey} className="shrink-0 text-slate-400 hover:text-white transition-colors">
                    {newKeyCopied
                      ? <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    }
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#020817] border border-[#334155] rounded-xl px-4 py-3">
                <code className="text-slate-400 text-sm">{account?.apiKeyHint ?? 'orbi_••••••••••••'}</code>
              </div>
            )}
            <p className="text-slate-600 text-xs mt-2">Your raw key is never stored — rotate to get a new one.</p>
          </div>

          {/* Deployer / gas tank card */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gas Tank</p>
              {account?.deployerPublicKey && (
                <Link href="/setup" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Replace account
                </Link>
              )}
            </div>

            {account?.deployerPublicKey ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Deployer address</p>
                  <code className="text-slate-300 text-xs break-all">{account.deployerPublicKey}</code>
                </div>
                {balance ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{parseFloat(balance.balanceXlm).toFixed(2)}</span>
                    <span className="text-slate-400 text-sm">XLM</span>
                    {parseFloat(balance.balanceXlm) < 10 && (
                      <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Low balance</span>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Could not fetch balance</p>
                )}
                <p className="text-slate-600 text-xs">Send XLM to your deployer address to top up.</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm mb-4">No gas tank configured. Set one up to start sponsoring gas for your users.</p>
                <Link
                  href="/setup"
                  className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Set up gas tank
                </Link>
              </div>
            )}
          </div>

          {/* Integration guide */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 space-y-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quick Start — Gasless Transactions</p>

            <p className="text-slate-400 text-sm leading-relaxed">
              Orbi gasless lets your users interact with your dApp without paying network fees.
              You cover the gas from your deployer account (the Gas Tank above).
              No changes to your smart contract — it&apos;s purely a frontend integration.
            </p>

            {/* Step 1 */}
            <div>
              <p className="text-white text-sm font-semibold mb-1">Step 1 — Fund your Gas Tank</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Send XLM to your deployer address shown above. Each sponsored transaction deducts the exact network fee returned in the quote from your balance. Keep it topped up.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <p className="text-white text-sm font-semibold mb-1">Step 2 — Get a quote</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Before asking the user to sign, fetch a quote from Orbi. This returns an <code className="text-slate-300 bg-slate-800 px-1 rounded">authEntryXdr</code> — the authorization entry the user needs to sign.
              </p>
              <pre className="text-slate-300 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-words bg-[#020817] rounded-xl p-4">
{`const quote = await fetch('https://api.orbiwallet.xyz/v1/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress,   // user's Orbi wallet address
    contractId,      // your Stellar contract address
    functionName,    // the function being called
    argsXdr,         // function arguments as base64 ScVal array
  }),
}).then(r => r.json());

// quote.authEntryXdr  — pass this to the Orbi sign popup
// quote.quoteId       — include this in the bundle call`}
              </pre>
            </div>

            {/* Step 3 */}
            <div>
              <p className="text-white text-sm font-semibold mb-1">Step 3 — Open the Orbi sign popup</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Open a popup to <code className="text-slate-300 bg-slate-800 px-1 rounded">keys.orbiwallet.xyz/sign</code> so the user can approve with their passkey. Listen for the result on a <code className="text-slate-300 bg-slate-800 px-1 rounded">BroadcastChannel</code>.
              </p>
              <pre className="text-slate-300 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-words bg-[#020817] rounded-xl p-4">
{`const channelId = crypto.randomUUID();

const params = new URLSearchParams({
  channelId,
  walletAddress,
  contractId,
  functionName,
  argsXdr: JSON.stringify(argsXdr),
  origin: window.location.origin,
  apiKey: 'YOUR_API_KEY',  // <-- pass your API key here
});

window.open(
  \`https://keys.orbiwallet.xyz/sign?\${params}\`,
  'orbi_sign',
  'width=400,height=600',
);

// Wait for the user to approve
const result = await new Promise((resolve, reject) => {
  const bc = new BroadcastChannel(channelId);
  bc.onmessage = (e) => {
    bc.close();
    if (e.data.type === 'orbi_signed') resolve(e.data);
    else reject(new Error('User rejected'));
  };
});

// result.signedAuthEntryXdr — signed auth entry
// result.argsXdr            — signed args (use these, not the original)
// result.quoteId            — quote id
// result.nativeSacId        — native XLM SAC contract id`}
              </pre>
            </div>

            {/* Step 4 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-white text-sm font-semibold">Step 4 — Submit the bundle</p>
                <button onClick={copySnippet} className="text-xs text-slate-400 hover:text-white transition-colors">
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Submit the signed result to Orbi with your API key. Orbi batches it on-chain and pays the network fee from your Gas Tank.
              </p>
              <pre className="text-slate-300 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-words bg-[#020817] rounded-xl p-4">
{`const { opId } = await fetch('https://api.orbiwallet.xyz/v1/bundle', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY',  // <-- sponsors the gas
  },
  body: JSON.stringify({
    walletAddress,
    quoteId: result.quoteId,
    authEntryXdr: result.signedAuthEntryXdr,
    call: {
      contractId,
      function: functionName,
      argsXdr: result.argsXdr,  // use signed args from step 3
    },
  }),
}).then(r => r.json());

// opId — use this to track the transaction status`}
              </pre>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p className="text-blue-300 text-xs leading-relaxed">
                Gas sponsorship applies to users with an Orbi smart wallet. Users on other wallets (Freighter, Lobstr) submit transactions directly and are unaffected.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
