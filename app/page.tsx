import Desk from "@/components/desk/Desk";
import { getBenchmarks } from "@/lib/benchmarks";
import { getAllPosts } from "@/lib/posts";

export default async function Home() {
  const posts = await getAllPosts();
  return (
    <Desk
      posts={posts.map(({ slug, title, date, summary, readingMinutes }) => ({
        slug,
        title,
        date,
        summary,
        readingMinutes,
      }))}
      benchmarkCount={getBenchmarks().length}
    />
  );
}
