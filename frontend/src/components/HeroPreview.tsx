// Static, decorative product mockup for the landing hero (server component, fake data).

import { EdgePill, LiveBadge, ProbBar, Stat } from "@/components/ui";

const SPARK_PATH = "M0 52 L43 44 L86 47 L129 33 L171 36 L214 22 L257 26 L300 8";

export default function HeroPreview() {
  return (
    <div className="relative" aria-hidden="true">
      {/* Decorative glow behind the card */}
      <div className="absolute -inset-8 rounded-3xl bg-brand-gradient opacity-15 blur-3xl" />
      <div className="card relative overflow-hidden p-0 lg:rotate-1">
        {/* Fake window header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <span className="flex items-center gap-3">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-neg/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warn/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-pos/60" />
            </span>
            <span className="text-xs font-semibold text-slate-400">Best Bets · NBA</span>
          </span>
          <LiveBadge live />
        </div>

        <div className="space-y-4 p-5">
          {/* Hero pick */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-bold text-white">Celtics ML</div>
              <div className="text-xs text-slate-500">Celtics @ Lakers · tonight</div>
            </div>
            <EdgePill value={6.2} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stat label="Odds" value="+148" />
            <Stat label="EV" value={<span className="text-pos">+$4.10</span>} />
            <Stat label="Stake" value="$23.50" />
          </div>

          <ProbBar value={0.64} />

          {/* Upward P/L sparkline */}
          <svg viewBox="0 0 300 60" className="h-14 w-full" preserveAspectRatio="none">
            <path d={`${SPARK_PATH} L300 60 L0 60 Z`} fill="#34d399" fillOpacity="0.12" />
            <path d={SPARK_PATH} fill="none" stroke="#34d399" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
