export default function HeroBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none select-none">

      {/* Dot grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#30b27c" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Roaming orb 1 */}
      <div
        className="animate-glow-1 absolute w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(ellipse, rgba(48,178,124,0.45) 0%, rgba(48,178,124,0.12) 50%, transparent 70%)' }}
      />

      {/* Roaming orb 2 */}
      <div
        className="animate-glow-2 absolute w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(ellipse, rgba(28,140,95,0.38) 0%, transparent 70%)' }}
      />

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#020817] to-transparent" />

    </div>
  );
}
