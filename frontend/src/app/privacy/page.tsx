import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How CrownWager handles your data. Informational sports-analytics tool. 18+.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl py-4 leading-relaxed text-slate-300 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_p]:mt-3 [&_li]:mt-1">
      <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: June 2026</p>

      <h2>1. What we collect</h2>
      <p>If you create an account, we store:</p>
      <ul className="ml-5 list-disc">
        <li>your name and email (email is also your username);</li>
        <li>profile settings you enter (bio, phone, favorite sport, notional bankroll &amp; Kelly fraction);</li>
        <li>picks you save and bets you log for tracking.</li>
      </ul>
      <p>
        We do <strong>not</strong> collect payment information — CrownWager never handles money. The notional
        &ldquo;bankroll&rdquo; is just a number used to size suggested stakes; it is not real funds.
      </p>

      <h2>2. How we use it</h2>
      <p>
        Solely to operate the service: authenticate you, personalize stake suggestions, and show your saved
        picks and bet history. We do not sell your data.
      </p>

      <h2>3. Third parties</h2>
      <p>
        Odds/scores come from third-party data providers; news from public feeds; and the CrownBot assistant
        sends your messages (plus the current best-bets context) to a third-party language-model provider to
        generate replies. Those providers process that data under their own policies.
      </p>

      <h2>4. Authentication &amp; cookies</h2>
      <p>
        We use JWT access/refresh tokens (stored in your browser) to keep you logged in. We do not use
        third-party advertising or tracking cookies.
      </p>

      <h2>5. Data retention &amp; deletion</h2>
      <p>
        Your data is kept while your account is active. You can request deletion of your account and
        associated data by contacting us; we will remove it within a reasonable period.
      </p>

      <h2>6. Children</h2>
      <p>CrownWager is for users 18+ and is not directed at children.</p>

      <h2>7. Changes</h2>
      <p>We may update this policy. See also our{" "}
        <Link href="/terms" className="text-brand-300">Terms of Service</Link>.
      </p>
    </article>
  );
}
