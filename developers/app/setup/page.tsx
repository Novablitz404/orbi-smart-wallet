'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../lib/session';
import { setDeployer } from '../../lib/api';

const ORBI_COSIGNER = 'GAQC2DZFSROS52IVXZSTA7RBYDAQDOTAKYTDPJPBLVWSRJO6ZETQKYIA';
const HORIZON_URL = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
  ? 'https://horizon.stellar.org'
  : 'https://horizon-testnet.stellar.org';

type Step = 'generate' | 'fund' | 'activate' | 'done';

interface Keypair {
  publicKey: string;
  secretKey: string;
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('generate');
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [secretKeySaved, setSecretKeySaved] = useState(false);
  const [keypairCopied, setKeypairCopied] = useState<'public' | 'secret' | null>(null);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    const { Keypair } = await import('@stellar/stellar-sdk');
    const kp = Keypair.random();
    setKeypair({ publicKey: kp.publicKey(), secretKey: kp.secret() });
    setStep('fund');
  }

  async function copy(text: string, which: 'public' | 'secret') {
    await navigator.clipboard.writeText(text);
    setKeypairCopied(which);
    setTimeout(() => setKeypairCopied(null), 2000);
  }

  async function handleActivate() {
    if (!keypair) return;
    const session = getSession();
    if (!session) { router.replace('/'); return; }

    setActivating(true);
    setError('');

    try {
      const { Keypair, TransactionBuilder, BASE_FEE, Networks, Operation } = await import('@stellar/stellar-sdk');
      const { Server } = await import('@stellar/stellar-sdk/rpc');

      const kp = Keypair.fromSecret(keypair.secretKey);

      // Load account from Horizon
      const resp = await fetch(`${HORIZON_URL}/accounts/${keypair.publicKey}`);
      if (!resp.ok) throw new Error('Account not found on Stellar — make sure you funded it first.');
      const accountData = await resp.json() as { sequence: string };

      const { Account } = await import('@stellar/stellar-sdk');
      const account = new Account(keypair.publicKey, accountData.sequence);

      const networkPassphrase = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
        ? Networks.PUBLIC
        : Networks.TESTNET;

      // Build SetOptions tx adding Orbi's key as co-signer (weight 1)
      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
        .addOperation(Operation.setOptions({
          signer: { ed25519PublicKey: ORBI_COSIGNER, weight: 1 },
        }))
        .setTimeout(300)
        .build();

      tx.sign(kp);

      // Submit to Horizon
      const submitResp = await fetch(`${HORIZON_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ tx: tx.toEnvelope().toXDR('base64') }),
      });
      if (!submitResp.ok) {
        const body = await submitResp.json().catch(() => ({})) as any;
        const detail = body?.extras?.result_codes?.transaction ?? JSON.stringify(body);
        throw new Error(`Stellar rejected the transaction: ${detail}`);
      }

      // Register deployer address with Orbi relay
      await setDeployer(session.sessionToken, keypair.publicKey);

      setStep('done');
    } catch (err: any) {
      setError(err.message ?? 'Activation failed');
    } finally {
      setActivating(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-10">
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Dashboard
          </Link>
          <p className="text-xs text-slate-500">
            Step {step === 'generate' ? 1 : step === 'fund' ? 2 : step === 'activate' ? 3 : 3} of 3
          </p>
        </div>

        {/* Step 1: Generate */}
        {step === 'generate' && (
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">Step 1 of 3</p>
            <h1 className="text-xl font-bold text-white mb-3">Generate deployer account</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              We&apos;ll generate a Stellar keypair in your browser. The secret key never leaves your device.
              This account acts as your gas tank — you fund it with XLM.
            </p>
            <button
              onClick={handleGenerate}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Generate keypair
            </button>
          </div>
        )}

        {/* Step 2: Save key + fund */}
        {step === 'fund' && keypair && (
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">Step 2 of 3</p>
            <h1 className="text-xl font-bold text-white mb-3">Save your keys &amp; fund</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Save your secret key — <strong className="text-white">it cannot be recovered if lost.</strong> Then send at least <strong className="text-white">5 XLM</strong> to the public address.
            </p>

            {/* Public key */}
            <div className="bg-[#020817] border border-[#334155] rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-500 font-medium">Public key (deployer address)</p>
                <button onClick={() => copy(keypair.publicKey, 'public')} className="text-xs text-slate-400 hover:text-white transition-colors">
                  {keypairCopied === 'public' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <code className="text-slate-300 text-xs break-all">{keypair.publicKey}</code>
            </div>

            {/* Secret key */}
            <div className="bg-[#020817] border border-amber-800/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-amber-500 font-medium">Secret key — save this now</p>
                <button onClick={() => copy(keypair.secretKey, 'secret')} className="text-xs text-slate-400 hover:text-white transition-colors">
                  {keypairCopied === 'secret' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <code className="text-amber-300 text-xs break-all">{keypair.secretKey}</code>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={secretKeySaved}
                onChange={e => setSecretKeySaved(e.target.checked)}
                className="mt-0.5 accent-blue-500"
              />
              <span className="text-slate-300 text-sm leading-relaxed">
                I have saved my secret key and funded the public address with XLM.
              </span>
            </label>

            <button
              onClick={() => setStep('activate')}
              disabled={!secretKeySaved}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Continue to activate
            </button>
          </div>
        )}

        {/* Step 3: Activate */}
        {step === 'activate' && keypair && (
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">Step 3 of 3</p>
            <h1 className="text-xl font-bold text-white mb-3">Activate gas sponsorship</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              We&apos;ll add Orbi&apos;s relay key as a co-signer on your account and register your address. Your secret key is used locally to sign — it is never sent to Orbi.
            </p>

            <div className="bg-[#020817] border border-[#334155] rounded-xl p-4 mb-6">
              <p className="text-xs text-slate-500 mb-1">Adding co-signer</p>
              <code className="text-slate-400 text-xs break-all">{ORBI_COSIGNER}</code>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-800 rounded-xl p-4 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={activating}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {activating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Activating...
                </span>
              ) : 'Activate'}
            </button>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Gas sponsorship active</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Your gas tank is set up. All <code className="text-slate-300">bundle()</code> calls using your API key will now have network fees sponsored automatically.
            </p>
            <Link
              href="/dashboard"
              className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Go to dashboard
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
