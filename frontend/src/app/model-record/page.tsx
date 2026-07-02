"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import SportSelector from "@/components/SportSelector";
import { Empty, ErrorState, Loading, SectionHeading, StatTile } from "@/components/ui";
import type { ModelRecord } from "@/lib/types";

function signedUnits(u: string): string {
  const n = parseFloat(u);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}u`;
}

function unitsClass(u: string): string {
  const n = parseFloat(u);
  return n > 0 ? "text-emerald-400" : n < 0 ? "text-rose-400" : "text-slate-400";
}

export default function ModelRecordPage() {
  const [sport, setSport] = useState("basketball_nba");
  const { data, loading, error } = useApi<ModelRecord>(`/model-record/?sport=${sport}`, [sport]);

  return (
    <div>
      <SectionHeading
        eyebrow="Accountability"
        title="Model Record"
        subtitle="Every published pick, graded against the final score. Real results — win rate by edge, units P&L, and sample size. No cherry-picking."
        right={<SportSelector value={sport} onChange={setSport} />}
      />

      {loading && <Loading />}
      {error && <ErrorState message={error} />}

      {data && data.settled_count === 0 && !loading && (
        <Empty
          label={
            data.pending_count > 0
              ? `No settled picks yet — ${data.pending_count} pending. Grades appear here automatically as games finish.`
              : "No settled picks yet. As published picks' games finish, they're graded against the final score and appear here."
          }
        />
      )}

      {data && data.settled_count > 0 && (
        <>
          {data.insufficient && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200/90">
              Small sample — {data.settled_count} settled pick{data.settled_count === 1 ? "" : "s"} (below{" "}
              {data.min_sample}). Read these as early signal, not proof.
            </div>
          )}

          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Record (W-L-P)" value={data.overall.record} sub={`${data.overall.n} settled`} />
            <StatTile
              label="Win rate"
              value={`${parseFloat(data.overall.win_rate_pct).toFixed(1)}%`}
              sub="decided picks"
            />
            <StatTile label="Units P&L" value={signedUnits(data.overall.units_profit)} sub="flat 1u / pick" />
            <StatTile label="ROI" value={`${parseFloat(data.overall.roi_pct).toFixed(1)}%`} sub="on units risked" />
          </div>

          <div className="card overflow-hidden p-0">
            <div className="border-b border-white/[0.06] px-5 py-3">
              <h2 className="font-bold text-white">By edge tier</h2>
              <p className="text-xs text-slate-400">
                Bigger modeled edges should win more often. This is where that holds up — or doesn&apos;t.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2 font-semibold">Edge</th>
                    <th className="px-3 py-2 text-center font-semibold">Picks</th>
                    <th className="px-3 py-2 text-center font-semibold">Record</th>
                    <th className="px-3 py-2 text-center font-semibold">Win %</th>
                    <th className="px-4 py-2 text-right font-semibold">Units</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_edge_tier.map((t) => {
                    const decided = t.wins + t.losses;
                    return (
                      <tr key={t.label} className="border-t border-white/[0.04]">
                        <td className="px-5 py-3 font-medium text-white">{t.label}</td>
                        <td className="px-3 py-3 text-center text-slate-300">{t.n}</td>
                        <td className="px-3 py-3 text-center text-slate-300">{t.n ? t.record : "—"}</td>
                        <td className="px-3 py-3 text-center text-slate-300">
                          {decided ? `${parseFloat(t.win_rate_pct).toFixed(1)}%` : "—"}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${t.n ? unitsClass(t.units_profit) : "text-slate-600"}`}>
                          {t.n ? signedUnits(t.units_profit) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {data.disclaimer}
            {data.last_settled_at && <> · Last graded {new Date(data.last_settled_at).toLocaleDateString()}</>}
          </p>
        </>
      )}
    </div>
  );
}
