"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/icons";
import { Spinner } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/best-bets";
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("You must confirm you are 18+ and agree to the Terms & Privacy Policy.");
      return;
    }
    if (form.password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(form);
      router.push(dest);
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
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl bg-neg/15 p-3 text-sm text-neg">
            <Icon name="alert" size={16} className="shrink-0" />
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="first_name">First name</label>
            <input id="first_name" className="input" value={form.first_name} onChange={set("first_name")} required />
          </div>
          <div>
            <label className="label" htmlFor="last_name">Last name</label>
            <input id="last_name" className="input" value={form.last_name} onChange={set("last_name")} required />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="reg_email">Email</label>
          <input id="reg_email" type="email" className="input" value={form.email} onChange={set("email")} required />
        </div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <PasswordInput
            id="pw"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            autoComplete="new-password"
            minLength={8}
            required
            describedBy="pw-hint"
          />
          <p id="pw-hint" className="mt-1.5 text-xs text-slate-400">
            At least 8 characters — avoid common or all-numeric passwords.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="pw2">Confirm password</label>
          <PasswordInput
            id="pw2"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            required
          />
          {confirm && form.password !== confirm && (
            <p className="mt-1.5 text-xs text-neg">Passwords don&apos;t match.</p>
          )}
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-brand-500"
            aria-label="Confirm you are 18+ and agree to the terms"
          />
          <span>
            I am 18+ and agree to the{" "}
            <Link href="/terms" className="text-brand-300">Terms</Link> and{" "}
            <Link href="/privacy" className="text-brand-300">Privacy Policy</Link>. This tool is
            informational only.
          </span>
        </label>
        <button className="btn-primary w-full" disabled={busy || !agreed}>
          {busy ? <><Spinner /> Creating…</> : "Sign up"}
        </button>
        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="font-semibold text-brand-300"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
