'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    const frame = requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.25s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div ref={ref} className="flex flex-col flex-1 min-h-screen">
      {children}
    </div>
  );
}
