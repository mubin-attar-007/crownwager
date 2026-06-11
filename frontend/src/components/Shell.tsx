"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CrownBot from "@/components/CrownBot";
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
  const panelRef = useRef<HTMLDivElement>(null);

  // Close the mobile drawer on route change.
  useEffect(() => setDrawer(false), [pathname]);

  // Drawer focus management: focus the panel, trap Tab, close on Escape, restore focus.
  useEffect(() => {
    if (!drawer) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawer(false);
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = panel.querySelectorAll<HTMLElement>("a, button");
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [drawer]);

  if (MARKETING(pathname)) {
    return (
      <>
        <a href="#main" className="skip-link">Skip to main content</a>
        <Navbar />
        <main id="main" tabIndex={-1} className="container-x min-h-[70vh] py-10">{children}</main>
        <Footer />
        <CrownBot />
      </>
    );
  }

  // App shell: sidebar command-center.
  return (
    <div className="flex min-h-screen">
      <a href="#main" className="skip-link">Skip to main content</a>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            tabIndex={-1}
            className="absolute left-0 top-0 h-full"
          >
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setDrawer(true)} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <div className="border-t border-white/[0.06] px-6 py-4 text-center text-xs text-slate-600">
          18+ · Informational only · Not financial advice · Please bet responsibly · 1-800-GAMBLER
        </div>
      </div>
    </div>
  );
}
