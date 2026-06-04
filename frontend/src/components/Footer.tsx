import Link from "next/link";
import Logo from "@/components/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/best-bets", label: "Best Bets" },
      { href: "/predictions", label: "Predictions" },
      { href: "/odds", label: "Odds Comparison" },
      { href: "/arbitrage", label: "Arbitrage Finder" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/learn", label: "Betting 101" },
      { href: "/learn", label: "News & Analysis" },
      { href: "/scores", label: "Scores" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/register", label: "Sign up" },
      { href: "/login", label: "Log in" },
      { href: "/profile", label: "Profile & saved picks" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/[0.06] bg-ink-900/40">
      <div className="container-x py-12">
        <div className="rounded-2xl border border-warn/20 bg-warn/[0.06] p-4 text-sm text-warn/90">
          <strong>18+ · Please bet responsibly.</strong> CrownWager is an informational analytics tool — it
          does not accept wagers, hold funds, or provide financial advice. If gambling is a problem for you,
          call 1-800-GAMBLER.
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-400">
              Find the edge. Data-driven sports betting analytics — best bets, predictions, and arbitrage.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l, i) => (
                  <li key={i}>
                    <Link href={l.href} className="text-sm text-slate-400 transition hover:text-brand-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} CrownWager — data-driven sports analytics.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-brand-300">Terms</Link>
            <Link href="/privacy" className="hover:text-brand-300">Privacy</Link>
            <span>Informational only · 18+</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
