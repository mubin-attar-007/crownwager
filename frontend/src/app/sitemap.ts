import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Public, indexable routes. (App pages behind auth + auth pages are excluded; see robots.ts.)
const ROUTES = ["", "/best-bets", "/predictions", "/odds", "/scores", "/arbitrage", "/learn", "/terms", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    // Data pages change daily; evergreen content far less often.
    changeFrequency: path === "/learn" ? "weekly" : ["/terms", "/privacy"].includes(path) ? "monthly" : "daily",
    priority:
      path === ""
        ? 1
        : ["/best-bets", "/predictions"].includes(path)
          ? 0.9
          : ["/terms", "/privacy"].includes(path)
            ? 0.3
            : 0.7,
  }));
}
