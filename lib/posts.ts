import fs from "node:fs";
import path from "node:path";
import { slugify } from "./slugify";

const POSTS_DIR = path.join(process.cwd(), "content/blog");

export type PostMetadata = {
  title: string;
  date: string;
  summary: string;
  tags?: string[];
};

export type PostHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

// Chapter list for the article sidebar — parsed straight from the raw
// markdown source rather than the compiled MDX tree, so it stays in sync
// with the `id`s mdx-components.tsx generates for h2/h3 via the same
// slugify() on the same plain text.
export function getPostHeadings(slug: string): PostHeading[] {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.mdx`), "utf-8");
  const headings: PostHeading[] = [];
  for (const line of raw.split("\n")) {
    const match = line.match(/^(##|###)\s+(.*)$/);
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/[*_`]/g, "").trim();
    headings.push({ id: slugify(text), text, level });
  }
  return headings;
}

// Raw MDX body (frontmatter export + imports stripped) — used both for the
// "Copy markdown" utility and to estimate reading time. Posts don't repeat
// their title as a `# heading` in the body since the page renders
// metadata.title instead.
export function getPostBody(slug: string): string {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.mdx`), "utf-8");
  return raw
    .replace(/^import .*$/gm, "")
    .replace(/export const metadata = \{[\s\S]*?\};?/, "")
    .trim();
}

export function estimateReadingMinutes(body: string): number {
  const words = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_`>-]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function getPostSlugs(): string[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export async function getPostMetadata(slug: string): Promise<PostMetadata> {
  const mod = await import(`@/content/blog/${slug}.mdx`);
  return mod.metadata;
}

export async function getAllPosts(): Promise<(PostMetadata & { slug: string })[]> {
  const slugs = getPostSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => ({ slug, ...(await getPostMetadata(slug)) })),
  );
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}
