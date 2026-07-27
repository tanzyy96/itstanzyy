import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/blog/PostCard";

export const metadata: Metadata = {
  title: "Blog — Zhi Yang Tan",
  description: "Tech writeups.",
};

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-dvh bg-[var(--fm-paper)] px-6 py-16 text-[var(--fm-ink)]">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-[var(--fm-muted)] hover:text-[var(--fm-ink)]"
        >
          ← Back to the desk
        </Link>
        <header className="mb-10 border-b border-[var(--fm-hairline)] pb-8">
          <h1 className="font-serif mb-3 text-4xl font-semibold text-[var(--fm-ink)]">Tech Blog</h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--fm-muted)]">
            Writeups from digging into how things actually work — mostly distributed systems,
            usually by rebuilding something that already exists.
          </p>
          <p className="mt-4 text-xs text-[var(--fm-faint)]">
            {posts.length} post{posts.length === 1 ? "" : "s"}
          </p>
        </header>

        <div>
          {posts.map((post) => (
            <PostCard key={post.slug} {...post} />
          ))}
        </div>
      </div>
    </main>
  );
}
