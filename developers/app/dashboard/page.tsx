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
    const snippet = `import { OrbiClient } from '@orbi/sdk';\n\nconst orbi = new OrbiClient({\n  apiUrl: 'https://api.orbiwallet.xyz',\n  apiKey: 'YOUR_API_KEY',  // <-- add this to enable gasless\n});`;
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
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quick Start — Gasless</p>
              <button onClick={copySnippet} className="text-xs text-slate-400 hover:text-white transition-colors">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">
              Two steps to enable gasless transactions for your Orbi users. No backend required. No contract changes.
            </p>

            {/* Step 1 */}
            <div>
              <p className="text-white text-sm font-semibold mb-1">Step 1 — Fund your Gas Tank</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Send XLM to your deployer address shown above. Each sponsored transaction deducts the exact network fee from your balance. Keep it topped up.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <p className="text-white text-sm font-semibold mb-2">Step 2 — Add your API key to your OrbiClient</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                In your existing <code className="text-slate-300 bg-slate-800 px-1 rounded">OrbiClient</code>, add <code className="text-slate-300 bg-slate-800 px-1 rounded">apiKey</code>. That&apos;s it — your users now pay nothing for gas.
              </p>
              <pre className="text-slate-300 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-words bg-[#020817] rounded-xl p-4">
{`import { OrbiClient } from '@orbi/sdk';

const orbi = new OrbiClient({
  apiUrl: 'https://api.orbiwallet.xyz',
  apiKey: 'YOUR_API_KEY',  // <-- add this to enable gasless
});`}
              </pre>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p className="text-slate-400 text-xs leading-relaxed">
                Your dApp must already have Orbi smart wallet integrated using <code className="text-slate-300 bg-slate-800 px-1 rounded">@orbi/sdk</code> before gasless will work. Gas sponsorship only applies to users with an Orbi smart wallet — other wallets are unaffected.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
