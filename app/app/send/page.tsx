'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SendPage() {
  const router = useRouter();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <main className="flex flex-col min-h-screen bg-[#020817] px-4">
      <div className="flex items-center gap-3 pt-6 pb-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
          ← Back
        </button>
        <h1 className="text-white font-semibold">Send</h1>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-slate-400 text-sm">To</label>
          <input
            type="text"
            placeholder="G... or C..."
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-slate-400 text-sm">Amount (XLM)</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-xl font-semibold"
          />
        </div>

        {/* Fee estimate */}
        <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-4 flex justify-between text-sm">
          <span className="text-slate-500">Network fee</span>
          <span className="text-slate-300">~0.001 XLM</span>
        </div>

        <button
          disabled={!to.trim() || !amount}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-40 mt-2"
        >
          Send with Face ID
        </button>
      </div>
    </main>
  );
}
