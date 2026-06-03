"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { ErrorState, Loading } from "@/components/ui";
import type { Article } from "@/lib/types";

export default function ArticleDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { data, loading, error } = useApi<Article>(slug ? `/articles/${slug}/` : null, [slug]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/learn" className="text-sm font-semibold text-brand-300 hover:text-brand-400">
        ← Back to Learn
      </Link>
      <span className={`badge mt-4 w-fit ${data.category === "guide" ? "bg-ice-500/15 text-ice-400" : "bg-brand-500/15 text-brand-300"}`}>
        {data.category === "guide" ? "Betting 101" : "News"}
      </span>
      <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">{data.title}</h1>
      {data.summary && <p className="mt-3 text-lg text-slate-400">{data.summary}</p>}
      <div
        className="mt-8 max-w-none leading-relaxed text-slate-300
                   [&_h4]:mt-7 [&_h4]:text-xl [&_h4]:font-bold [&_h4]:text-white
                   [&_p]:mt-3 [&_p]:text-slate-300"
        // Article bodies are authored by trusted admins via the Django admin.
        dangerouslySetInnerHTML={{ __html: data.body ?? "" }}
      />
    </article>
  );
}
