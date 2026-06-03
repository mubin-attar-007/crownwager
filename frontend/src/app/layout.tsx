import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });

export const metadata: Metadata = {
  title: "OddsAway — Data-Driven Sports Betting Analytics",
  description:
    "Best bets, ML model predictions, live odds, and arbitrage tools. Find the edge. Informational only. 18+.",
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
