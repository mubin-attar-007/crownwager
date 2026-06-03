"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { EdgePill, Empty, Loading, fmtOdds } from "@/components/ui";
import type { Paginated, SavedBet } from "@/lib/types";

export default function SavedBets() {
  const [bets, setBets] = useState<SavedBet[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Paginated<SavedBet>>("/saved-bets/")
      .then((r) => setBets(r.results))
      .catch(() => setError("Couldn't load saved picks."));
  }, []);

  async function remove(id: number) {
    await api.del(`/saved-bets/${id}/`);
    setBets((b) => (b ? b.filter((x) => x.id !== id) : b));
  }

  if (error) return <Empty label={error} />;
  if (!bets) return <Loading label="Loading saved picks…" />;
  if (bets.length === 0) return <Empty label="No saved picks yet. Save one from the Best Bets page." />;

  return (
    <div className="grid gap-2">
      {bets.map((b) => (
        <div key={b.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-ink-900/50 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{b.selection}</span>
              <EdgePill value={b.edge_pct} />
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              {b.away_team} @ {b.home_team} · {b.market} · {fmtOdds(b.american_odds)} · {b.bookmaker}
            </div>
          </div>
          <button onClick={() => remove(b.id)} className="text-sm text-neg hover:underline" aria-label="Remove saved pick">
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
