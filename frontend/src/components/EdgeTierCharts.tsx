"use client";

import type { EdgeTierRecord } from "@/lib/types";

/**
 * Data-viz for the Model Record "by edge tier" breakdown. Two hand-rolled SVGs
 * (same house style as the bankroll P/L sparkline, zero deps):
 *   1. Calibration line — win rate across edge tiers. The whole thesis ("bigger
 *      modeled edge should win more often") is a rising line here, or it isn't.
 *   2. Units bars — realized units P&L per tier, green/red from a zero baseline.
 * The exact W-L-P table still lives below for precise numbers.
 */

const POS = "#34d399";
const NEG = "#fb7185";
const WARN = "#fbbf24";

function CalibrationChart({ pts }: { pts: { label: string; wr: number }[] }) {
  const W = 320,
    H = 156,
    padL = 30,
    padR = 12,
    padT = 16,
    padB = 26;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const vals = pts.map((p) => p.wr);
  const lo = Math.max(0, Math.floor((Math.min(...vals) - 6) / 5) * 5);
  const hi = Math.min(100, Math.ceil((Math.max(...vals) + 6) / 5) * 5);
  const range = hi - lo || 1;
  const x = (i: number) => padL + (pts.length === 1 ? iw / 2 : (i / (pts.length - 1)) * iw);
  const y = (v: number) => padT + ih - ((v - lo) / range) * ih;
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.wr).toFixed(1)}`).join(" ");
  const show50 = lo <= 50 && hi >= 50;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Win rate by edge tier">
      {[hi, (lo + hi) / 2, lo].map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="#ffffff10" />
          <text x={padL - 5} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize="8" fill="#64748b">
            {v.toFixed(0)}%
          </text>
        </g>
      ))}
      {show50 && (
        <line x1={padL} y1={y(50)} x2={W - padR} y2={y(50)} stroke={WARN} strokeOpacity="0.45" strokeDasharray="3 3" />
      )}
      <path d={`${line} L${x(pts.length - 1)} ${padT + ih} L${x(0)} ${padT + ih} Z`} fill={POS} fillOpacity="0.1" />
      <path d={line} fill="none" stroke={POS} strokeWidth="2" />
      {pts.map((p, i) => (
        <g key={p.label}>
          <circle cx={x(i)} cy={y(p.wr)} r="3" fill={POS} />
          <text x={x(i)} y={y(p.wr) - 7} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#e2e8f0">
            {p.wr.toFixed(0)}%
          </text>
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="8" fill="#64748b">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function UnitsChart({ tiers }: { tiers: { label: string; units: number }[] }) {
  const W = 320,
    H = 156,
    padL = 30,
    padR = 12,
    padT = 16,
    padB = 26;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const maxAbs = Math.max(1, ...tiers.map((t) => Math.abs(t.units)));
  const lo = -maxAbs;
  const hi = maxAbs;
  const y = (v: number) => padT + ih - ((v - lo) / (hi - lo)) * ih;
  const zeroY = y(0);
  const bw = iw / tiers.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Units profit by edge tier">
      {[hi, 0, lo].map((v, i) => (
        <g key={i}>
          <line
            x1={padL}
            y1={y(v)}
            x2={W - padR}
            y2={y(v)}
            stroke={v === 0 ? "#ffffff26" : "#ffffff10"}
            strokeDasharray={v === 0 ? undefined : "3 3"}
          />
          <text x={padL - 5} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize="8" fill="#64748b">
            {v > 0 ? "+" : ""}
            {v.toFixed(0)}
          </text>
        </g>
      ))}
      {tiers.map((t, i) => {
        const pos = t.units >= 0;
        const top = pos ? y(t.units) : zeroY;
        const h = Math.max(1, Math.abs(y(t.units) - zeroY));
        const x = padL + i * bw + bw * 0.2;
        const w = bw * 0.6;
        return (
          <g key={t.label}>
            <rect x={x} y={top} width={w} height={h} rx="2" fill={pos ? POS : NEG} />
            <text
              x={x + w / 2}
              y={pos ? top - 4 : top + h + 9}
              textAnchor="middle"
              fontSize="8.5"
              fontWeight="600"
              fill={pos ? "#6ee7b7" : "#fda4af"}
            >
              {pos ? "+" : ""}
              {t.units.toFixed(1)}
            </text>
            <text x={padL + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="8" fill="#64748b">
              {t.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function EdgeTierCharts({ tiers }: { tiers: EdgeTierRecord[] }) {
  const withData = tiers.filter((t) => t.n > 0);
  const calibPts = withData
    .filter((t) => t.wins + t.losses > 0)
    .map((t) => ({ label: t.label, wr: parseFloat(t.win_rate_pct) }));
  const unitPts = withData.map((t) => ({ label: t.label, units: parseFloat(t.units_profit) }));

  if (unitPts.length === 0) return null;

  return (
    <div className="card mb-4 p-5">
      <h2 className="font-bold text-white">Does a bigger edge actually win more?</h2>
      <p className="text-xs text-slate-400">
        Win rate should climb with the modeled edge, and units should follow. This is that check — drawn from the
        settled record, not a backtest.
      </p>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Win rate by edge</span>
            <span className="text-[10px] text-slate-400">
              <span className="text-amber-300/80">┈</span> 50% reference
            </span>
          </div>
          {calibPts.length >= 2 ? (
            <CalibrationChart pts={calibPts} />
          ) : (
            <div className="grid h-[156px] place-items-center text-center text-xs text-slate-400">
              Needs decided picks in 2+ edge tiers to plot the calibration line.
            </div>
          )}
        </div>
        <div>
          <div className="mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Units P&amp;L by edge</span>
          </div>
          <UnitsChart tiers={unitPts} />
        </div>
      </div>
    </div>
  );
}
