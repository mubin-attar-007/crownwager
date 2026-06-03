// Per-screen Stitch prompts for OddsAway. Directive ("Design a…") with concrete content + a concise
// style line. A separate design system carries the tokens; keep prompts about layout & content.

export const STYLE_SHORT =
  "Visual style: premium dark theme, deep navy background (#0b1120 / #05080f), an emerald-to-cyan " +
  "gradient (#34d399 → #06b6d4) for the logo, primary buttons, active states and key numbers; positive " +
  "emerald, negative rose (#fb7185), warning amber (#fbbf24). Glassmorphism cards with hairline white " +
  "borders, soft shadows and a faint emerald glow, rounded corners (~18px). Subtle mesh-gradient " +
  "background. Sora for headings (bold, tight), Inter for body. Tabular numbers; big stats in the " +
  "gradient. Clean, data-dense but calm, like TradingView, Stripe, Linear and Bloomberg Terminal. " +
  "Absolutely no casino, neon, or flashy gambling aesthetics. Accessible contrast, clear focus states.";

export const SCREENS = [
  {
    id: "landing",
    device: "DESKTOP",
    spec: `Design a premium dark-themed marketing landing page for OddsAway, an AI-powered sports-betting ANALYTICS platform (not a sportsbook; informational only, 18+).
Top navbar: OddsAway logo (small emerald-to-cyan gradient chart-arrow mark + wordmark with "Odds" in gradient and "Away" in white); nav links Best Bets, Predictions, Odds, Scores, Arbitrage, Learn; a "Log in" text button and a gradient "Get started" button.
Hero (centered, over a subtle dark mesh gradient): small uppercase eyebrow "DATA-DRIVEN SPORTS BETTING ANALYTICS"; a large bold headline "Find the edge. Bet with numbers, not vibes." with the word "edge" in the emerald-to-cyan gradient; a one-line subheading; a primary gradient button "See today's best bets" and a secondary outline button "How it works"; tiny muted text "Informational only · No real-money wagering · 18+".
Below the hero, three floating glassmorphism preview cards: (1) a "Best Bet" card — "Los Angeles Lakers", a green pill "▲ +10.56% edge", odds "+110", a thin emerald progress bar labeled "Model win 58.2%", and "EV/$100 $22.18 · DraftKings"; (2) an "AI Prediction" card with an "Ensemble" tag, a team pick, and a 60% probability bar; (3) a small line chart card titled "Line movement".
A stat strip with four metrics: "100K+ data points", "+EV picks", "5 ML signals/game", "$0 real-money risk".
Sections: a features grid (Best Bets, Predictions, Odds Comparison, Arbitrage, OddsBot AI); a "How it works" 3-step row (Model the game → Compare to the market → Surface the edge); a sports row (NBA, NFL, MLB, NHL); a pricing section (Free vs Pro); testimonials; an FAQ.
Footer with link columns and a subtle amber "Bet responsibly · 18+" note.`,
  },
  {
    id: "dashboard",
    device: "DESKTOP",
    spec: `Design a premium dark analytics dashboard (home) for the OddsAway web app, in the style of a TradingView/Linear workspace.
Left sidebar (dark, collapsible) with the OddsAway logo on top and icon+label nav: Dashboard (active, highlighted), Best Bets, Predictions, Odds Intelligence, Arbitrage, Scores, OddsBot, Watchlist, Bankroll, Learn, Settings; a small user profile at the bottom.
Top bar: a global search field "Search teams, games…", sport-selector pills (NBA NFL MLB NHL), a green "Live" badge, a notifications bell with a dot, an "OddsBot" button, and an avatar.
Main area, a grid of glassmorphism widget cards: "Today's Best Bets" (5 compact rows, each a team + a green edge pill + odds), "Bankroll overview" (big "$1,000", "Kelly 50%", a small green growth sparkline), "Model performance" (a thin line chart of accuracy), "Market movers" (a list with up/down arrows), an "Ask OddsBot" prompt card, and "Active alerts".`,
  },
  {
    id: "best-bets",
    device: "DESKTOP",
    spec: `Design the "Best Bets" page of the OddsAway web app (with the left sidebar and top bar).
Header: small eyebrow "TODAY'S EDGES", title "Best Bets", subtitle "Ranked by model edge. Stakes use the Kelly criterion."; on the right, sport-selector pills (NBA NFL MLB NHL), a green "Live" badge, and a min-edge filter.
A row of four stat tiles: "Top edge +10.6%", "Picks today 6", "Your bankroll $1,000", "Kelly 50%".
Then a ranked vertical list of best-bet cards. Each card has: a rank chip (#1, #2…), the selection (team name in bold white), a green edge pill "▲ +x.x% edge", a small market chip ("moneyline" / "total"), a matchup line "Away @ Home · Bookmaker", a thin emerald model win-probability bar with the % on the right, a compact stat group (Odds +110 · EV/$100 $22.18 · Stake $118.20), and a "★ Save" button.
A small muted footer disclaimer "Informational only. 18+. Bet responsibly."`,
  },
  {
    id: "predictions",
    device: "DESKTOP",
    spec: `Design the "Predictions" page of the OddsAway web app (left sidebar + top bar). Header with title and sport-selector pills + a Live badge.
A vertical stack of per-game glass cards. Each game card: a matchup header "Away @ Home" and a date chip. Inside, three model sub-cards in a row: "Ensemble", "XGBoost", "Neural Net" — each with a small tag, the market ("moneyline"/"over-under"), the predicted pick, a thin win-probability bar, and a small circular confidence ring. Emphasize probability bars and confidence visualization (data storytelling), not simple win/loss text.`,
  },
  {
    id: "odds",
    device: "DESKTOP",
    spec: `Design the "Odds Intelligence" page of the OddsAway web app (left sidebar + top bar), with a financial-trading-terminal feel.
For each game, a sportsbook comparison table: rows are the two teams, columns are sportsbooks (DraftKings, FanDuel, BetMGM, Caesars, Bovada), each cell shows a price, and the best price per row is highlighted in emerald with a subtle glow. Beside or below it, a thin line-movement chart over time (TradingView style, gradient area fill). Include a locked "Pro" panel (blurred, with a small lock) for "Sharp money %" and "Public betting %". Sport-selector pills and a Live badge in the header.`,
  },
  {
    id: "oddsbot",
    device: "DESKTOP",
    spec: `Design the "OddsBot" AI insights center of the OddsAway web app (left sidebar + top bar). A two-pane layout: a LEFT context panel "Today's top edges" (compact best-bet rows), and a RIGHT chat conversation.
The chat header shows the OddsBot logo, a small "gemini-2.5-flash" model badge, and an "informational" chip. Suggested prompt chips: "Why is this the best edge today?", "Explain this prediction", "What's the Kelly stake?", "Which games have the biggest edges?". The conversation shows user message bubbles (emerald-cyan gradient, right-aligned) and assistant bubbles (glass, left-aligned) with a data-grounded answer that mentions an edge %; include a subtle "thinking…" indicator. A bottom input row with a gradient send button. A persistent small "Informational only. 18+." note.`,
  },
  {
    id: "arbitrage",
    device: "DESKTOP",
    spec: `Design the "Arbitrage Finder" page of the OddsAway web app (left sidebar + top bar).
A control card with a "Total stake ($)" input, a gradient "Scan for arbitrage" button, and a Live badge. Below, result cards for each opportunity: the matchup, a large "Guaranteed profit $10.00" in emerald and "Return 5.00%" in the gradient, and a row of per-leg "stake split" chips (each showing outcome, bookmaker, odds, and stake $). Include a clean empty-state for "No arbitrage found right now". A subtle one-line explainer that arbitrage = best cross-book prices summing under 100%.`,
  },
  {
    id: "scores",
    device: "DESKTOP",
    spec: `Design the "Scores" page of the OddsAway web app (left sidebar + top bar). A responsive grid of scoreboard cards. Each card: a small league chip, a status badge ("Final" in slate, or "Live" with a pulsing rose dot), the away and home teams each with their score, and the winning team's row highlighted in the emerald-cyan gradient. Sport-selector pills in the header.`,
  },
  {
    id: "bankroll",
    device: "DESKTOP",
    spec: `Design the "Bankroll" dashboard of the OddsAway web app (left sidebar + top bar), in a portfolio / quantitative-trading style.
Top: editable settings — bankroll amount ($1,000), a Kelly-fraction slider (default 50% half-Kelly), and a favorite-sport selector. Below, premium analytics charts each marked with a small "Pro" tag: a big "ROI" stat with a cumulative profit/loss area chart, a "bankroll growth" line curve, "drawdown" bands, a "win rate" donut, and a "CLV (closing line value)" trend. Beautiful fintech/investment-dashboard visuals with emerald-cyan accents. Calm and credible.`,
  },
  {
    id: "learn",
    device: "DESKTOP",
    spec: `Design the "Learn" page of the OddsAway web app (left sidebar + top bar). A header "Learn — news, analysis and Betting-101 guides". A featured article hero at the top, then a responsive grid of article cards, each with a category badge ("Betting 101" in cyan or "News" in emerald), a title, a one-line summary, and a "Read →" link. Editorial, calm, generous whitespace.`,
  },
];
