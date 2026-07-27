"use client";

import { useEffect, useRef, useState } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import type { Benchmark } from "@/lib/benchmarks";
import RoughRect from "./RoughRect";

export type BenchmarkNodeData = {
  benchmark: Benchmark;
  /** True while this benchmark is the one loaded in the reader panel. */
  active: boolean;
  closing?: boolean;
};

export type BenchmarkNodeType = Node<BenchmarkNodeData, "benchmark">;

export const BENCHMARK_NODE_WIDTH = 360;

// A prompt card, not a container for the answers — clicking it loads the
// benchmark into the shared reader panel, which is where reading happens.
export default function BenchmarkNode({ data }: NodeProps<BenchmarkNodeType>) {
  const { benchmark, active } = data;
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
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const count = benchmark.responses.length;

  return (
    <div
      className="relative cursor-pointer text-zinc-900 transition-opacity duration-150 ease-out"
      style={{ width: BENCHMARK_NODE_WIDTH, opacity: data.closing || !entered ? 0 : 1 }}
    >
      {height > 0 && (
        <RoughRect
          width={BENCHMARK_NODE_WIDTH}
          height={height}
          fill={active ? "#ffe3e3" : "#fff0f0"}
          fillStyle="solid"
          roughness={2}
          strokeWidth={active ? 3 : 2}
        />
      )}

      <div ref={contentRef} className="relative z-10 p-5">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="font-ugly text-lg text-rose-800">{benchmark.acronym}</span>
          <span className="text-xs text-zinc-500">
            {count === 0 ? "no answers yet" : `${count} answer${count === 1 ? "" : "s"}`}
          </span>
        </div>

        <h3 className="font-ugly mb-1 text-2xl leading-tight">{benchmark.name}</h3>
        <p className="mb-3 text-sm text-zinc-600">{benchmark.tagline}</p>

        <blockquote className="mb-3 line-clamp-6 whitespace-pre-line border-l-2 border-rose-700 pl-3 text-[13px] leading-relaxed text-zinc-800">
          {benchmark.prompt}
        </blockquote>

        <p className="text-xs text-zinc-500">
          {active ? "reading →" : count === 0 ? "click to read more →" : "click to read the answers →"}
        </p>
      </div>
    </div>
  );
}
