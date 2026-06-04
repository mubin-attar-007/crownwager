"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { LogoMark } from "@/components/Logo";
import { Spinner } from "@/components/ui";
import type { ChatResponse } from "@/lib/types";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function CrownBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm CrownBot. Ask me about today's best bets or any betting concept." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const history = msgs.filter((m) => m.content);
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await api.post<ChatResponse>("/assistant/chat/", {
        message: text,
        history,
        sport: "basketball_nba",
      });
      setMsgs((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: e instanceof ApiError ? e.message : "Sorry, I had trouble responding." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open CrownBot assistant"
        className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-3 font-bold text-ink-950 shadow-glow transition hover:brightness-110"
      >
        {open ? "✕ Close" : <><LogoMark size={20} /> CrownBot</>}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[30rem] w-[23rem] max-w-[92vw] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-850/95 shadow-lift backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <LogoMark size={22} />
            <div className="text-sm font-bold text-white">CrownBot</div>
            <span className="ml-auto chip">informational</span>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-gradient text-ink-950"
                      : "border border-white/[0.06] bg-white/[0.03] text-slate-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Spinner /> CrownBot is thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex gap-2 border-t border-white/[0.06] p-2.5"
          >
            <input
              className="input"
              placeholder="Ask about today's edges…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Message CrownBot"
            />
            <button className="btn-primary" disabled={busy} aria-label="Send">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
