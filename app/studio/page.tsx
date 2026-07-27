import { notFound } from "next/navigation";
import FlowStudioCanvas from "@/components/flow/FlowStudioCanvas";
import { getPostSlugs } from "@/lib/posts";

// Local-only layout editor: writes straight to data/flow-scene.json on disk,
// which doesn't work against a deployed/serverless filesystem, so it's
// disabled outside `next dev`.
export default function StudioPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const postCount = getPostSlugs().length;
  return <FlowStudioCanvas postCount={postCount} />;
}
