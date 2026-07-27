"use client";

import { useEffect, useRef, useState } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import type { InfoCardContent } from "@/lib/content";
import RoughRect from "./RoughRect";

export type DetailNodeData = {
  content: InfoCardContent;
  closing?: boolean;
};

export type DetailNodeType = Node<DetailNodeData, "detail">;

const DETAIL_WIDTH = 320;

export default function DetailNode({ data }: NodeProps<DetailNodeType>) {
  const { title, body, links } = data.content;
  const [entered, setEntered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setHeight(el.offsetHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative text-zinc-900 transition-opacity duration-150 ease-out"
      style={{ width: DETAIL_WIDTH, opacity: data.closing || !entered ? 0 : 1 }}
    >
      {height > 0 && <RoughRect width={DETAIL_WIDTH} height={height} fill="#fff9db" />}
      <div ref={contentRef} className="relative z-10 p-6">
        <h3 className="font-ugly mb-3 text-3xl">{title}</h3>
        {body.map((paragraph) => (
          <p key={paragraph} className="mb-3 whitespace-pre-line text-sm text-zinc-700">
            {paragraph}
          </p>
        ))}
        {links && links.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="nodrag text-sm text-blue-700 underline decoration-2 underline-offset-2 hover:text-blue-900"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
