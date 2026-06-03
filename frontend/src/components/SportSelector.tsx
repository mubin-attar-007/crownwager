"use client";

import { SPORTS } from "@/lib/types";

export default function SportSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (sport: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-white/[0.08] bg-ink-850/70 p-1 backdrop-blur">
      {SPORTS.map((s) => {
        const active = value === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            aria-pressed={active}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
              active ? "bg-brand-gradient text-ink-950 shadow-glow" : "text-slate-400 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
