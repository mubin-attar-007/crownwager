export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="oa-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="#0b1120" stroke="url(#oa-grad)" strokeWidth="2" />
      {/* upward "edge" trend */}
      <path
        d="M10 26.5L17 19.5L21.5 24L30 13.5"
        stroke="url(#oa-grad)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="13.5" r="2.6" fill="url(#oa-grad)" />
    </svg>
  );
}

export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="text-lg font-extrabold tracking-tight font-display">
        <span className="gradient-text">Odds</span>
        <span className="text-white">Away</span>
      </span>
    </span>
  );
}
