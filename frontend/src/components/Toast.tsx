"use client";

// Minimal toast system (context + auto-dismiss), zero dependencies.

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

type Tone = "success" | "error";

interface Toast {
  id: number;
  msg: string;
  tone: Tone;
}

interface ToastState {
  push: (msg: string, tone?: Tone) => void;
}

const ToastCtx = createContext<ToastState | undefined>(undefined);

export function useToast(): ToastState {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((msg: string, tone: Tone = "success") => {
    const id = ++nextId.current;
    setToasts((ts) => [...ts, { id, msg, tone }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`glass animate-fade-up flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
              t.tone === "error" ? "text-neg" : "text-brand-300"
            }`}
          >
            <Icon name={t.tone === "error" ? "alert" : "check"} size={16} className="shrink-0" />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
