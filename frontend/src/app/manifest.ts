import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CrownWager — Sports Betting Analytics",
    short_name: "CrownWager",
    description: "Best bets, predictions, odds, and arbitrage. Informational only. 18+.",
    start_url: "/",
    display: "standalone",
    background_color: "#05080f",
    theme_color: "#0b1120",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
