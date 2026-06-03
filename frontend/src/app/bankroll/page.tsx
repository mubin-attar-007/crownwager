"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { Empty, Loading, SectionHeading, StatTile } from "@/components/ui";

// Decorative preview area-chart (roadmap visual until real bet-tracking exists).
function PreviewArea() {
  return (
    <svg viewBox="0 0 300 90" className="h-24 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="bk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34d399" stopOpacity="0.35" />
          <stop offset="1" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 70 C40 60 60 40 90 45 S150 20 180 30 240 10 300 18 L300 90 L0 90 Z" fill="url(#bk)" />
      <path d="M0 70 C40 60 60 40 90 45 S150 20 180 30 240 10 300 18" fill="none" stroke="#34d399" strokeWidth="2" />
    </svg>
  );
}

export default function BankrollPage() {
  const { user, loading, refreshUser } = useAuth();
  const [bankroll, setBankroll] = useState("1000.00");
  const [kelly, setKelly] = useState("0.50");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setBankroll(user.profile.bankroll);
      setKelly(user.profile.kelly_fraction);
    }
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api.patch("/auth/me/", { profile: { bankroll, kelly_fraction: kelly } });
      await refreshUser();
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <SectionHeading eyebrow="Money management" title="Bankroll" subtitle="Size stakes to your bankroll with the Kelly criterion." />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Bankroll" value={`$${user?.profile.bankroll ?? bankroll}`} />
        <StatTile label="Kelly fraction" value={`${(parseFloat(user?.profile.kelly_fraction ?? kelly) * 100).toFixed(0)}%`} sub="variance control" />
        <StatTile label="ROI" value="—" sub="Pro · soon" />
        <StatTile label="Win rate" value="—" sub="Pro · soon" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Settings */}
        <div className="card lg:col-span-1">
          <h3 className="mb-3 font-bold text-white">Settings</h3>
          {user ? (
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="label">Bankroll ($)</label>
                <input className="input" value={bankroll} inputMode="decimal" onChange={(e) => setBankroll(e.target.value)} />
              </div>
              <div>
                <label className="label">Kelly fraction (0–1)</label>
                <input className="input" value={kelly} inputMode="decimal" onChange={(e) => setKelly(e.target.value)} />
                <p className="mt-1 text-xs text-slate-500">0.5 = half-Kelly (recommended).</p>
              </div>
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
              {msg && <p className="text-center text-sm text-brand-300">{msg}</p>}
            </form>
          ) : (
            <div>
              <Empty label="Log in to set your bankroll and Kelly fraction." />
              <Link href="/login" className="btn-primary mt-3 inline-flex">Log in</Link>
            </div>
          )}
        </div>

        {/* Roadmap analytics */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold text-white">Cumulative P/L</h3>
              <span className="chip">Pro · preview</span>
            </div>
            <PreviewArea />
            <p className="mt-2 text-xs text-slate-500">Track every settled pick to unlock real ROI, P/L, drawdowns and CLV. Coming next.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card"><h3 className="font-bold text-white">Bankroll growth</h3><div className="mt-2"><PreviewArea /></div></div>
            <div className="card"><h3 className="font-bold text-white">CLV tracking</h3><div className="mt-2"><PreviewArea /></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
