import Link from "next/link";
import type { PostMetadata } from "@/lib/posts";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// A full-width row rather than a card in a grid. With only a couple of posts,
// side-by-side cards left most of the page empty and gave both entries the
// same weight; a list reads as a chronology and has room for the summary.
export default function PostCard({
  slug,
  title,
  date,
  summary,
  tags,
  readingMinutes,
}: PostMetadata & { slug: string; readingMinutes?: number }) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block border-b border-[var(--fm-hairline)] py-7 first:pt-0 last:border-b-0"
    >
      <p className="mb-2 flex items-center gap-2 text-xs text-[var(--fm-faint)]">
        <time dateTime={date}>{formatDate(date)}</time>
        {readingMinutes !== undefined && (
          <>
            <span aria-hidden="true">·</span>
            <span>{readingMinutes} min read</span>
          </>
        )}
      </p>

      <h2 className="font-serif mb-2 text-2xl font-semibold leading-snug text-[var(--fm-ink)] underline decoration-transparent decoration-2 underline-offset-4 transition-colors group-hover:decoration-[var(--fm-accent)]">
        {title}
      </h2>

      <p className="mb-3 max-w-2xl text-[15px] leading-relaxed text-[var(--fm-muted)]">{summary}</p>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--fm-hairline)] px-2 py-0.5 text-xs text-[var(--fm-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
