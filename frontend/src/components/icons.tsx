// Lightweight inline SVG icon set (stroke style, dependency-free).
type IconProps = { className?: string; size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

const PATHS: Record<string, React.ReactNode> = {
  dashboard: (<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  target: (<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></>),
  brain: (<><path d="M12 5a3 3 0 0 0-6 0v.5A3 3 0 0 0 5 11a3 3 0 0 0 1 5.8V17a3 3 0 0 0 6 0" /><path d="M12 5a3 3 0 0 1 6 0v.5A3 3 0 0 1 19 11a3 3 0 0 1-1 5.8V17a3 3 0 0 1-6 0" /></>),
  table: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 14h18M9 4v16M15 4v16" /></>),
  swap: (<><path d="M7 7h11l-3-3M17 17H6l3 3" /></>),
  trophy: (<><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 21h6M12 13v8" /></>),
  spark: (<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /><circle cx="12" cy="12" r="2.5" /></>),
  bookmark: (<><path d="M6 4h12v16l-6-4-6 4V4Z" /></>),
  wallet: (<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" /></>),
  book: (<><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" /><path d="M18 6v14" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  bell: (<><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></>),
  menu: (<><path d="M4 6h16M4 12h16M4 18h16" /></>),
  chevron: (<><path d="m9 6 6 6-6 6" /></>),
  alert: (<><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4M12 17.5h.01" /></>),
  check: (<><path d="m5 13 4.5 4.5L19 7" /></>),
};

export function Icon({ name, className, size = 18 }: IconProps & { name: keyof typeof PATHS }) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

export type IconName = keyof typeof PATHS;
