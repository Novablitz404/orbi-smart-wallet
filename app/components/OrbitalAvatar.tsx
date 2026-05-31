/**
 * OrbitalAvatar — deterministic orbital ring avatar for Orbi wallets.
 * Generates a unique space-themed SVG from any string (wallet address, email, etc).
 * Three orbital rings + three planets + central star, all derived from the input.
 */

interface Props {
  seed: string;
  size?: number;
  className?: string;
}

function djb2(s: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function OrbitalAvatar({ seed, size = 40, className }: Props) {
  const h1 = djb2(seed, 5381);
  const h2 = djb2(seed, 31337);
  const h3 = djb2(seed, 99991);

  // Colors — 120° apart on HSL wheel for always-harmonious palette
  const hue = h1 % 360;
  const c1 = `hsl(${hue}, 80%, 65%)`;
  const c2 = `hsl(${(hue + 120) % 360}, 75%, 62%)`;
  const c3 = `hsl(${(hue + 240) % 360}, 70%, 60%)`;

  const cx = size / 2;
  const cy = size / 2;

  // Orbit radii
  const r1 = size * 0.17;
  const r2 = size * 0.29;
  const r3 = size * 0.40;

  // Planet angles (radians) — derived from hash
  const a1 = (h1 % 360) * (Math.PI / 180);
  const a2 = (h2 % 360) * (Math.PI / 180);
  const a3 = (h3 % 360) * (Math.PI / 180);

  // Orbit tilt — slight ellipse via y scale
  const tilt = 0.45;

  const id = `og-${seed.slice(0, 8)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#020817" />
        </radialGradient>
        <radialGradient id={`${id}-star`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        <filter id={`${id}-glow`}>
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <circle cx={cx} cy={cy} r={cx - 0.5} fill={`url(#${id}-bg)`} />

      {/* Orbit rings — slightly tilted ellipses */}
      <ellipse cx={cx} cy={cy} rx={r1} ry={r1 * tilt} fill="none" stroke={c1} strokeWidth="0.7" opacity="0.45" />
      <ellipse cx={cx} cy={cy} rx={r2} ry={r2 * tilt} fill="none" stroke={c2} strokeWidth="0.6" opacity="0.40" />
      <ellipse cx={cx} cy={cy} rx={r3} ry={r3 * tilt} fill="none" stroke={c3} strokeWidth="0.6" opacity="0.35" />

      {/* Planets on orbits */}
      <circle
        cx={cx + r1 * Math.cos(a1)}
        cy={cy + r1 * tilt * Math.sin(a1)}
        r={size * 0.048}
        fill={c1}
        filter={`url(#${id}-glow)`}
      />
      <circle
        cx={cx + r2 * Math.cos(a2)}
        cy={cy + r2 * tilt * Math.sin(a2)}
        r={size * 0.040}
        fill={c2}
        filter={`url(#${id}-glow)`}
      />
      <circle
        cx={cx + r3 * Math.cos(a3)}
        cy={cy + r3 * tilt * Math.sin(a3)}
        r={size * 0.032}
        fill={c3}
        filter={`url(#${id}-glow)`}
      />

      {/* Central star */}
      <circle cx={cx} cy={cy} r={size * 0.07} fill={`url(#${id}-star)`} filter={`url(#${id}-glow)`} />
    </svg>
  );
}
