"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { Empty, Loading, SectionHeading, StatTile } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { fmtOdds } from "@/lib/format";
import type { BankrollStats, BetStatus, TrackedBet } from "@/lib/types";

function ProfitChart({ points }: { points: { at: string; cumulative_profit: string }[] }) {
  if (points.length < 2) {
    return <div className="grid h-28 place-items-center text-sm text-slate-500">Settle 2+ bets to see your P/L curve.</div>;
  }
  const ys = points.map((p) => parseFloat(p.cumulative_profit));
  const min = Math.min(0, ...ys);
  const max = Math.max(0, ...ys);
  const range = max - min || 1;
  const W = 300, H = 90;
  const coords = ys.map((y, i) => {
    const x = (i / (ys.length - 1)) * W;
    const yy = H - ((y - min) / range) * H;
    return [x, yy];
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = ys[ys.length - 1];
  const stroke = last >= 0 ? "#34d399" : "#fb7185";
  const zeroY = H - ((0 - min) / range) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full" preserveAspectRatio="none" aria-hidden>
      <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="#ffffff14" strokeDasharray="3 3" />
      <path d={`${path} L${W} ${H} L0 ${H} Z`} fill={stroke} fillOpacity="0.12" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

const EMPTY_FORM = { selection: "", market: "moneyline", american_odds: "", stake: "" };

export default function BankrollPage() {
  const { user, loading, refreshUser } = useAuth();
  const { push: toast } = useToast();
  const [bankroll, setBankroll] = useState("1000.00");
  const [kelly, setKelly] = useState("0.50");
  const [stats, setStats] = useState<BankrollStats | null>(null);
  const [bets, setBets] = useState<TrackedBet[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    if (!user) return;
    const [s, b] = await Promise.all([
      api.get<BankrollStats>("/bankroll/stats/"),
      api.get<{ results: TrackedBet[] }>("/tracked-bets/"),
    ]);
    setStats(s);
    setBets(b.results);
  }, [user]);

  useEffect(() => {
    if (user) {
      setBankroll(user.profile.bankroll);
      setKelly(user.profile.kelly_fraction);
      void load();
    }
  }, [user, load]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.patch("/auth/me/", { profile: { bankroll, kelly_fraction: kelly } });
      await refreshUser();
      toast("Settings saved");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not save.", "error");
    }
  }

  async function logBet(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/tracked-bets/", {
        selection: form.selection, market: form.market,
        american_odds: parseInt(form.american_odds, 10), stake: form.stake,
      });
      setForm(EMPTY_FORM);
      await load();
      toast("Bet logged");
    } catch {
      toast("Could not log bet — check the odds (e.g. -110) and stake.", "error");
    }
  }

  async function settle(id: number, status: BetStatus) {
    try {
      await api.patch(`/tracked-bets/${id}/`, { status });
      await load();
    } catch {
      toast("Could not settle the bet — try again.", "error");
    }
  }
  async function remove(id: number) {
    try {
      await api.del(`/tracked-bets/${id}/`);
      await load();
    } catch {
      toast("Could not remove the bet — try again.", "error");
    }
  }

  if (loading) return <Loading />;
  if (!user) {
    return (
      <div>
        <SectionHeading eyebrow="Money management" title="Bankroll" />
        <Empty label="Log in to track your bets, ROI and bankroll." />
        <Link href="/login?next=/bankroll" className="btn-primary mt-3 inline-flex">Log in</Link>
      </div>
    );
  }

  const profitNum = stats ? parseFloat(stats.total_profit) : 0;

  return (
    <div>
      <SectionHeading eyebrow="Money management" title="Bankroll" subtitle="Track every bet to get real ROI, P/L and win rate." />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="ROI" value={stats ? `${stats.roi_pct}%` : "—"} sub={`${stats?.settled_count ?? 0} settled`} />
        <StatTile label="Profit / Loss" value={<span className={profitNum >= 0 ? "text-pos" : "text-neg"}>${stats?.total_profit ?? "0.00"}</span>} />
        <StatTile label="Win rate" value={stats ? `${stats.win_rate_pct}%` : "—"} sub={stats ? `record ${stats.record}` : ""} />
        <StatTile label="Pending" value={stats?.pending_count ?? 0} sub={`$${stats?.pending_stake ?? "0.00"} at risk`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: settings + log bet */}
        <div className="space-y-4 lg:col-span-1">
          <form onSubmit={saveSettings} className="card space-y-3">
            <h3 className="font-bold text-white">Settings</h3>
            <div>
              <label className="label">Bankroll ($)</label>
              <input className="input" value={bankroll} inputMode="decimal" onChange={(e) => setBankroll(e.target.value)} />
            </div>
            <div>
              <label className="label">Kelly fraction</label>
              <input className="input" value={kelly} inputMode="decimal" onChange={(e) => setKelly(e.target.value)} />
            </div>
            <button className="btn-ghost w-full text-sm">Save settings</button>
          </form>

          <form onSubmit={logBet} className="card space-y-3">
            <h3 className="font-bold text-white">Log a bet</h3>
            <div>
              <label className="label" htmlFor="bet-selection">Selection</label>
              <input id="bet-selection" className="input" placeholder="e.g. Lakers ML" value={form.selection} onChange={(e) => setForm({ ...form, selection: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label" htmlFor="bet-odds">American odds</label>
                <input id="bet-odds" className="input" placeholder="e.g. -110" value={form.american_odds} onChange={(e) => setForm({ ...form, american_odds: e.target.value })} required />
              </div>
              <div>
                <label className="label" htmlFor="bet-stake">Stake ($)</label>
                <input id="bet-stake" className="input" placeholder="e.g. 25.00" value={form.stake} inputMode="decimal" onChange={(e) => setForm({ ...form, stake: e.target.value })} required />
              </div>
            </div>
            <button className="btn-primary w-full text-sm">Add bet</button>
          </form>
        </div>

        {/* Right: chart + history */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-bold text-white">Cumulative P/L</h3>
              <span className={`text-sm font-bold ${profitNum >= 0 ? "text-pos" : "text-neg"}`}>${stats?.total_profit ?? "0.00"}</span>
            </div>
            <ProfitChart points={stats?.growth ?? []} />
          </div>

          <div className="card">
            <h3 className="mb-3 font-bold text-white">Bet history</h3>
            {bets.length === 0 && <Empty label="No bets yet — log one on the left." />}
            <div className="divide-y divide-white/[0.06]">
              {bets.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-white">{b.selection} <span className="text-xs text-slate-500">{fmtOdds(b.american_odds)} · ${b.stake}</span></div>
                    <div className="text-xs text-slate-500">
                      {b.status === "pending" ? "pending" : `${b.status} · P/L $${b.profit}`}
                    </div>
                  </div>
                  {b.status === "pending" ? (
                    <div className="flex gap-1">
                      <button onClick={() => settle(b.id, "won")} className="chip hover:text-pos">Won</button>
                      <button onClick={() => settle(b.id, "lost")} className="chip hover:text-neg">Lost</button>
                      <button onClick={() => settle(b.id, "push")} className="chip">Push</button>
                    </div>
                  ) : (
                    <span className={`badge ${b.status === "won" ? "bg-pos/15 text-pos" : b.status === "lost" ? "bg-neg/15 text-neg" : "bg-white/[0.06] text-slate-400"}`}>{b.status}</span>
                  )}
                  <button onClick={() => remove(b.id)} className="text-xs text-slate-500 hover:text-neg">remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
