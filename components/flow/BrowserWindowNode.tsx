"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";

export type BrowserWindowNodeData = {
  url: string;
  closing?: boolean;
  onClose: () => void;
};

export type BrowserWindowNodeType = Node<BrowserWindowNodeData, "browser">;

export const DEFAULT_BROWSER_WIDTH = 960;
export const DEFAULT_BROWSER_HEIGHT = 760;

export const BROWSER_CHROME_HANDLE = "browser-chrome-bar";

export default function BrowserWindowNode({
  data,
  width,
  height,
  selected,
}: NodeProps<BrowserWindowNodeType>) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentUrl, setCurrentUrl] = useState(data.url);
  const w = width ?? DEFAULT_BROWSER_WIDTH;
  const h = height ?? DEFAULT_BROWSER_HEIGHT;

  const readIframePath = useCallback(() => {
    try {
      const href = iframeRef.current?.contentWindow?.location.href;
      if (!href) return;
      const path = new URL(href).pathname;
      setCurrentUrl((prev) => (path === prev ? prev : path));
    } catch {
      // Cross-origin navigation inside the iframe — keep showing the last known path.
    }
  }, []);

  // The embedded pages navigate client-side (Next.js <Link>), which doesn't
  // fire the iframe's `load` event — poll the same-origin location instead
  // so the address bar tracks in-app navigation.
  useEffect(() => {
    const id = window.setInterval(readIframePath, 400);
    return () => window.clearInterval(id);
  }, [readIframePath]);

  const handleExpand = useCallback(() => {
    router.push(currentUrl);
  }, [router, currentUrl]);

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={320} minHeight={220} color="#1e1e1e" />
      <div
        className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-zinc-300 bg-white text-zinc-900 shadow-xl transition-opacity duration-150 ease-out"
        style={{ width: w, height: h, opacity: data.closing ? 0 : 1 }}
      >
        <div
          className={`${BROWSER_CHROME_HANDLE} flex shrink-0 cursor-grab items-center gap-2 border-b border-zinc-200 bg-zinc-100 px-3 py-2 active:cursor-grabbing`}
        >
          <button
            type="button"
            title="Close"
            onClick={data.onClose}
            className="nodrag h-3 w-3 rounded-full bg-[#ff5f57] hover:brightness-90"
          />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <button
            type="button"
            title="Open full page"
            onClick={handleExpand}
            className="nodrag h-3 w-3 rounded-full bg-[#28c840] hover:brightness-90"
          />
          <div className="ml-2 flex-1 truncate rounded bg-white px-2 py-0.5 text-center text-xs text-zinc-500">
            {currentUrl}
          </div>
          <button
            type="button"
            onClick={handleExpand}
            title="Expand to full page"
            className="nodrag text-xs text-zinc-400 hover:text-zinc-900"
          >
            ⤢
          </button>
        </div>
        <iframe
          ref={iframeRef}
          src={data.url}
          onLoad={readIframePath}
          className="nodrag nowheel w-full flex-1"
          title="Article preview"
        />
      </div>
    </>
  );
}
