"use client";

import { useEffect, useState } from "react";
import type { Benchmark } from "@/lib/benchmarks";
import { getModel } from "@/lib/benchmarks";
import AnswerMarkdown from "./AnswerMarkdown";

type Props = {
  benchmark: Benchmark;
  onClose: () => void;
};

// A fixed overlay rather than a canvas node. Answers run to ~5000 characters,
// and anything living on the canvas inherits its zoom — at a zoom that fits
// six notes plus a panel, 15px prose renders around 7px. Long-form reading
// and an infinite canvas are just at odds, so the reader steps outside it.
export default function BenchmarkReader({ benchmark, onClose }: Props) {
  // Keyed by slug so switching benchmarks falls back to the new one's first
  // answer — the previously selected model may not have answered it.
  const [selection, setSelection] = useState<{ slug: string; model: string } | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const activeModel =
    selection?.slug === benchmark.slug
      ? selection.model
      : (benchmark.responses[0]?.model ?? null);
  const active = benchmark.responses.find((r) => r.model === activeModel);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={benchmark.name}
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-zinc-900/25 backdrop-blur-[2px]"
      />

      <div className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border-2 border-zinc-900 bg-[#fffdf7] text-zinc-900 shadow-[8px_8px_0_0_rgba(24,24,27,0.85)]">
        <div className="flex items-center gap-3 border-b-2 border-zinc-900 bg-[#ffe3e3] px-6 py-4">
          <span className="font-ugly text-lg text-rose-800">{benchmark.acronym}</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-ugly truncate text-2xl leading-tight">{benchmark.name}</h2>
            <p className="truncate text-sm text-zinc-600">{benchmark.tagline}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-zinc-900 bg-white text-lg leading-none shadow hover:bg-zinc-100"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-dashed border-zinc-300 px-6 py-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              The prompt
            </p>
            {/* Line breaks preserved — some prompts embed a diff, and
                collapsing it into one run-on line makes it unreadable. */}
            <p className="whitespace-pre-line text-sm italic leading-relaxed text-zinc-700">
              {benchmark.prompt}
            </p>
          </div>

          {benchmark.notes.length > 0 && (
            <div className="space-y-1 border-b border-dashed border-zinc-300 px-6 py-3">
              {benchmark.notes.map((note) => (
                <p key={note} className="text-xs leading-relaxed text-zinc-500">
                  {note}
                </p>
              ))}
            </div>
          )}

          {benchmark.responses.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-zinc-500">
              Haven&rsquo;t run this one yet.
            </p>
          ) : (
            <>
              {/* Tabs, not a stack: one answer at full width beats six at a
                  sixth of the height, and flipping between them is as close
                  to reading side by side as this width allows. */}
              <div className="sticky top-0 z-10 flex flex-wrap gap-2 border-b border-zinc-200 bg-[#fffdf7]/95 px-6 py-3 backdrop-blur">
                {benchmark.responses.map((response) => {
                  const model = getModel(response.model);
                  const isActive = response.model === activeModel;
                  return (
                    <button
                      key={response.model}
                      onClick={() =>
                        setSelection({ slug: benchmark.slug, model: response.model })
                      }
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors ${
                        isActive
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-500"
                      }`}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: model?.color ?? "#ccc" }}
                      />
                      {model?.name ?? response.model}
                    </button>
                  );
                })}
              </div>

              {active && (
                <div className="px-6 pb-8 pt-4">
                  <p className="mb-3 text-xs text-zinc-400">
                    {active.text.length.toLocaleString()} characters
                  </p>
                  <AnswerMarkdown>{active.text}</AnswerMarkdown>
                  {active.note && (
                    <p className="mt-5 border-t border-dashed border-zinc-300 pt-3 text-xs italic text-zinc-500">
                      {active.note}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
