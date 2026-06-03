"use client";

import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { Empty, ErrorState, Loading, SectionHeading } from "@/components/ui";
import type { Article, Paginated } from "@/lib/types";

export default function LearnPage() {
  const { data, loading, error } = useApi<Paginated<Article>>("/articles/");

  return (
    <div>
      <SectionHeading
        eyebrow="Sharpen up"
        title="Learn"
        subtitle="News, analysis, and Betting-101 guides."
      />

      {loading && <Loading />}
      {error && <ErrorState message={error} />}
      {data && data.results.length === 0 && (
        <Empty label="No articles yet — add some in the Django admin." />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {data?.results.map((a) => (
          <Link key={a.id} href={`/learn/${a.slug}`} className="card card-hover group flex flex-col">
            <span className={`badge w-fit ${a.category === "guide" ? "bg-ice-500/15 text-ice-400" : "bg-brand-500/15 text-brand-300"}`}>
              {a.category === "guide" ? "Betting 101" : "News"}
            </span>
            <h2 className="mt-3 text-lg font-bold text-white">{a.title}</h2>
            <p className="mt-2 flex-1 text-sm text-slate-400">{a.summary}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-brand-300 transition group-hover:translate-x-1">
              Read →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
