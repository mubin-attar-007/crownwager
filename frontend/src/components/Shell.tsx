"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OddsBot from "@/components/OddsBot";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

const MARKETING = (path: string) =>
  path === "/" ||
  path.startsWith("/login") ||
  path.startsWith("/register") ||
  path.startsWith("/terms") ||
  path.startsWith("/privacy");

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  // Close the mobile drawer on route change.
  useEffect(() => setDrawer(false), [pathname]);

  if (MARKETING(pathname)) {
    return (
      <>
        <Navbar />
        <main className="container-x min-h-[70vh] py-10">{children}</main>
        <Footer />
        <OddsBot />
      </>
    );
  }

  // App shell: sidebar command-center.
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setDrawer(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <div className="border-t border-white/[0.06] px-6 py-4 text-center text-xs text-slate-600">
          18+ · Informational only · Not financial advice · Please bet responsibly · 1-800-GAMBLER
        </div>
      </div>
    </div>
  );
}
