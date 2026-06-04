import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Public, indexable routes. (App pages behind auth + auth pages are excluded; see robots.ts.)
const ROUTES = ["", "/best-bets", "/predictions", "/odds", "/scores", "/arbitrage", "/learn", "/terms", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "daily" : "hourly",
    priority: path === "" ? 1 : 0.7,
  }));
}
