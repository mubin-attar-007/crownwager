// Pure odds-matrix helper (unit-tested).

import type { OddsEvent } from "@/lib/types";

export interface Matrix {
  books: string[];
  rows: { team: string; prices: Record<string, number>; best: number }[];
}

export function toMatrix(ev: OddsEvent): Matrix {
  const bookSet = new Set<string>();
  const byTeam: Record<string, Record<string, number>> = {};
  for (const bk of ev.bookmakers) {
    for (const mk of bk.markets) {
      if (mk.key !== "h2h") continue;
      bookSet.add(bk.title);
      for (const o of mk.outcomes) {
        byTeam[o.name] = byTeam[o.name] || {};
        byTeam[o.name][bk.title] = o.price;
      }
    }
  }
  const books = [...bookSet];
  const rows = Object.entries(byTeam).map(([team, prices]) => ({
    team,
    prices,
    best: Math.max(...Object.values(prices)),
  }));
  return { books, rows };
}
