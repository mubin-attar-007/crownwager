import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

export { fmtOdds } from "@/lib/format";

export function DemoBadge({ demo }: { demo: boolean }) {
  if (!demo) return null;
  return (
    <span
      className="badge bg-warn/15 text-warn"
      title="Live odds are unavailable right now (no key configured or daily data limit reached) — showing sample data."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-warn animate-glow-pulse" />
      sample data
    </span>
  );
}

export function LiveBadge({ live }: { live: boolean }) {
  if (!live) return null;
  return (
    <span className="badge bg-brand-500/15 text-brand-300">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-glow-pulse" />
      live
    </span>
  );
}

export function EdgePill({ value }: { value: string | number }) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const tone = num > 0 ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg";
  return (
    <span className={`badge ${tone}`}>
      {num > 0 ? "▲" : "▼"} {num > 0 ? "+" : ""}
      {num.toFixed(2)}% edge
    </span>
  );
}

/** Horizontal probability bar (0..1) with gradient fill. */
export function ProbBar({ value, label }: { value: number | string; label?: string }) {
  const v = Math.max(0, Math.min(1, typeof value === "string" ? parseFloat(value) : value));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-400">{label ?? "Model win probability"}</span>
        <span className="font-semibold text-white">{(v * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-brand-gradient transition-all duration-500"
          style={{ width: `${v * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Compact edge meter: magnitude bar capped at ~15% for visual scale. */
export function EdgeMeter({ value }: { value: number | string }) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const pct = Math.max(0, Math.min(100, (Math.abs(num) / 15) * 100));
  const color = num >= 0 ? "bg-pos" : "bg-neg";
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Bucketed model-confidence grade. Green A/B (value), amber C, red D/F. */
export function GradeBadge({ grade }: { grade: "A" | "B" | "C" | "D" | "F" }) {
  const tone =
    grade === "A" || grade === "B"
      ? "bg-pos/15 text-pos"
      : grade === "C"
        ? "bg-warn/15 text-warn"
        : "bg-neg/15 text-neg";
  return (
    <span className={`badge ${tone}`} title="Model confidence grade">
      Grade {grade}
    </span>
  );
}

/** Hover/focus info popover — used to expose the edge math and model provenance. */
export function InfoTip({ children, label = "How this is computed" }: { children: ReactNode; label?: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        className="grid h-4 w-4 place-items-center rounded-full border border-white/20 text-[10px] font-semibold text-slate-400 transition-colors hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-900 p-3 text-left text-xs font-normal leading-relaxed text-slate-300 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-white font-display">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-[0.7rem] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </header>
  );
}

export function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid gap-3" aria-busy>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card">
          <div className="skeleton h-5 w-1/3" />
          <div className="mt-3 skeleton h-3 w-2/3" />
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="skeleton h-8" />
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="card flex items-center gap-3 border-neg/30">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neg/10 text-neg">
        <Icon name="alert" />
      </span>
      <p className="text-sm">
        <strong className="text-neg">Couldn&apos;t load data.</strong>{" "}
        <span className="text-slate-300">{message}</span>
      </p>
    </div>
  );
}

export function Empty({ label }: { label: string }) {
  return (
    <div className="card flex items-center gap-3 text-slate-400">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.04]">∅</span>
      {label}
    </div>
  );
}
