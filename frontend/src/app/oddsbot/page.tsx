"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { LogoMark } from "@/components/Logo";
import { EdgePill, SectionHeading, Spinner } from "@/components/ui";
import type { BestBetsResponse, ChatResponse } from "@/lib/types";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "What's the best edge today?",
  "Explain the top prediction",
  "What's the Kelly stake for the top pick?",
  "Which games have the biggest edges?",
];

export default function CrownBotPage() {
  const { data } = useApi<BestBetsResponse>("/best-bets/?sport=basketball_nba");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm CrownBot. I can explain today's edges, predictions, and staking. Ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [poweredBy, setPoweredBy] = useState<string>("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history = msgs.filter((m) => m.content);
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await api.post<ChatResponse>("/assistant/chat/", { message: q, history, sport: "basketball_nba" });
      setPoweredBy(res.powered_by);
      setMsgs((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: e instanceof ApiError ? e.message : "Sorry, I had trouble responding." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SectionHeading eyebrow="AI insights" title="CrownBot" subtitle="Ask about today's edges, predictions, and staking — grounded in live data." />
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Context: today's top edges */}
        <div className="card lg:col-span-1">
          <h3 className="mb-3 text-sm font-bold text-white">Today&apos;s top edges</h3>
          <div className="space-y-2">
            {(data?.best_bets ?? []).slice(0, 6).map((b, i) => (
              <button
                key={`${b.external_id}-${i}`}
                onClick={() => ask(`Explain the edge on ${b.selection} (${b.market})`)}
                className="flex w-full items-center justify-between rounded-lg border border-white/[0.06] bg-ink-900/50 px-3 py-2 text-left hover:border-brand-500/30"
              >
                <span className="truncate text-sm text-slate-200">{b.selection}</span>
                <EdgePill value={b.edge_pct} />
              </button>
            ))}
            {!data && <p className="text-sm text-slate-500">Loading…</p>}
          </div>
        </div>

        {/* Chat */}
        <div className="card flex h-[34rem] flex-col lg:col-span-2">
          <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <LogoMark size={22} />
            <span className="font-bold text-white">CrownBot</span>
            {poweredBy && <span className="chip ml-auto">{poweredBy}</span>}
            <span className="chip">informational</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-brand-gradient text-ink-950" : "border border-white/[0.06] bg-white/[0.03] text-slate-200"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-xs text-slate-400"><Spinner /> CrownBot is thinking…</div>}
            <div ref={endRef} />
          </div>

          {msgs.length <= 1 && (
            <div className="mb-2 mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)} className="chip hover:border-brand-500/40 hover:text-brand-300">{s}</button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); void ask(input); }} className="mt-2 flex gap-2 border-t border-white/[0.06] pt-3">
            <input className="input" placeholder="Ask CrownBot…" value={input} onChange={(e) => setInput(e.target.value)} aria-label="Message CrownBot" />
            <button className="btn-primary" disabled={busy}>Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
