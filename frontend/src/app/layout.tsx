import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const DESCRIPTION =
  "Best bets, ML model predictions, live odds, and arbitrage tools. Find the edge. Informational only. 18+.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OddsAway — Data-Driven Sports Betting Analytics",
    template: "%s · OddsAway",
  },
  description: DESCRIPTION,
  applicationName: "OddsAway",
  keywords: ["sports betting analytics", "+EV bets", "betting predictions", "odds comparison", "arbitrage"],
  openGraph: {
    title: "OddsAway — Find the edge. Bet with numbers, not vibes.",
    description: DESCRIPTION,
    siteName: "OddsAway",
    type: "website",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image", title: "OddsAway", description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans">
        {/* Fixed mesh-gradient backdrop */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-mesh" aria-hidden />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(16,185,129,0.08),transparent_45%)]" aria-hidden />
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
