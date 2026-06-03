"use client";

import { useState } from "react";
import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import SportSelector from "@/components/SportSelector";
import { Icon } from "@/components/icons";
import { DemoBadge, EdgePill, LiveBadge, Loading, SectionHeading, StatTile, fmtOdds } from "@/components/ui";
import type { BestBetsResponse } from "@/lib/types";

export default function DashboardPage() {
  const [sport, setSport] = useState("basketball_nba");
  const { user } = useAuth();
  const { data, loading } = useApi<BestBetsResponse>(`/best-bets/?sport=${sport}`, [sport]);
  const top = data?.best_bets.slice(0, 5) ?? [];

  return (
    <div>
      <SectionHeading
        eyebrow={user ? `Welcome back, ${user.first_name || "bettor"}` : "Command center"}
        title="Dashboard"
        subtitle="Your edges, model output, and bankroll at a glance."
        right={
          <>
            <SportSelector value={sport} onChange={setSport} />
            {data && (data.demo ? <DemoBadge demo /> : <LiveBadge live />)}
          </>
        }
      />

      {/* Stat row */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Top edge" value={top[0] ? `+${parseFloat(top[0].edge_pct).toFixed(1)}%` : "—"} />
        <StatTile label="Picks today" value={data?.count ?? "—"} />
        <StatTile label="Bankroll" value={`$${data?.bankroll ?? "1000"}`} sub={user ? "from profile" : "default"} />
        <StatTile label="Kelly" value={`${data ? (parseFloat(data.kelly_fraction) * 100).toFixed(0) : "50"}%`} sub="half-Kelly" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's best bets */}
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Today&apos;s Best Bets</h2>
            <Link href="/best-bets" className="text-sm font-semibold text-brand-300">View all →</Link>
          </div>
          {loading && <Loading />}
          {!loading && top.length === 0 && <p className="text-sm text-slate-400">No +EV bets right now.</p>}
          <div className="divide-y divide-white/[0.06]">
            {top.map((b, i) => (
              <div key={`${b.external_id}-${b.market}-${i}`} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{b.selection}</span>
                    <EdgePill value={b.edge_pct} />
                  </div>
                  <div className="truncate text-xs text-slate-500">{b.away_team} @ {b.home_team} · {b.bookmaker}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{fmtOdds(b.american_odds)}</div>
                  <div className="text-xs text-slate-500">EV ${b.expected_value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <Link href="/oddsbot" className="card card-hover block">
            <div className="flex items-center gap-2 text-brand-300"><Icon name="spark" size={18} /><span className="font-bold">Ask OddsBot</span></div>
            <p className="mt-2 text-sm text-slate-400">&ldquo;What&apos;s the best edge today?&rdquo; — get AI insight on your picks.</p>
          </Link>

          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold text-white">Bankroll</h3>
              <Link href="/bankroll" className="text-xs font-semibold text-brand-300">Manage →</Link>
            </div>
            <div className="text-2xl font-extrabold gradient-text font-display">${data?.bankroll ?? "1,000"}</div>
            <div className="mt-1 text-xs text-slate-500">Half-Kelly staking · ROI tracking coming soon</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Market movers</h3>
              <span className="chip">Pro · soon</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">Biggest line moves across books. Coming with line-history data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
