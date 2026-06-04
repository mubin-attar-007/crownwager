"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Logo from "@/components/Logo";

const LINKS = [
  { href: "/best-bets", label: "Best Bets" },
  { href: "/predictions", label: "Predictions" },
  { href: "/odds", label: "Odds" },
  { href: "/scores", label: "Scores" },
  { href: "/arbitrage", label: "Arbitrage" },
  { href: "/learn", label: "Learn" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
      <nav className="container-x flex h-16 items-center justify-between">
        <Link href="/" aria-label="CrownWager home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  active ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-brand-gradient" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link href="/profile" className="btn-ghost text-sm">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-ink-950">
                  {(user.first_name || user.username)[0]?.toUpperCase()}
                </span>
                {user.first_name || "Profile"}
              </Link>
              <button onClick={logout} className="btn-ghost text-sm">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">
                Log in
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="btn-ghost px-3 lg:hidden"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/[0.06] bg-ink-900/95 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-white/[0.06] pt-3">
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">
                    Profile
                  </Link>
                  <button onClick={() => { logout(); setOpen(false); }} className="btn-ghost flex-1 text-sm">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">
                    Log in
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
