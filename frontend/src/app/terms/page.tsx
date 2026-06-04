import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "CrownWager terms of service — an informational sports-analytics tool. 18+.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl py-4 leading-relaxed text-slate-300 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_p]:mt-3">
      <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
      <p className="text-sm text-slate-500">Last updated: June 2026</p>

      <h2>1. What CrownWager is</h2>
      <p>
        CrownWager is an <strong>informational sports-analytics tool</strong>. It provides model
        predictions, odds comparisons, expected-value estimates, and arbitrage calculations for
        educational and entertainment purposes only. CrownWager is <strong>not a sportsbook</strong>: it
        does not accept, place, or settle wagers, and it never holds or transfers money.
      </p>

      <h2>2. Not advice; no guarantees</h2>
      <p>
        Nothing on CrownWager is financial, investment, or betting advice. Model outputs are estimates
        and may be wrong; odds change; past performance does not predict future results. You are solely
        responsible for any decisions you make. We make no warranty of accuracy, availability, or fitness
        for any purpose, and provide the service &ldquo;as is&rdquo; to the maximum extent permitted by law.
      </p>

      <h2>3. Age &amp; eligibility</h2>
      <p>
        You must be at least <strong>18 years old</strong> (or the age of majority in your jurisdiction,
        whichever is higher) to use CrownWager. Sports-betting laws vary by location; it is your
        responsibility to ensure your use is legal where you are.
      </p>

      <h2>4. Acceptable use</h2>
      <p>
        Do not abuse, scrape, overload, or attempt to disrupt the service or its AI assistant, and do not
        use it for unlawful purposes. We may rate-limit, suspend, or remove access to protect the service.
      </p>

      <h2>5. Third-party data</h2>
      <p>
        Odds and scores are sourced from third parties (e.g. The Odds API), news from public feeds
        (e.g. ESPN), and the AI assistant is powered by a third-party language model. We are not
        responsible for the accuracy or availability of third-party data, and your assistant messages are
        processed by that provider to generate responses.
      </p>

      <h2>6. Responsible gambling</h2>
      <p>
        If you choose to bet elsewhere, bet only what you can afford to lose. If gambling is causing harm,
        call <strong>1-800-GAMBLER</strong> or contact your local problem-gambling helpline.
      </p>

      <h2>7. Changes</h2>
      <p>We may update these terms; continued use means you accept the changes. See also our{" "}
        <Link href="/privacy" className="text-brand-300">Privacy Policy</Link>.
      </p>
    </article>
  );
}
