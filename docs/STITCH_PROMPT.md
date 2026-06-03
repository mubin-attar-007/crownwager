# OddsAway — Stitch UI Generation Prompt (tailored to the real product)

> How to use: paste **§1–§4 (Brand + Constraints + Visual System + IA)** once as the style/setup, then
> generate **one screen at a time** using each block in **§5**. Each screen lists the exact data fields
> our API returns, so the mockups map directly onto the existing endpoints. Tags: **[LIVE]** = endpoint
> exists today · **[ROADMAP]** = design now, build next on our stack · **[PREMIUM DATA]** = design as a
> "Pro" placeholder; needs a paid data feed (The Odds API free tier doesn't provide it).

---

## §1 · PRODUCT & BRAND

Product: **OddsAway** — an AI-powered **sports analytics & betting-intelligence** platform (NOT a
sportsbook). It compares model-estimated true probabilities against live sportsbook odds to surface
**positive expected-value (+EV)** opportunities, predictions, and arbitrage.

- Tagline: **"Find the edge. Bet with numbers, not vibes."**
- Logo: a geometric **upward "edge" trend line** (chart breakout) inside a rounded-square tile, paired
  with the wordmark **Odds**(gradient)**Away**(white). Emerald→cyan gradient stroke.
- Voice: precise, quantitative, trustworthy, calm. Think a fintech research terminal, not a casino.
- Real LLM assistant is **"OddsBot"** (powered by Gemini / Claude), grounded in the user's current data.

Target users: sports bettors, data analysts, sports traders, quantitative/fantasy users, professional
handicappers. Experience must feel like **"Bloomberg Terminal × TradingView × Stripe Dashboard,"** a
2026 funded-startup product built by elite product + data-viz designers.

---

## §2 · HARD CONSTRAINTS (must follow)

- **Analytics-first, NOT gambling-first.** No casino chrome, no slot/neon/coin aesthetics, no "bet now"
  hype. It's a research/intelligence tool.
- **Informational only.** The product never accepts wagers, holds funds, or processes payments. Show a
  subtle persistent **"18+ · Informational only · Bet responsibly"** note in the footer / app shell.
- **Responsible framing.** Confidence and probability are shown with uncertainty; never "guaranteed
  winners." Stakes are always framed as *suggestions* (Kelly), never instructions.
- Dark-first; include an optional light mode. Accessible contrast (WCAG AA), keyboard focus rings.

---

## §3 · VISUAL SYSTEM (exact tokens — match these)

**Theme:** dark-first, premium, glassmorphic, data-dense but breathable.

**Color (dark):**
- Canvas/surfaces (deepest→raised): `#05080f`, `#080c17`, `#0b1120`, `#0f1729`, `#16203a`
- Brand gradient (primary): **emerald `#34d399` → cyan `#06b6d4`** (135°). Use for CTAs, active states,
  key numbers, logo, probability fills.
- Positive / value: emerald `#34d399`. Negative / fade: rose `#fb7185`. Warning / demo: amber `#fbbf24`.
- Text: white `#ffffff` headings, slate `#cbd5e1`/`#94a3b8` body, `#64748b` muted.
- Borders: white at 6–8% opacity. Glass fills: white at 3–5% opacity + backdrop blur.
- Background: deep-navy canvas with a **subtle mesh radial gradient** (emerald top-left, cyan top-right,
  faint indigo bottom) — very low intensity, never loud.

**Typography:**
- Display/headings: **Sora** (700/800, tight tracking).
- Body/UI: **Inter** (400–600).
- Numbers/odds: tabular figures; big stats in Sora extrabold, often in the brand gradient.

**Shape & depth:** rounded-2xl cards (≈16–20px radius), soft layered shadows, a faint emerald **glow**
on primary/active elements, 1px hairline borders. Generous 8-pt spacing grid.

**Signature components (reuse everywhere):**
- **Stat tile** (eyebrow label + big gradient number + sub).
- **Probability bar** (0–100% horizontal bar, gradient fill, % on the right).
- **Edge pill** (`▲ +6.42% edge` emerald, or `▼ −x%` rose).
- **Confidence meter / ring** (small radial or bar).
- **Live/Demo badge** (pulsing dot: emerald "live" / amber "demo").
- **Sport selector** (pill tabs: NBA · NFL · MLB · NHL).
- **Glass card** with hover-lift; **shimmer skeleton** loaders.
- **Sparkline / line chart** (TradingView-style, thin, gradient area fill) for line movement & bankroll.

---

## §4 · INFORMATION ARCHITECTURE (two shells)

**A) Marketing shell (public):** top glass navbar (logo · Best Bets · Predictions · Odds · Scores ·
Arbitrage · Learn · Log in · Get started) + mesh hero + footer.

**B) App shell (authenticated) — TradingView/Linear style:**
- **Left sidebar** (collapsible, icons + labels): Dashboard · Best Bets · Predictions · Odds Intelligence
  · Arbitrage · Scores/Live · OddsBot · Watchlist (Saved) · Bankroll · Learn · Settings.
  *(Sidebar sections tagged [ROADMAP] below: Alerts, Market Movers, Reports.)*
- **Top bar:** global search (teams/games), sport selector, notifications bell, **OddsBot** quick-open,
  avatar menu. Subtle "data source: live/demo" indicator.
- **Main workspace:** responsive widget/card grid. ([ROADMAP] drag-to-rearrange + resizable panels.)

---

## §5 · SCREENS (generate one at a time; fields = our real API)

### 5.1 Landing page **[LIVE]**
- **Hero:** eyebrow "Data-driven sports betting analytics"; H1 "Find the **edge**. Bet with numbers, not
  vibes."; subcopy; primary CTA "See today's best bets", secondary "How it works"; floating logo mark;
  micro-note "Informational only · No real-money wagering · 18+".
- **Live interactive demo widgets row** (use real shapes):
  - *Best-bet card*: selection "Los Angeles Lakers", `▲ +10.56% edge`, odds `+110`, model win 58.2%
    (prob bar), EV/$100 `$22.18`, book "DraftKings".
  - *AI prediction card*: matchup, Ensemble pick + 60.0% prob bar + confidence.
  - *Odds-movement sparkline*: a thin line chart trending. [ROADMAP data]
  - *Market sentiment / edge indicator* gauge. [PREMIUM DATA]
- **Stat band:** "100K+ data points/sport", "+EV every pick", "5 ML signals/game", "$0 real-money risk".
- **Sections:** Features (Best Bets, Predictions, Odds, Arbitrage, OddsBot) · How it works (Model the game
  → Compare to market → Surface the edge) · Sports coverage (NBA/NFL/MLB/NHL) · AI capabilities (OddsBot)
  · Pricing (Free vs **Pro** — Pro = unlimited picks, alerts, bankroll analytics [ROADMAP]) · Testimonials
  · FAQ. Subtle scroll/fade-up animations.

### 5.2 Dashboard / Home (app shell) **[LIVE core, ROADMAP widgets]**
Widget grid:
- *Today's Best Bets* (top 3–5 rows, link to full page) **[LIVE]**
- *AI recommendation / OddsBot prompt* card ("Ask: what's the value today?") **[LIVE]**
- *Bankroll overview* (bankroll, Kelly fraction; ROI/P&L sparkline) — bankroll/Kelly **[LIVE]**, ROI/P&L **[ROADMAP]**
- *Model prediction performance* (accuracy over time) **[ROADMAP]**
- *Market movers* (biggest line moves) **[ROADMAP]**
- *Active alerts* + *Watchlist activity* **[ROADMAP]**
- Header: greeting, sport selector, live/demo badge.

### 5.3 Best Bets **[LIVE]**
Ranked list of +EV picks. **Header stat tiles:** Top edge · Picks today · Your bankroll · Kelly %.
Filters: sport selector, min-edge slider.
**Each bet card fields (exact):** rank `#1`; `selection`; `market` (moneyline | total); **edge pill**
`edge_pct`; `american_odds` (e.g. +110); **probability bar** `model_probability`; `expected_value`
(EV per $100); `recommended_stake` (Kelly, when logged in); `bookmaker`; matchup `away_team @ home_team`;
**Save** (★) button. Footer disclaimer string. Source badge live/demo.

### 5.4 Predictions **[LIVE]**
Per game card: matchup header + date. Inside, **3 model cards**: **Ensemble**, **XGBoost**, **Neural
Net** — each with `pick`, **win-probability bar** (`win_probability`), `confidence`, `market`
(moneyline / over-under). Use probability distributions / confidence bands rather than win/loss cards.
Note: today models are a transparent baseline (label "model: baseline" honestly); design supports
swapping in validated NN/XGBoost later.

### 5.5 Odds Intelligence **[LIVE + ROADMAP charts]**
Financial-terminal feel. Per game: **sportsbook comparison** table — outcomes × books
(DraftKings, FanDuel, BetMGM, Caesars, Bovada) with the **best price highlighted** in emerald.
- **[LIVE]** best price per outcome across books (`bookmakers[].markets[h2h].outcomes[].price`).
- **[ROADMAP]** line-movement chart over time (TradingView-style), open/best/worst.
- **[ROADMAP]** arbitrage flag, value-vs-market delta.
- **[PREMIUM DATA]** sharp-money %, public betting %, steam moves — show as locked "Pro" panels.

### 5.6 Arbitrage Finder **[LIVE]**
Stake input ($). Result cards (fields exact): matchup; **guaranteed profit** `$profit`; **return**
`profit_pct%`; `implied_total`; per-leg split chips: `outcome`, `bookmaker`, `price`, **stake** `$stake`,
`implied_prob`. Empty-state when none (realistic — arbs are rare). Live/demo badge.

### 5.7 OddsBot — AI Insights Center **[LIVE]**
A command-center chat panel (can also be a docked drawer). Grounded in the user's **current best bets**.
- Suggested prompt chips: "Why is this the best edge today?", "Explain this prediction", "What's the
  Kelly stake for X?", "Which games have the biggest edges?".
- Message bubbles (user = gradient, bot = glass), streaming/"thinking" state, model badge
  (`powered_by`, e.g. "gemini-2.5-flash"), persistent "informational only" chip.
- [ROADMAP] richer "explain this line move / unusual activity" once line-movement data exists.

### 5.8 Scores / Live Game Center **[LIVE scores, ROADMAP live odds]**
Scoreboard cards: `away_team`/`home_team` with scores, **Final** (slate) or **Live** (pulsing rose)
badge, winner highlighted in gradient. [ROADMAP] live odds, momentum indicators, live AI updates.

### 5.9 Watchlist / Saved Picks **[LIVE]**
User's saved picks (snapshot): `selection`, edge pill, `american_odds`, matchup, `market`, `bookmaker`,
`saved_at`, remove. [ROADMAP] also track teams/leagues/players/markets + personalized recommendations.

### 5.10 Bankroll **[LIVE settings, ROADMAP analytics]**
- **[LIVE]:** bankroll amount, Kelly fraction (default half-Kelly), favorite sport — editable.
- **[ROADMAP] portfolio-style analytics** (design these as beautiful fintech charts, "Pro"): ROI,
  cumulative profit/loss area chart, bankroll growth curve, drawdown bands, win rate, **CLV tracking**.
  Inspired by investment/quant dashboards. (Needs a bet-tracking model + entries — clearly a next phase.)

### 5.11 Game Analysis page **[ROADMAP]**
Deep-dive per game: team comparison (radar/bars), AI prediction + confidence, EV analysis, matchup
breakdown. [PREMIUM DATA] public betting trends, line-movement history, injury impact.

### 5.12 Alerts Center **[ROADMAP]**
Modern notification feed: odds-movement, AI-opportunity, bankroll, watchlist, injury alerts. Toggles,
channels, per-type settings.

### 5.13 Learn **[LIVE]**
Article grid (News + Betting-101 badges) + article detail (clean reading view). Editorial, calm.

### 5.14 Auth **[LIVE]**
Centered glass cards with logo: Register (first/last name, email, password ≥8) and Login. "18+,
informational only" microcopy. Email-as-username.

### 5.15 Settings / Profile **[LIVE]**
Avatar (gradient monogram), name/email, profile fields, bankroll & Kelly, favorite sport, theme toggle,
saved picks section.

---

## §6 · DATA VISUALIZATION (TradingView / Bloomberg / fintech)
Probability bars & confidence bands · thin line + gradient-area charts (line movement, bankroll growth)
· sparklines in cards · heatmaps (edge by game/sport) · trend arrows · radial confidence rings ·
distribution curves for predictions. Charts are crisp, low-chrome, gridlines faint, brand-gradient
accents. No 3D, no skeuomorphism.

## §7 · MICRO-INTERACTIONS
Premium, subtle, purposeful: fade-up on scroll, card hover-lift + border glow, shimmer skeletons,
animated chart draw-in, smooth panel/page transitions, OddsBot "thinking" + streamed text, live-data
pulse dots. Never flashy.

## §8 · MOBILE (mobile-first responsive)
Native-app feel. Bottom tab bar (Dashboard · Best Bets · Odds · OddsBot · Profile). Prioritize: best
bets, predictions, OddsBot, scores, bankroll. Cards stack; sidebar → drawer; charts simplify gracefully.

## §9 · DELIVERABLE (what to generate, in priority order)
1. Landing page (desktop + mobile)
2. App shell (sidebar + top bar) with **Dashboard/Home**
3. **Best Bets** page
4. **Predictions** page
5. **Odds Intelligence** page
6. **OddsBot / AI Insights** panel
7. **Arbitrage** + **Scores** + **Watchlist/Saved**
8. **Bankroll** (with [ROADMAP] analytics charts)
9. **Learn** + **Auth** + **Settings**

Keep one consistent design language across all screens (the §3 system). The result should look like a
premium, trustworthy 2026 analytics SaaS users would happily pay a Pro subscription for — **intelligent,
fast, clean, data-dense, and calm.**
