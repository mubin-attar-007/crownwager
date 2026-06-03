"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import SportSelector from "@/components/SportSelector";
import { DemoBadge, Empty, ErrorState, LiveBadge, Loading, ProbBar, SectionHeading } from "@/components/ui";
import type { PredictionsResponse } from "@/lib/types";

const MODEL_LABELS: Record<string, string> = {
  ensemble: "Ensemble",
  xgboost: "XGBoost",
  nn: "Neural Net",
};

export default function PredictionsPage() {
  const [sport, setSport] = useState("basketball_nba");
  const { data, loading, error } = useApi<PredictionsResponse>(`/predictions/?sport=${sport}`, [sport]);

  return (
    <div>
      <SectionHeading
        eyebrow="Model output"
        title="Predictions"
        subtitle="Win probabilities by model — neural net, XGBoost, and ensemble."
        right={
          <>
            <SportSelector value={sport} onChange={setSport} />
            {data && (data.demo ? <DemoBadge demo /> : <LiveBadge live />)}
          </>
        }
      />

      {loading && <Loading />}
      {error && <ErrorState message={error} />}
      {data && data.games.length === 0 && <Empty label="No predictions available for this sport." />}

      <div className="grid gap-4">
        {data?.games.map((g) => (
          <div key={g.external_id} className="card">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-bold text-white">
                {g.away_team} <span className="text-slate-600">@</span> {g.home_team}
              </div>
              {g.commence_time && (
                <span className="chip">{new Date(g.commence_time).toLocaleDateString()}</span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.models.map((m, i) => (
                <div
                  key={`${m.model_name}-${m.market}-${i}`}
                  className="rounded-xl border border-white/[0.06] bg-ink-900/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="badge bg-brand-500/10 text-brand-300">
                      {m.model_label || MODEL_LABELS[m.model_name] || m.model_name}
                    </span>
                    <span className="text-xs text-slate-500">{m.market}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">{m.pick}</div>
                  <div className="mt-3">
                    <ProbBar value={m.win_probability} label="Win probability" />
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
