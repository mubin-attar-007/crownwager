import { describe, expect, it } from "vitest";
import { toMatrix } from "./odds";
import type { OddsEvent } from "./types";

function event(bookmakers: OddsEvent["bookmakers"]): OddsEvent {
  return {
    id: "evt-1",
    sport_title: "NBA",
    home_team: "Lakers",
    away_team: "Celtics",
    commence_time: "2026-06-11T00:00:00Z",
    bookmakers,
  };
}

function h2h(title: string, outcomes: { name: string; price: number }[]) {
  return { key: title.toLowerCase(), title, markets: [{ key: "h2h", outcomes }] };
}

describe("toMatrix", () => {
  it("builds the book list across bookmakers", () => {
    const m = toMatrix(
      event([
        h2h("DraftKings", [{ name: "Lakers", price: 1.91 }, { name: "Celtics", price: 1.95 }]),
        h2h("FanDuel", [{ name: "Lakers", price: 1.87 }, { name: "Celtics", price: 2.0 }]),
      ]),
    );
    expect(m.books).toEqual(["DraftKings", "FanDuel"]);
  });

  it("ignores non-h2h markets", () => {
    const m = toMatrix(
      event([
        {
          key: "draftkings",
          title: "DraftKings",
          markets: [{ key: "spreads", outcomes: [{ name: "Lakers", price: 1.91 }] }],
        },
      ]),
    );
    expect(m.books).toEqual([]);
    expect(m.rows).toEqual([]);
  });

  it("computes the best price per team", () => {
    const m = toMatrix(
      event([
        h2h("DraftKings", [{ name: "Lakers", price: 1.91 }, { name: "Celtics", price: 1.95 }]),
        h2h("FanDuel", [{ name: "Lakers", price: 2.05 }, { name: "Celtics", price: 1.9 }]),
      ]),
    );
    const lakers = m.rows.find((r) => r.team === "Lakers");
    const celtics = m.rows.find((r) => r.team === "Celtics");
    expect(lakers?.best).toBe(2.05);
    expect(celtics?.best).toBe(1.95);
  });

  it("handles a book missing a team's price", () => {
    const m = toMatrix(
      event([
        h2h("DraftKings", [{ name: "Lakers", price: 1.91 }, { name: "Celtics", price: 1.95 }]),
        h2h("FanDuel", [{ name: "Lakers", price: 1.87 }]),
      ]),
    );
    const celtics = m.rows.find((r) => r.team === "Celtics");
    expect(celtics?.prices).toEqual({ DraftKings: 1.95 });
    expect(celtics?.best).toBe(1.95);
  });
});
