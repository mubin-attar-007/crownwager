"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { LogoMark } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/best-bets", label: "Best Bets", icon: "target" },
  { href: "/predictions", label: "Predictions", icon: "brain" },
  { href: "/odds", label: "Odds Intelligence", icon: "table" },
  { href: "/arbitrage", label: "Arbitrage", icon: "swap" },
  { href: "/scores", label: "Scores", icon: "trophy" },
  { href: "/oddsbot", label: "OddsBot", icon: "spark" },
  { href: "/watchlist", label: "Watchlist", icon: "bookmark" },
  { href: "/bankroll", label: "Bankroll", icon: "wallet" },
  { href: "/learn", label: "Learn", icon: "book" },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/[0.06] bg-ink-900/60 backdrop-blur-xl">
      <div className="flex h-16 items-center px-5">
        <Link href="/" aria-label="OddsAway home" className="flex items-center gap-2">
          <LogoMark size={26} />
          <span className="text-base font-extrabold tracking-tight font-display">
            <span className="gradient-text">Odds</span><span className="text-white">Away</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((n) => {
          const active = pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-brand-500/10 text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span className={active ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300"}>
                <Icon name={n.icon} />
              </span>
              {n.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <Link
          href={user ? "/profile" : "/login"}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/[0.04]"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-ink-950">
            {user ? (user.first_name || user.username)[0]?.toUpperCase() : "?"}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-white">
              {user ? user.first_name || user.username : "Log in"}
            </span>
            <span className="block truncate text-xs text-slate-500">
              {user ? user.email : "Save picks & bankroll"}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
