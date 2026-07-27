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
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-[var(--fm-muted)] hover:text-[var(--fm-ink)]"
        >
          ← Back to the desk
        </Link>
        <h1 className="font-serif mb-8 text-4xl font-semibold text-[var(--fm-ink)]">Tech Blog</h1>
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.slug} {...post} />
          ))}
        </div>
      </div>
    </main>
  );
}
