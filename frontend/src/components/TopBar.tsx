"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { useAuth } from "@/lib/auth";

export default function TopBar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-ink-950/70 px-4 backdrop-blur-xl">
      <button onClick={onMenu} aria-label="Open menu" className="btn-ghost px-2.5 lg:hidden">
        <Icon name="menu" />
      </button>

      <label className="relative hidden flex-1 sm:block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <Icon name="search" size={16} />
        </span>
        <input
          className="input max-w-md pl-9"
          placeholder="Search teams, games, markets…"
          aria-label="Search"
        />
      </label>
      <div className="flex-1 sm:hidden" />

      <Link href="/oddsbot" className="btn-soft text-sm">
        <Icon name="spark" size={16} /> <span className="hidden sm:inline">OddsBot</span>
      </Link>
      <button className="relative btn-ghost px-2.5" aria-label="Notifications">
        <Icon name="bell" size={18} />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-400" />
      </button>
      <Link
        href={user ? "/profile" : "/login"}
        className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-ink-950"
        aria-label={user ? "Profile" : "Log in"}
      >
        {user ? (user.first_name || user.username)[0]?.toUpperCase() : "?"}
      </Link>
    </header>
  );
}
