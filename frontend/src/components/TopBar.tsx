"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { useAuth } from "@/lib/auth";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/best-bets": "Best Bets",
  "/predictions": "Predictions",
  "/odds": "Odds Intelligence",
  "/arbitrage": "Arbitrage",
  "/scores": "Scores",
  "/oddsbot": "CrownBot",
  "/watchlist": "Watchlist",
  "/bankroll": "Bankroll",
  "/learn": "Learn",
  "/profile": "Profile",
};

export default function TopBar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const title = TITLES[pathname] ?? Object.entries(TITLES).find(([p]) => pathname.startsWith(p))?.[1] ?? "";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-ink-950/70 px-4 backdrop-blur-xl">
      <button onClick={onMenu} aria-label="Open menu" className="btn-ghost px-2.5 lg:hidden">
        <Icon name="menu" />
      </button>

      <span className="font-display text-sm font-bold text-white">{title}</span>
      <div className="flex-1" />

      <Link href="/oddsbot" className="btn-soft text-sm">
        <Icon name="spark" size={16} /> <span className="hidden sm:inline">Ask CrownBot</span>
      </Link>
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
