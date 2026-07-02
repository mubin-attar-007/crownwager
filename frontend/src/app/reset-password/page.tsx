"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/icons";
import { Spinner } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";
  const invalidLink = !uid || !token;

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/password-reset-confirm/", { uid, token, new_password: pw });
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.data as { new_password?: string[] })?.new_password?.[0] || err.message
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
        <h1 className="mt-4 text-2xl font-extrabold text-white">Set a new password</h1>
      </div>
      {invalidLink ? (
        <div className="card text-center text-sm text-slate-300">
          This reset link is invalid or incomplete.{" "}
          <Link href="/forgot-password" className="font-semibold text-brand-300">
            Request a new one
          </Link>
          .
        </div>
      ) : done ? (
        <div className="card text-center text-sm text-slate-200">
          Password reset — taking you to log in…
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
            <label className="label" htmlFor="pw">New password</label>
            <PasswordInput
              id="pw"
              value={pw}
              onChange={setPw}
              autoComplete="new-password"
              minLength={8}
              required
              describedBy="pw-hint"
            />
            <p id="pw-hint" className="mt-1.5 text-xs text-slate-500">At least 8 characters.</p>
          </div>
          <div>
            <label className="label" htmlFor="pw2">Confirm new password</label>
            <PasswordInput id="pw2" value={confirm} onChange={setConfirm} autoComplete="new-password" required />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? (
              <>
                <Spinner /> Resetting…
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
