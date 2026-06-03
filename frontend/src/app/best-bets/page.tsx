"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import SportSelector from "@/components/SportSelector";
import {
  DemoBadge, EdgePill, Empty, ErrorState, LiveBadge, Loading, ProbBar,
  SectionHeading, Stat, StatTile, fmtOdds,
} from "@/components/ui";
import type { BestBet, BestBetsResponse } from "@/lib/types";

export default function BestBetsPage() {
  const [sport, setSport] = useState("basketball_nba");
  const { user } = useAuth();
  const { data, loading, error } = useApi<BestBetsResponse>(`/best-bets/?sport=${sport}`, [sport]);
  const [saved, setSaved] = useState<Record<string, "saving" | "saved" | "error">>({});

  async function save(b: BestBet) {
    const key = `${b.external_id}-${b.market}-${b.selection}`;
    setSaved((s) => ({ ...s, [key]: "saving" }));
    try {
      await api.post("/saved-bets/", {
        external_id: b.external_id, sport_key: b.sport_key, home_team: b.home_team,
        away_team: b.away_team, commence_time: b.commence_time, market: b.market,
        selection: b.selection, bookmaker: b.bookmaker, american_odds: b.american_odds,
        model_probability: b.model_probability, edge_pct: b.edge_pct, expected_value: b.expected_value,
      });
      setSaved((s) => ({ ...s, [key]: "saved" }));
    } catch {
      setSaved((s) => ({ ...s, [key]: "error" }));
    }
  }

  const topEdge = data?.best_bets[0]?.edge_pct;

  return (
    <div>
      <SectionHeading
        eyebrow="Today's edges"
        title="Best Bets"
        subtitle="Ranked by model edge. Stakes use the Kelly criterion."
        right={
          <>
            <SportSelector value={sport} onChange={setSport} />
            {data && (data.demo ? <DemoBadge demo /> : <LiveBadge live />)}
          </>
        }
      />

      {data && data.best_bets.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Top edge" value={topEdge ? `+${parseFloat(topEdge).toFixed(1)}%` : "—"} />
          <StatTile label="Picks today" value={data.count} />
          <StatTile label="Your bankroll" value={`$${data.bankroll}`} sub={user ? "from your profile" : "default · log in to set"} />
          <StatTile label="Kelly" value={`${(parseFloat(data.kelly_fraction) * 100).toFixed(0)}%`} sub="fractional (variance control)" />
        </div>
      )}

      {loading && <Loading />}
      {error && <ErrorState message={error} />}
      {data && data.best_bets.length === 0 && <Empty label="No +EV bets right now. Try another sport or check back later." />}

      <div className="grid gap-3">
        {data?.best_bets.map((b, i) => {
          const key = `${b.external_id}-${b.market}-${b.selection}`;
          const st = saved[key];
          return (
            <div key={`${key}-${i}`} className="card card-hover">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-sm font-bold text-slate-400">
                    #{i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-white">{b.selection}</span>
                      <EdgePill value={b.edge_pct} />
                      <span className="chip">{b.market}</span>
                    </div>
                    <div className="mt-0.5 text-sm text-slate-400">
                      {b.away_team} @ {b.home_team} · {b.bookmaker}
                    </div>
                    <div className="mt-3 max-w-xs">
                      <ProbBar value={b.model_probability} />
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-5">
                  <div className="grid grid-cols-3 gap-x-5 gap-y-1">
                    <Stat label="Odds" value={fmtOdds(b.american_odds)} />
                    <Stat label="EV / $100" value={<span className="text-pos">${b.expected_value}</span>} />
                    <Stat label="Stake" value={b.recommended_stake ? `$${b.recommended_stake}` : "—"} />
                  </div>
                  {user && (
                    <button
                      onClick={() => save(b)}
                      disabled={st === "saving" || st === "saved"}
                      className={st === "saved" ? "btn-soft text-sm" : "btn-ghost text-sm"}
                    >
                      {st === "saved" ? "✓ Saved" : st === "saving" ? "Saving…" : st === "error" ? "Retry" : "★ Save"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data && <p className="mt-6 text-xs text-slate-500">{data.disclaimer}</p>}
    </div>
  );
}
