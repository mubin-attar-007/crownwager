"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { DemoBadge, Empty, LiveBadge, SectionHeading, Spinner, Stat } from "@/components/ui";
import type { ArbitrageResponse } from "@/lib/types";

export default function ArbitragePage() {
  const [betSize, setBetSize] = useState("100");
  const [data, setData] = useState<ArbitrageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function scan() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ArbitrageResponse>(
        `/arbitrage/?sport=basketball_nba&bet_size=${encodeURIComponent(betSize)}`,
      );
      setData(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Risk-free profit"
        title="Arbitrage Finder"
        subtitle="Opportunities where the best prices across books sum to under 100% — a guaranteed profit."
      />

      <div className="card mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="label" htmlFor="bet">Total stake ($)</label>
          <input
            id="bet" className="input w-40" value={betSize} inputMode="decimal"
            onChange={(e) => setBetSize(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={scan} disabled={loading}>
          {loading ? <><Spinner /> Scanning…</> : "Scan for arbitrage"}
        </button>
        {data && (data.demo ? <DemoBadge demo /> : <LiveBadge live />)}
      </div>

      {error && <div className="card border-neg/30 text-neg">{error}</div>}
      {data && data.opportunities.length === 0 && (
        <Empty label="No arbitrage found right now — try a different stake or sport." />
      )}

      <div className="grid gap-3">
        {data?.opportunities.map((o) => (
          <div key={o.event_id} className="card card-hover">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-lg font-bold text-white">{o.away_team} @ {o.home_team}</div>
              <div className="flex gap-6">
                <Stat label="Guaranteed profit" value={<span className="text-pos">${o.profit}</span>} />
                <Stat label="Return" value={<span className="gradient-text font-bold">{o.profit_pct}%</span>} />
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {o.legs.map((leg, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-ink-900/50 p-4">
                  <div className="font-semibold text-white">{leg.outcome}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{leg.bookmaker} · odds {leg.price}</div>
                  <div className="mt-2 text-sm text-slate-300">
                    Stake <span className="font-bold text-brand-300">${leg.stake}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
