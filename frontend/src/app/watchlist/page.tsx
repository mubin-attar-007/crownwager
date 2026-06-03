"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import SavedBets from "@/components/SavedBets";
import { Empty, Loading, SectionHeading } from "@/components/ui";

export default function WatchlistPage() {
  const { user, loading } = useAuth();

  return (
    <div>
      <SectionHeading
        eyebrow="Tracked"
        title="Watchlist"
        subtitle="Your saved picks. Save more from the Best Bets page."
      />
      {loading ? (
        <Loading />
      ) : user ? (
        <SavedBets />
      ) : (
        <Empty label="Log in to save and track picks." />
      )}
      {!loading && !user && (
        <div className="mt-3">
          <Link href="/login" className="btn-primary">Log in</Link>
        </div>
      )}
    </div>
  );
}
