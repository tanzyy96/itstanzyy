import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getPostSlugs,
  getPostMetadata,
  getPostHeadings,
  getPostBody,
  estimateReadingMinutes,
} from "@/lib/posts";
import ChapterSidebar from "@/components/blog/ChapterSidebar";
import AuthorByline from "@/components/blog/AuthorByline";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  if (!getPostSlugs().includes(slug)) return {};
  const meta = await getPostMetadata(slug);
  return { title: `${meta.title} — Blog`, description: meta.summary };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  if (!getPostSlugs().includes(slug)) notFound();

  const { default: Post, metadata } = await import(`@/content/blog/${slug}.mdx`);
  const headings = getPostHeadings(slug);
  const body = getPostBody(slug);
  const readingMinutes = estimateReadingMinutes(body);

  return (
    <main className="min-h-dvh bg-[var(--fm-paper)] px-6 py-16 text-[var(--fm-ink)]">
      <div className="mx-auto flex max-w-5xl items-start gap-12">
        <div className="min-w-0 max-w-2xl flex-1">
          <Link
            href="/blog"
            className="mb-8 inline-block text-sm text-[var(--fm-muted)] hover:text-[var(--fm-ink)]"
          >
            ← All posts
          </Link>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--fm-accent)]">
            Article · {readingMinutes} min read
          </p>
          <h1 className="font-serif mb-4 text-4xl font-semibold text-[var(--fm-ink)]">
            {metadata.title}
          </h1>
          <p className="text-lg text-[var(--fm-muted)]">{metadata.summary}</p>

          <div className="border-t border-[var(--fm-hairline)]">
            <AuthorByline name="Zhi Yang Tan" date={metadata.date} />
          </div>
          <div className="mb-8 border-t border-[var(--fm-hairline)]" />

          <article>
            <Post />
          </article>
        </div>
        <ChapterSidebar headings={headings} markdown={body} />
      </div>
    </main>
  );
}
