import Link from "next/link";
import type { PostMetadata } from "@/lib/posts";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PostCard({
  slug,
  title,
  date,
  summary,
  tags,
}: PostMetadata & { slug: string }) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="block rounded-lg border border-[var(--fm-hairline)] bg-[var(--fm-surface)] p-5 transition-shadow hover:shadow-md"
    >
      <p className="mb-1 text-xs text-[var(--fm-faint)]">{formatDate(date)}</p>
      <h2 className="font-serif mb-2 text-xl font-semibold text-[var(--fm-ink)]">{title}</h2>
      <p className="mb-3 text-sm text-[var(--fm-muted)]">{summary}</p>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--fm-paper)] px-2 py-0.5 text-xs text-[var(--fm-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
