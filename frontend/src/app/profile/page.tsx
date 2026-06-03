"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { Loading } from "@/components/ui";
import SavedBets from "@/components/SavedBets";

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [bankroll, setBankroll] = useState("1000.00");
  const [kelly, setKelly] = useState("0.50");
  const [favorite, setFavorite] = useState("basketball_nba");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) {
      setBankroll(user.profile.bankroll);
      setKelly(user.profile.kelly_fraction);
      setFavorite(user.profile.favorite_sport || "basketball_nba");
    }
  }, [user, loading, router]);

  if (loading || !user) return <Loading />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api.patch("/auth/me/", {
        profile: { bankroll, kelly_fraction: kelly, favorite_sport: favorite },
      });
      await refreshUser();
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-xl font-extrabold text-ink-950">
          {(user.first_name || user.username)[0]?.toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-white">{user.first_name} {user.last_name}</h1>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
      </div>
      <form onSubmit={save} className="card space-y-4">
        <p className="text-sm text-slate-300">
          These settings personalize the recommended stake on the Best Bets page (informational only).
        </p>
        <div>
          <label className="label">Bankroll ($)</label>
          <input className="input" value={bankroll} inputMode="decimal"
            onChange={(e) => setBankroll(e.target.value)} />
        </div>
        <div>
          <label className="label">Kelly fraction (0–1)</label>
          <input className="input" value={kelly} inputMode="decimal"
            onChange={(e) => setKelly(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">0.5 = half-Kelly (recommended to reduce variance).</p>
        </div>
        <div>
          <label className="label">Favorite sport</label>
          <select className="input" value={favorite} onChange={(e) => setFavorite(e.target.value)}>
            <option value="basketball_nba">NBA</option>
            <option value="americanfootball_nfl">NFL</option>
            <option value="baseball_mlb">MLB</option>
            <option value="icehockey_nhl">NHL</option>
          </select>
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
        {msg && <p className="text-center text-sm text-brand-300">{msg}</p>}
      </form>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Saved picks</h2>
        <SavedBets />
      </section>
    </div>
  );
}
