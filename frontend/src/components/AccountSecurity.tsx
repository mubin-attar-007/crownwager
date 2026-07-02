"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { PasswordInput } from "@/components/PasswordInput";

function fieldError(err: unknown, ...keys: string[]): string {
  if (err instanceof ApiError && err.data && typeof err.data === "object") {
    const data = err.data as Record<string, string[] | undefined>;
    for (const k of keys) {
      const v = data[k];
      if (v?.[0]) return v[0];
    }
    return err.message;
  }
  return "Something went wrong.";
}

export function AccountSecurity() {
  const { logout } = useAuth();
  const router = useRouter();
  const { push: toast } = useToast();

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const [delOpen, setDelOpen] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [delBusy, setDelBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirm) {
      toast("New passwords don't match.", "error");
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/change-password/", { old_password: oldPw, new_password: newPw });
      setOldPw("");
      setNewPw("");
      setConfirm("");
      toast("Password changed");
    } catch (err) {
      toast(fieldError(err, "old_password", "new_password"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDelBusy(true);
    try {
      await api.post("/auth/delete/", { password: delPw });
      toast("Account deleted");
      await logout();
      router.push("/");
    } catch (err) {
      toast(fieldError(err, "password"), "error");
      setDelBusy(false);
    }
  }

  return (
    <section className="mt-8 space-y-6">
      <div>
        <h2 className="mb-3 text-lg font-bold">Change password</h2>
        <form onSubmit={changePassword} className="card space-y-4">
          <div>
            <label className="label" htmlFor="old-pw">Current password</label>
            <PasswordInput id="old-pw" value={oldPw} onChange={setOldPw} autoComplete="current-password" required />
          </div>
          <div>
            <label className="label" htmlFor="new-pw">New password</label>
            <PasswordInput id="new-pw" value={newPw} onChange={setNewPw} autoComplete="new-password" minLength={8} required />
          </div>
          <div>
            <label className="label" htmlFor="cf-pw">Confirm new password</label>
            <PasswordInput id="cf-pw" value={confirm} onChange={setConfirm} autoComplete="new-password" required />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-neg">Danger zone</h2>
        <div className="card space-y-3 border-neg/30">
          <p className="text-sm text-slate-300">
            Permanently delete your account, saved picks, and tracked bets. This can&apos;t be undone.
          </p>
          {!delOpen ? (
            <button
              type="button"
              onClick={() => setDelOpen(true)}
              className="rounded-xl border border-neg/40 px-4 py-2 text-sm font-semibold text-neg transition hover:bg-neg/10"
            >
              Delete account
            </button>
          ) : (
            <form onSubmit={deleteAccount} className="space-y-3">
              <div>
                <label className="label" htmlFor="del-pw">Confirm your password to delete</label>
                <PasswordInput id="del-pw" value={delPw} onChange={setDelPw} autoComplete="current-password" required />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-xl bg-neg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  disabled={delBusy}
                >
                  {delBusy ? "Deleting…" : "Permanently delete"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDelOpen(false);
                    setDelPw("");
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
