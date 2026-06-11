"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import SportSelector from "@/components/SportSelector";
import { DemoBadge, Empty, ErrorState, LiveBadge, Loading, SectionHeading } from "@/components/ui";
import { toMatrix } from "@/lib/odds";
import type { OddsResponse } from "@/lib/types";

export default function OddsPage() {
  const [sport, setSport] = useState("basketball_nba");
  const { data, loading, error } = useApi<OddsResponse>(`/odds/?sport=${sport}`, [sport]);

  return (
    <div>
      <SectionHeading
        eyebrow="Line shopping"
        title="Odds Intelligence"
        subtitle="Compare every sportsbook's price. The best line per team is highlighted."
        right={
          <>
            <SportSelector value={sport} onChange={setSport} />
            {data && (data.demo ? <DemoBadge demo /> : <LiveBadge live />)}
          </>
        }
      />

      {loading && <Loading />}
      {error && <ErrorState message={error} />}
      {data && data.events.length === 0 && <Empty label="No odds available for this sport right now." />}

      <div className="grid gap-4">
        {data?.events.map((ev) => {
          const { books, rows } = toMatrix(ev);
          return (
            <div key={ev.id} className="card overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                <span className="font-semibold text-white">{ev.away_team} @ {ev.home_team}</span>
                <span className="chip">{ev.sport_title}</span>
              </div>
              {/* Mobile: stacked per-team price chips */}
              <div className="space-y-4 p-4 sm:hidden">
                {rows.map((r) => (
                  <div key={r.team}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="font-medium text-white">{r.team}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="rounded bg-brand-500/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-brand-300">Best</span>
                        <span className="font-extrabold gradient-text">{r.best.toFixed(2)}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {books.map((b) => {
                        const p = r.prices[b];
                        const isBest = p === r.best;
                        return (
                          <div
                            key={b}
                            className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                              isBest
                                ? "border-brand-500/40 bg-brand-500/10 text-brand-300"
                                : "border-white/10 bg-white/[0.03] text-slate-300"
                            }`}
                          >
                            <span className="truncate text-slate-400">{b}</span>
                            <span className={isBest ? "font-bold" : "font-medium"}>
                              {p == null ? <span className="text-slate-600">—</span> : p.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop: full comparison table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-2 font-semibold">Team</th>
                      {books.map((b) => (
                        <th key={b} className="px-3 py-2 text-center font-semibold">{b}</th>
                      ))}
                      <th className="px-4 py-2 text-center font-semibold text-brand-300">Best</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.team} className="border-t border-white/[0.04]">
                        <td className="px-5 py-3 font-medium text-white">{r.team}</td>
                        {books.map((b) => {
                          const p = r.prices[b];
                          const isBest = p === r.best;
                          return (
                            <td key={b} className="px-3 py-3 text-center">
                              {p == null ? (
                                <span className="text-slate-600">—</span>
                              ) : (
                                <span className={isBest ? "rounded-md bg-brand-500/15 px-2 py-1 font-bold text-brand-300" : "text-slate-300"}>
                                  {p.toFixed(2)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center font-extrabold gradient-text">{r.best.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pro placeholder, line shopping power-user signal */}
      <div className="mt-4 card flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">Sharp money &amp; line movement</h3>
          <p className="text-sm text-slate-400">No-vig fair odds, steam moves, and public betting % — coming with a Pro data feed.</p>
        </div>
        <span className="chip">Pro · soon</span>
      </div>
    </div>
  );
}
