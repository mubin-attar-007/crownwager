"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/icons";
import { Spinner } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/password-reset/", { email });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <LogoMark size={44} />
        <h1 className="mt-4 text-2xl font-extrabold text-white">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-400">We&apos;ll email you a link to set a new one.</p>
      </div>
      {done ? (
        <div className="card space-y-4 text-center">
          <p className="text-sm text-slate-200">
            If an account exists for <span className="font-semibold">{email}</span>, a reset link is
            on its way. Check your inbox (and spam).
          </p>
          <Link href="/login" className="btn-ghost inline-block">
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card space-y-4">
          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-xl bg-neg/15 p-3 text-sm text-neg">
              <Icon name="alert" size={16} className="shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? (
              <>
                <Spinner /> Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </button>
          <p className="text-center text-sm text-slate-400">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-brand-300">
              Log in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
