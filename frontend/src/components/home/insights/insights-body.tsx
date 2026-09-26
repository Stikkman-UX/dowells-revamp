"use client";

import { useMemo, useState } from "react";
import type { InsightsData } from "@/types/cms";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsButton } from "@/components/ui/CmsButton";

type Article = InsightsData["articles"][number];

type InsightsBodyProps = {
  heading: string;
  allLabel: string;
  filterTags: string[];
  articles: Article[];
};

/**
 * Heading + filter chips + article grid live together so the filter can
 * drive the grid's visibility from shared state. Every article is always
 * present in the rendered HTML (SEO); filtering only toggles a `hidden`
 * class, it never removes/refetches articles.
 */
export default function InsightsBody({ heading, allLabel, filterTags, articles }: InsightsBodyProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const visibleCount = useMemo(() => {
    if (!activeTag) return articles.length;
    return articles.filter((article) => article.tag.toLowerCase() === activeTag.toLowerCase()).length;
  }, [activeTag, articles]);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="max-w-[42rem] text-[2rem] font-semibold leading-tight tracking-tight text-ink lg:text-[2.625rem]">
          {heading}
        </h2>

        <div className="flex w-fit shrink-0 flex-wrap gap-1 rounded-full bg-grey-50 p-1">
          <button
            type="button"
            aria-pressed={activeTag === null}
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              activeTag === null ? "bg-brand text-white" : "text-grey-600 hover:text-ink"
            }`}
          >
            {allLabel}
          </button>
          {filterTags.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={activeTag === tag}
              onClick={() => setActiveTag(tag)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                activeTag === tag ? "bg-brand text-white" : "text-grey-600 hover:text-ink"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {visibleCount} {visibleCount === 1 ? "article" : "articles"} shown
      </p>

      {visibleCount === 0 ? (
        <p className="mt-[3.125rem] text-sm text-grey-500">
          No articles tagged “{activeTag}” yet — check back soon.
        </p>
      ) : (
        <div className="mt-[3.125rem] grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => {
            const visible = !activeTag || article.tag.toLowerCase() === activeTag.toLowerCase();
            return (
              <article key={article.title} className={visible ? "flex flex-col gap-4" : "hidden"}>
                <div className="relative aspect-[411/296] w-full overflow-hidden rounded-2xl bg-grey-100">
                  <CmsMedia
                    media={article.image}
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <div className="flex items-center gap-3">
                  {article.tag && (
                    <span className="rounded-full bg-[#fff5f5] px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-brand">
                      {article.tag}
                    </span>
                  )}
                  <span className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-grey-500">
                    {article.dateLabel}
                  </span>
                </div>
                <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-ink">
                  {article.title}
                </h3>
                <CmsButton button={article.button} variant="accentLink" size="sm" />
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
