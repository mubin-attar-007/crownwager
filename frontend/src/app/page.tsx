import Link from "next/link";
import HeroPreview from "@/components/HeroPreview";

const FEATURES = [
  { href: "/best-bets", icon: "🎯", title: "Best Bets", desc: "Our model's top +EV picks daily — ranked by edge, with EV and Kelly-sized stakes." },
  { href: "/predictions", icon: "🧠", title: "Model Predictions", desc: "Win probabilities from our validated gradient-boosted model, lined up against the market's implied odds." },
  { href: "/odds", icon: "📊", title: "Odds Comparison", desc: "Compare live moneyline odds across sportsbooks and always get the best price." },
  { href: "/arbitrage", icon: "♻️", title: "Arbitrage Finder", desc: "Spot guaranteed-profit opportunities across books, with exact stake splits." },
];

const STATS = [
  { value: "65%", label: "model CV accuracy" },
  { value: "+EV", label: "every surfaced pick" },
  { value: "3,023", label: "games trained on" },
  { value: "0", label: "real-money risk" },
];

const STEPS = [
  { n: "01", title: "Model the game", desc: "Our models estimate each outcome's true probability from team strength, rest, and form." },
  { n: "02", title: "Compare to the market", desc: "We line that up against live sportsbook odds to find where the price is wrong." },
  { n: "03", title: "Surface the edge", desc: "Positive-EV picks are ranked by edge and sized with the Kelly criterion." },
];

export default function Home() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-brand-radial px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <p className="eyebrow animate-fade-up">Data-driven sports betting analytics</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-[1.08] text-white animate-fade-up sm:text-6xl lg:mx-0">
              Find the <span className="gradient-text">edge</span>.<br />Bet with numbers, not vibes.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 animate-fade-up sm:text-lg lg:mx-0">
              CrownWager compares our model&apos;s true probabilities against sportsbook odds to surface
              positive expected-value picks, predictions, and arbitrage — all in one place.
            </p>
            <div className="mt-9 flex flex-col gap-3 animate-fade-up sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/best-bets" className="btn-primary w-full px-6 py-3 text-base sm:w-auto">
                See today&apos;s best bets →
              </Link>
              <Link href="/learn" className="btn-ghost w-full px-6 py-3 text-base sm:w-auto">
                How it works
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500">Informational only · No real-money wagering · 18+</p>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* Stat band */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-6 text-center">
            <div className="text-3xl font-extrabold gradient-text font-display">{s.value}</div>
            <div className="mt-1 text-sm text-slate-400">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section>
        <div className="mb-8 text-center">
          <p className="eyebrow">Everything in one place</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white">Your edge, fully equipped</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="card card-hover group">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-brand-300 transition group-hover:translate-x-1">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-3xl border border-white/[0.06] bg-ink-900/40 p-8 sm:p-12">
        <div className="mb-10 text-center">
          <p className="eyebrow">The method</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white">From data to a real edge</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
              <div className="font-display text-3xl font-extrabold text-brand-400/80">{s.n}</div>
              <h3 className="mt-2 text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-brand-radial p-10 text-center sm:p-16">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Ready to find your edge?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Create a free account to save picks and get stakes sized to your bankroll.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">Get started — free</Link>
          <Link href="/best-bets" className="btn-ghost px-6 py-3 text-base">Browse best bets</Link>
        </div>
      </section>
    </div>
  );
}
