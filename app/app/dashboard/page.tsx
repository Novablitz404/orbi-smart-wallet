'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loadWallet, clearWallet } from '../../lib/storage';
import { Address, Networks, Asset, nativeToScVal } from '@stellar/stellar-sdk';

const dicebearUrl = (seed: string, size: number) =>
  `https://api.dicebear.com/9.x/rings/svg?seed=${encodeURIComponent(seed)}&size=${size}`;

const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;
const KEYS_URL = 'https://keys.orbiwallet.xyz';
const ACCOUNT_URL = 'https://account.orbiwallet.xyz';
const STROOPS_PER_XLM = 10_000_000;
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

function truncate(addr: string) { return `${addr.slice(0, 6)}...${addr.slice(-4)}`; }

interface Quote { quoteId: string; feeXlm: string; nativeSacId: string; }
type PanelStep = 'send-form' | 'send-preview' | 'receive';

export default function DashboardPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<ReturnType<typeof loadWallet>>(null);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);
  const [xlmPrice, setXlmPrice] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeNav, setActiveNav] = useState('assets');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Send/Receive panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelStep, setPanelStep] = useState<PanelStep>('send-form');
  const [panelTab, setPanelTab] = useState<'send' | 'receive'>('send');
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendQuote, setSendQuote] = useState<Quote | null>(null);
  const [sendQuoting, setSendQuoting] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const w = loadWallet();
    if (!w) { router.replace('/'); return; }
    setWallet(w);
    fetch(`${RELAY_URL}/v1/wallet/balance/${w.walletAddress}`)
      .then(r => r.json()).then((d: { xlm?: string }) => setXlmBalance(d.xlm ?? '0.0000000'))
      .catch(() => setXlmBalance('0.0000000'));
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd')
      .then(r => r.json()).then((d: { stellar?: { usd?: number } }) => setXlmPrice(d.stellar?.usd ?? null))
      .catch(() => setXlmPrice(null));
  }, [router]);

  function copyAddress() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.walletAddress);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function signOut() {
    clearWallet();
    window.location.href = 'https://keys.orbiwallet.xyz/signout?redirect=https://account.orbiwallet.xyz';
  }

  function openPanel(tab: 'send' | 'receive') {
    setPanelTab(tab);
    setPanelStep(tab === 'send' ? 'send-form' : 'receive');
    setSendTo(''); setSendAmount(''); setSendQuote(null); setSendError('');
    setPanelOpen(true);
  }

  function setMax() {
    if (xlmBalance) setSendAmount(parseFloat(xlmBalance).toFixed(2));
  }

  async function handlePreview() {
    if (!wallet || !sendTo.trim() || !sendAmount) return;
    setSendQuoting(true); setSendError('');
    try {
      const amountStroops = Math.round(parseFloat(sendAmount) * STROOPS_PER_XLM);
      const nativeSacId = Asset.native().contractId(NETWORK_PASSPHRASE);
      const argsXdr = [
        new Address(wallet.walletAddress).toScVal(),
        new Address(sendTo.trim()).toScVal(),
        nativeToScVal(BigInt(amountStroops), { type: 'i128' }),
      ].map(a => Buffer.from(a.toXDR()).toString('base64'));
      const res = await fetch(`${RELAY_URL}/v1/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet.walletAddress, contractId: nativeSacId, functionName: 'transfer', argsXdr }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Quote failed');
      const q = await res.json() as Quote;
      setSendQuote(q);
      setPanelStep('send-preview');
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : 'Quote failed');
    } finally { setSendQuoting(false); }
  }

  function handleConfirm() {
    if (!wallet || !sendQuote) return;
    const amountStroops = Math.round(parseFloat(sendAmount) * STROOPS_PER_XLM);
    const nativeSacId = Asset.native().contractId(NETWORK_PASSPHRASE);
    const argsXdr = JSON.stringify([
      new Address(wallet.walletAddress).toScVal(),
      new Address(sendTo.trim()).toScVal(),
      nativeToScVal(BigInt(amountStroops), { type: 'i128' }),
    ].map(a => Buffer.from(a.toXDR()).toString('base64')));
    const params = new URLSearchParams({
      redirect: `${ACCOUNT_URL}/sign-callback`,
      origin: window.location.origin,
      walletAddress: wallet.walletAddress,
      contractId: nativeSacId,
      functionName: 'transfer',
      argsXdr,
    });
    window.location.href = `${KEYS_URL}/sign?${params}`;
  }

  const xlmFloat = xlmBalance ? parseFloat(xlmBalance) : 0;
  const usdValue = xlmPrice ? xlmFloat * xlmPrice : null;
  const sendUsd = xlmPrice && sendAmount ? (parseFloat(sendAmount) * xlmPrice).toFixed(2) : '0.00';

  if (!wallet) return null;

  return (
    <div className="flex min-h-screen bg-[#020817] relative">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 border-r border-slate-800 px-4 py-6 shrink-0">
        <img src="/Orbi%20logo%20-%20Landscape%20white.png" alt="Orbi" className="h-9 w-auto max-w-[140px] mb-8" />
        <nav className="flex flex-col gap-1">
          {[
            { id: 'assets', label: 'Assets', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2"/></svg> },
            { id: 'activity', label: 'Activity', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> },
            { id: 'apps', label: 'Apps', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg> },
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveNav(id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeNav === id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
              {icon}{label}
            </button>
          ))}
        </nav>
        <div className="mt-8">
          <p className="text-slate-600 text-xs font-medium uppercase tracking-wider px-3 mb-2">Actions</p>
          <div className="flex flex-col gap-1">
            <button onClick={() => openPanel('send')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 text-sm transition-colors text-left">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>Send
            </button>
            <button onClick={() => openPanel('receive')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 text-sm transition-colors text-left">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>Receive
            </button>
          </div>
        </div>
        <div className="mt-auto" />
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-end px-10 pt-6 pb-2">
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(o => !o)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm hover:bg-slate-700/50 transition-colors">
              <img src={dicebearUrl(wallet.walletAddress, 24)} alt="avatar" className="w-6 h-6 rounded-full" />
              <span className="font-mono">{truncate(wallet.walletAddress)}</span>
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                <div className="px-5 pt-5 pb-3">
                  <p className="text-white font-semibold text-base mb-4">Your Account</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={dicebearUrl(wallet.walletAddress, 36)} alt="avatar" className="w-9 h-9 rounded-full shrink-0" />
                      <div>
                        <p className="text-white text-sm font-medium truncate max-w-[120px]">{wallet.email}</p>
                        <button onClick={copyAddress} className="flex items-center gap-1 text-slate-500 text-xs hover:text-slate-300 transition-colors">
                          <span className="font-mono">{truncate(wallet.walletAddress)}</span>
                          <span>{copied ? '✓' : '⎘'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-white text-sm font-medium">{usdValue !== null ? `$${usdValue.toFixed(2)}` : '—'}</p>
                  </div>
                </div>
                <div className="px-3 pb-3 flex flex-col gap-1">
                  <a href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center justify-between px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 transition-colors">
                    <span className="text-white text-sm font-medium">Settings</span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </a>
                  <button onClick={signOut} className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                    <span className="text-red-400 text-sm font-medium">Sign out</span>
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 pt-6 pb-4 border-b border-slate-800">
          <img src="/Orbi%20logo%20-%20Landscape%20white.png" alt="Orbi" className="h-6 w-auto" />
          <div className="flex items-center gap-3">
            <a href="/settings" className="text-slate-500 text-sm">Settings</a>
            <button onClick={signOut} className="text-slate-500 text-sm">Sign out</button>
          </div>
        </div>

        <div className="px-6 md:px-10 py-6 flex-1">
          <div className="mb-8">
            <p className="text-slate-400 text-base mb-1">Your balance:</p>
            <p className="text-5xl md:text-6xl font-bold text-white">
              {usdValue === null ? <span className="animate-pulse text-slate-600">$···</span> : `$${usdValue.toFixed(2)}`}
            </p>
          </div>

          {activeNav === 'assets' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-medium">Coins</h2>
                <span className="text-xs text-slate-500 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50">Stellar Testnet</span>
              </div>
              <div className="grid grid-cols-4 px-4 pb-2 border-b border-slate-800 text-slate-500 text-xs font-medium">
                <span>Asset</span><span className="text-right">Balance</span>
                <span className="text-right hidden md:block">Portfolio %</span>
                <span className="text-right hidden md:block">Price</span>
              </div>
              <div className="grid grid-cols-4 px-4 py-4 items-center hover:bg-slate-800/20 transition-colors rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                    <img src="/stellar-logo-white.png" alt="XLM" className="w-5 h-5 object-contain opacity-80" />
                  </div>
                  <div><p className="text-white text-sm font-medium">Stellar</p><p className="text-slate-500 text-xs">XLM</p></div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{usdValue !== null ? `$${usdValue.toFixed(2)}` : '—'}</p>
                  <p className="text-slate-500 text-xs">{xlmBalance !== null ? `${parseFloat(xlmBalance).toFixed(4)} XLM` : <span className="animate-pulse">···</span>}</p>
                </div>
                <div className="text-right hidden md:block"><p className="text-white text-sm">100%</p></div>
                <div className="text-right hidden md:block"><p className="text-white text-sm">{xlmPrice ? `$${xlmPrice.toFixed(4)}` : '—'}</p></div>
              </div>
            </>
          )}

          {activeNav === 'activity' && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-slate-500 text-sm">No transactions yet</p>
              <p className="text-slate-600 text-xs text-center max-w-xs">Your transaction history will appear here after your first send or receive.</p>
            </div>
          )}

          {activeNav === 'apps' && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-slate-500 text-sm">No apps connected</p>
              <p className="text-slate-600 text-xs text-center max-w-xs">Connect Orbi to Stellar dApps and they'll appear here.</p>
              <a href="/settings" className="mt-2 text-blue-400 text-xs hover:underline">Manage connections →</a>
            </div>
          )}
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden border-t border-slate-800 px-4 py-3 flex justify-around">
          {[{ id: 'assets', label: 'Assets' }, { id: 'activity', label: 'Activity' }, { id: 'apps', label: 'Apps' }].map(({ id, label }) => (
            <button key={id} onClick={() => setActiveNav(id)} className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${activeNav === id ? 'text-white bg-slate-800' : 'text-slate-500'}`}>{label}</button>
          ))}
        </div>
      </main>

      {/* ── Send/Receive slide panel ── */}
      {/* Backdrop */}
      {panelOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setPanelOpen(false)} />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-slate-900 border-l border-slate-700/50 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* ── Send form ── */}
        {panelStep === 'send-form' && (
          <>
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <button onClick={() => setPanelOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
                <button onClick={() => { setPanelTab('send'); setPanelStep('send-form'); }} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${panelTab === 'send' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>Send</button>
                <button onClick={() => { setPanelTab('receive'); setPanelStep('receive'); }} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${panelTab === 'receive' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>Receive</button>
              </div>
              <div className="w-5" />
            </div>

            <div className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">
              {/* Amount */}
              <div className="flex items-center gap-3 py-4 border-b border-slate-800">
                <input
                  type="number"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-5xl font-bold text-white outline-none placeholder-slate-700 w-0"
                />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-2xl font-light">USD</span>
                  <button onClick={setMax} className="text-xs text-slate-500 border border-slate-700 px-2.5 py-1 rounded-lg hover:border-slate-500 transition-colors">Max</button>
                </div>
              </div>
              {sendAmount && xlmPrice && (
                <p className="text-blue-400 text-sm flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
                  {(parseFloat(sendAmount) / xlmPrice).toFixed(4)} XLM
                </p>
              )}

              {/* Token */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <img src="/stellar-logo-white.png" alt="XLM" className="w-4 h-4 opacity-80" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Send</p>
                    <p className="text-slate-500 text-xs">Stellar (XLM)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm">{usdValue !== null ? `$${usdValue.toFixed(2)}` : '—'}</p>
                  <p className="text-slate-500 text-xs">Available</p>
                </div>
              </div>

              {/* Recipient */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input
                  value={sendTo}
                  onChange={e => setSendTo(e.target.value)}
                  placeholder="To: G... or C..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600 font-mono"
                />
              </div>

              {sendError && <p className="text-red-400 text-xs">{sendError}</p>}
            </div>

            <div className="p-5 border-t border-slate-800">
              <button
                onClick={handlePreview}
                disabled={!sendTo.trim() || !sendAmount || sendQuoting}
                className="w-full py-4 rounded-2xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {sendQuoting ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Getting fee…</>
                ) : (
                  <>Preview send <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></>
                )}
              </button>
            </div>
          </>
        )}

        {/* ── Send preview / confirm ── */}
        {panelStep === 'send-preview' && sendQuote && (
          <>
            <div className="flex items-center gap-3 p-5 border-b border-slate-800">
              <button onClick={() => setPanelStep('send-form')} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <h2 className="text-white font-semibold">Send</h2>
            </div>

            <div className="flex-1 p-5 flex flex-col gap-5">
              {/* From → To */}
              <div className="flex flex-col items-center gap-1 py-4">
                <div className="flex items-center gap-3 w-full justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <img src="/stellar-logo-white.png" alt="XLM" className="w-5 h-5 opacity-80" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Stellar (XLM)</p>
                      <p className="text-slate-500 text-xs">{sendAmount} XLM</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${sendUsd}</p>
                  </div>
                </div>

                <svg className="w-5 h-5 text-slate-600 my-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>

                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </div>
                  <p className="text-white font-mono text-sm">{truncate(sendTo)}</p>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-3 border-t border-slate-800 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Wallet used</span>
                  <span className="text-white font-mono">{truncate(wallet.walletAddress)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Orbi fee</span>
                  <span className="text-white">{sendQuote.feeXlm} XLM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Network</span>
                  <span className="text-white">Stellar Testnet</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex gap-3">
              <button onClick={() => setPanelStep('send-form')} className="flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirm} className="flex-1 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold transition-colors">
                Confirm
              </button>
            </div>
          </>
        )}

        {/* ── Receive ── */}
        {panelStep === 'receive' && (
          <>
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <button onClick={() => setPanelOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
                <button onClick={() => { setPanelTab('send'); setPanelStep('send-form'); }} className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors">Send</button>
                <button className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-900">Receive</button>
              </div>
              <div className="w-5" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
              <p className="text-slate-400 text-sm text-center">Share your wallet address to receive XLM or tokens.</p>
              <div className="w-full p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-slate-500 text-xs mb-1">Your wallet address</p>
                <p className="text-white font-mono text-xs break-all">{wallet.walletAddress}</p>
              </div>
              <button onClick={copyAddress} className="w-full py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold transition-colors">
                {copied ? '✓ Copied!' : 'Copy address'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile bottom Send/Receive buttons */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 flex gap-3 px-4 pb-2 z-30">
        <button onClick={() => openPanel('send')} className="flex-1 py-3 rounded-2xl bg-white text-slate-900 font-semibold text-sm">Send</button>
        <button onClick={() => openPanel('receive')} className="flex-1 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-semibold text-sm">Receive</button>
      </div>
    </div>
  );
}
