"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import SportSelector from "@/components/SportSelector";
import { DemoBadge, Empty, ErrorState, LiveBadge, Loading, SectionHeading } from "@/components/ui";

interface ScoreEntry {
  name: string;
  score: string;
}
interface ScoreGame {
  id: string;
  sport_title: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: ScoreEntry[] | null;
}
interface ScoresResponse {
  sport: string;
  demo: boolean;
  count: number;
  scores: ScoreGame[];
}

export default function ScoresPage() {
  const [sport, setSport] = useState("basketball_nba");
  const { data, loading, error } = useApi<ScoresResponse>(`/scores/?sport=${sport}`, [sport]);

  return (
    <div>
      <SectionHeading
        eyebrow="Results"
        title="Scores"
        subtitle="Recent and live results."
        right={
          <>
            <SportSelector value={sport} onChange={setSport} />
            {data && (data.demo ? <DemoBadge demo /> : <LiveBadge live />)}
          </>
        }
      />

      {loading && <Loading />}
      {error && <ErrorState message={error} />}
      {data && data.scores.length === 0 && <Empty label="No scores available for this sport." />}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.scores.map((g) => {
          const lookup = Object.fromEntries((g.scores ?? []).map((s) => [s.name, s.score]));
          return (
            <div key={g.id} className="card card-hover">
              <div className="mb-3 flex items-center justify-between">
                <span className="chip">{g.sport_title}</span>
                <span className={`badge ${g.completed ? "bg-white/[0.06] text-slate-400" : "bg-neg/15 text-neg"}`}>
                  {g.completed ? "Final" : <><span className="h-1.5 w-1.5 rounded-full bg-neg animate-glow-pulse" /> Live</>}
                </span>
              </div>
              {[g.away_team, g.home_team].map((team) => {
                const score = lookup[team] ?? "—";
                const opp = team === g.home_team ? g.away_team : g.home_team;
                const win = score !== "—" && parseInt(score) > parseInt(lookup[opp] ?? "0");
                return (
                  <div key={team} className="flex items-center justify-between py-1.5">
                    <span className={win ? "font-bold text-white" : "text-slate-300"}>{team}</span>
                    <span className={`text-lg font-extrabold ${win ? "gradient-text" : "text-slate-400"}`}>{score}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
