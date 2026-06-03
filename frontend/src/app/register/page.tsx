"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { LogoMark } from "@/components/Logo";
import { Spinner } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(form);
      router.push("/best-bets");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.data as { email?: string[]; password?: string[] })?.email?.[0] ||
            (err.data as { password?: string[] })?.password?.[0] ||
            err.message
          : "Something went wrong.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <LogoMark size={44} />
        <h1 className="mt-4 text-2xl font-extrabold text-white">Create your account</h1>
        <p className="mt-1 text-sm text-slate-400">Free — save picks and get bankroll-sized stakes.</p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4">
        {error && <div className="rounded-xl bg-neg/15 p-3 text-sm text-neg">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <input className="input" value={form.first_name} onChange={set("first_name")} required />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" value={form.last_name} onChange={set("last_name")} required />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={set("email")} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={form.password} onChange={set("password")}
            minLength={8} required />
          <p className="mt-1.5 text-xs text-slate-500">At least 8 characters.</p>
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <><Spinner /> Creating…</> : "Sign up"}
        </button>
        <p className="text-center text-sm text-slate-400">
          Already have an account? <Link href="/login" className="font-semibold text-brand-300">Log in</Link>
        </p>
      </form>
      <p className="mt-3 text-center text-xs text-slate-500">
        By signing up you confirm you are 18+ and agree this tool is informational only.
      </p>
    </div>
  );
}
