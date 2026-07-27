import FlowCanvas from "@/components/flow/FlowCanvas";
import { getPostSlugs } from "@/lib/posts";

export default function Home() {
  const postCount = getPostSlugs().length;
  return <FlowCanvas postCount={postCount} />;
}
