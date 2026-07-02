// Shared API response types (mirror the DRF serializers).

export interface ArbitrageLeg {
  outcome: string;
  bookmaker: string;
  price: string;
  stake: string;
  implied_prob: string;
}

export interface ArbitrageOpportunity {
  event_id: string;
  sport_key: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: string | null;
  bet_size: string;
  implied_total: string;
  profit: string;
  profit_pct: string;
  legs: ArbitrageLeg[];
}

export interface ArbitrageResponse {
  sport: string;
  bet_size: string;
  demo: boolean;
  count: number;
  opportunities: ArbitrageOpportunity[];
}

export interface BestBet {
  external_id: string;
  home_team: string;
  away_team: string;
  sport_key: string;
  sport_title: string;
  commence_time: string | null;
  market: string;
  selection: string;
  bookmaker: string;
  american_odds: number;
  decimal_odds: string;
  model_probability: string;
  edge_pct: string;
  expected_value: string;
  kelly_fraction: string;
  confidence: string;
  recommended_stake?: string;
}

export interface BestBetsResponse {
  sport: string;
  demo: boolean;
  bankroll: string;
  kelly_fraction: string;
  count: number;
  best_bets: BestBet[];
  disclaimer: string;
}

export interface ModelPick {
  model_name: string;
  model_label?: string;
  market: string;
  pick: string;
  win_probability: number | string;
  confidence: number | string;
}

export interface GamePrediction {
  external_id: string;
  home_team: string;
  away_team: string;
  sport_key: string;
  sport_title?: string;
  commence_time?: string | null;
  models: ModelPick[];
}

export interface PredictionsResponse {
  sport: string;
  demo: boolean;
  count: number;
  games: GamePrediction[];
}

export interface OddsEvent {
  id: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: {
    key: string;
    title: string;
    markets: { key: string; outcomes: { name: string; price: number }[] }[];
  }[];
}

export interface OddsResponse {
  sport: string;
  demo: boolean;
  count: number;
  events: OddsEvent[];
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  body?: string;
  published_at: string | null;
}

export interface UserProfile {
  phone_number: string;
  bio: string;
  bankroll: string;
  kelly_fraction: string;
  favorite_sport: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
}

export interface SavedBet {
  id: number;
  external_id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  market: string;
  selection: string;
  bookmaker: string;
  american_odds: number;
  model_probability: string;
  edge_pct: string;
  expected_value: string;
  saved_at: string;
}

export interface ChatResponse {
  reply: string;
  powered_by: string;
  disclaimer: string;
}

export type BetStatus = "pending" | "won" | "lost" | "push";

export interface TrackedBet {
  id: number;
  external_id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  market: string;
  selection: string;
  bookmaker: string;
  american_odds: number;
  stake: string;
  status: BetStatus;
  profit: string;
  placed_at: string;
  settled_at: string | null;
}

export interface BankrollStats {
  record: string;
  wins: number;
  losses: number;
  pushes: number;
  total_staked: string;
  total_profit: string;
  roi_pct: string;
  win_rate_pct: string;
  settled_count: number;
  pending_count: number;
  pending_stake: string;
  growth: { at: string; cumulative_profit: string }[];
}

export interface RecordSummary {
  n: number;
  wins: number;
  losses: number;
  pushes: number;
  record: string;
  win_rate_pct: string;
  units_profit: string;
  units_staked: string;
  roi_pct: string;
}

export interface EdgeTierRecord extends RecordSummary {
  label: string;
}

export interface ModelRecord {
  sport: string | null;
  settled_count: number;
  pending_count: number;
  insufficient: boolean;
  min_sample: number;
  overall: RecordSummary;
  by_edge_tier: EdgeTierRecord[];
  last_settled_at: string | null;
  disclaimer: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const SPORTS: { key: string; label: string }[] = [
  { key: "basketball_nba", label: "NBA" },
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "baseball_mlb", label: "MLB" },
  { key: "icehockey_nhl", label: "NHL" },
];
