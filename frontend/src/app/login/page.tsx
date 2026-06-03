"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { LogoMark } from "@/components/Logo";
import { Spinner } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/best-bets");
    } catch (err) {
      setError(err instanceof ApiError ? "Invalid email or password." : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <LogoMark size={44} />
        <h1 className="mt-4 text-2xl font-extrabold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">Log in to save picks and size stakes to your bankroll.</p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4">
        {error && <div className="rounded-xl bg-neg/15 p-3 text-sm text-neg">{error}</div>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <input id="pw" type="password" className="input" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <><Spinner /> Logging in…</> : "Log in"}
        </button>
        <p className="text-center text-sm text-slate-400">
          No account? <Link href="/register" className="font-semibold text-brand-300">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
