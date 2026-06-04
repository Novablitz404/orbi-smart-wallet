'use client';

import { useState, useRef } from 'react';

const ITEMS = [
  {
    label: 'Orbi Portal',
    desc: 'API keys & gas tank',
    href: 'https://developers.orbiwallet.xyz',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Documentation',
    desc: 'SDK integration guide',
    href: 'https://developers.orbiwallet.xyz/docs',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'npm',
    desc: '@orbi-wallet/sdk',
    href: 'https://npmjs.com/package/@orbi-wallet/sdk',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M0 0v24h24V0H0zm19.2 19.2H4.8V4.8h14.4v14.4zm-2.4-2.4H12v-9.6h-2.4v9.6H7.2V7.2h9.6v9.6z" />
      </svg>
    ),
  },
];

export default function DevDropdown() {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpen(true);
  }

  function onLeave() {
    leaveTimer.current = setTimeout(() => setOpen(false), 100);
  }

  return (
    <div
      className="relative hidden md:block"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button className="flex items-center gap-1 text-slate-400 hover:text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/5 transition-colors">
        Developers
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-1.5 min-w-[210px] shadow-2xl shadow-black/50">
            {ITEMS.map(({ label, desc, href, icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <span className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0">
                  {icon}
                </span>
                <div>
                  <p className="text-sm text-white leading-none mb-0.5">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
