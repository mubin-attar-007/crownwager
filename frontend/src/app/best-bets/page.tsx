"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import SportSelector from "@/components/SportSelector";
import {
  DemoBadge, EdgePill, Empty, ErrorState, GradeBadge, InfoTip, LiveBadge, Loading,
  ProbBar, SectionHeading, Stat, StatTile, fmtOdds,
} from "@/components/ui";
import { americanFromProb, gradeFromConfidence, impliedProbFromAmerican } from "@/lib/edge";
import { pct } from "@/lib/format";
import type { BestBet, BestBetsResponse } from "@/lib/types";

type SortKey = "edge" | "ev" | "stake" | "time";

export default function BestBetsPage() {
  const [sport, setSport] = useState("basketball_nba");
  const { user } = useAuth();
  const { data, loading, error } = useApi<BestBetsResponse>(`/best-bets/?sport=${sport}`, [sport]);
  const [saved, setSaved] = useState<Record<string, "saving" | "saved" | "error">>({});

  const [sortKey, setSortKey] = useState<SortKey>("edge");
  const [minEdge, setMinEdge] = useState(0);
  const [market, setMarket] = useState("all");

  const markets = useMemo(
    () => Array.from(new Set((data?.best_bets ?? []).map((b) => b.market))),
    [data],
  );

  const bets = useMemo(() => {
    let list = data?.best_bets ?? [];
    if (market !== "all") list = list.filter((b) => b.market === market);
    if (minEdge > 0) list = list.filter((b) => parseFloat(b.edge_pct) >= minEdge);
    return [...list].sort((a, b) => {
      if (sortKey === "edge") return parseFloat(b.edge_pct) - parseFloat(a.edge_pct);
      if (sortKey === "ev") return parseFloat(b.expected_value) - parseFloat(a.expected_value);
      if (sortKey === "stake")
        return parseFloat(b.recommended_stake ?? "0") - parseFloat(a.recommended_stake ?? "0");
      return (a.commence_time ?? "").localeCompare(b.commence_time ?? "");
    });
  }, [data, market, minEdge, sortKey]);

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
  const selectCls =
    "rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";

  return (
    <div>
      <SectionHeading
        eyebrow="Today's edges"
        title="Best Bets"
        subtitle="Ranked by model edge vs. the market's fair price. Stakes use the Kelly criterion."
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

      {data && data.best_bets.length > 0 && (
        <div className="card mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-slate-400">Min edge</span>
            <input
              type="range" min={0} max={10} step={0.5} value={minEdge}
              onChange={(e) => setMinEdge(parseFloat(e.target.value))}
              className="accent-brand-500"
              aria-label="Minimum edge percent"
            />
            <span className="w-10 font-semibold text-white">{minEdge}%</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-slate-400">Sort</span>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={selectCls}>
              <option value="edge">Edge</option>
              <option value="ev">EV / $100</option>
              <option value="stake">Stake</option>
              <option value="time">Tip-off</option>
            </select>
          </label>
          {markets.length > 1 && (
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-slate-400">Market</span>
              <select value={market} onChange={(e) => setMarket(e.target.value)} className={selectCls}>
                <option value="all">All</option>
                {markets.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
          )}
          <span className="ml-auto text-xs text-slate-500">
            {bets.length} of {data.best_bets.length} shown
          </span>
        </div>
      )}

      {loading && <Loading />}
      {error && <ErrorState message={error} />}
      {data && data.best_bets.length === 0 && (
        <Empty label="No +EV bets right now. Try another sport or check back later." />
      )}
      {data && data.best_bets.length > 0 && bets.length === 0 && (
        <Empty label="No bets match your filters. Lower the minimum edge or clear the market filter." />
      )}

      <div className="grid gap-3">
        {bets.map((b, i) => {
          const key = `${b.external_id}-${b.market}-${b.selection}`;
          const st = saved[key];
          const modelP = parseFloat(b.model_probability);
          const fair = americanFromProb(modelP);
          const bookImplied = impliedProbFromAmerican(b.american_odds);
          const grade = gradeFromConfidence(parseFloat(b.confidence));
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
                      <GradeBadge grade={grade} />
                      <span className="chip">{b.market}</span>
                    </div>
                    <div className="mt-0.5 text-sm text-slate-400">
                      {b.away_team} @ {b.home_team} · {b.bookmaker}
                    </div>
                    <div className="mt-3 max-w-xs">
                      <ProbBar value={b.model_probability} />
                    </div>
                    {/* Credibility triplet: model prob -> fair odds vs. the book's price. */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>
                        Model <span className="font-semibold text-white">{pct(modelP)}</span>
                      </span>
                      <span>
                        Fair <span className="font-semibold text-white">{fmtOdds(fair)}</span>
                      </span>
                      <span>
                        Book <span className="font-semibold text-white">{fmtOdds(b.american_odds)}</span>{" "}
                        · {pct(bookImplied)} implied
                      </span>
                      <InfoTip>
                        Model win probability <b className="text-slate-100">{pct(modelP)}</b> implies fair odds{" "}
                        <b className="text-slate-100">{fmtOdds(fair)}</b>. {b.bookmaker} offers{" "}
                        <b className="text-slate-100">{fmtOdds(b.american_odds)}</b> ({pct(bookImplied)} implied) —
                        that gap is the edge. Based on a validated XGBoost model. Informational only.
                      </InfoTip>
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
