"use client";

import { useEffect, useState } from "react";
import type { PostHeading } from "@/lib/posts";
import CopyButton from "./CopyButton";

export default function ChapterSidebar({
  headings,
  markdown,
}: {
  headings: PostHeading[];
  markdown: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    if (headings.length === 0) return;

    // The last heading whose top has scrolled above this line is "active" —
    // simpler and less racy than IntersectionObserver, which can report
    // several headings as simultaneously intersecting during a fast scroll
    // or an anchor jump and leaves the winner up to entry order.
    const THRESHOLD = 120;

    function updateActive() {
      let current = headings[0]?.id ?? null;
      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (el && el.getBoundingClientRect().top <= THRESHOLD) {
          current = heading.id;
        }
      }
      setActiveId(current);
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    return () => window.removeEventListener("scroll", updateActive);
  }, [headings]);

  return (
    <nav className="sticky top-16 hidden max-h-[calc(100dvh-5rem)] w-64 shrink-0 overflow-y-auto lg:block">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--fm-faint)]">
        Contents
      </p>

      {headings.length > 0 && (
        <ol className="relative mb-6 border-l-2 border-[var(--fm-hairline)] text-sm">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            return (
              <li
                key={heading.id}
                className="relative pb-4 last:pb-0"
                style={{ marginLeft: heading.level === 3 ? "1.25rem" : 0 }}
              >
                <span
                  className={`absolute left-0 top-1 -translate-x-1/2 rounded-full transition-all ${
                    isActive
                      ? "h-3 w-3 border-2 border-[var(--fm-accent)] bg-[var(--fm-accent)] ring-4 ring-[var(--fm-accent)]/20"
                      : "h-2.5 w-2.5 border-2 border-[var(--fm-hairline)] bg-[var(--fm-surface)]"
                  }`}
                />
                <a
                  href={`#${heading.id}`}
                  onClick={() => setActiveId(heading.id)}
                  className={`block pl-5 transition-colors ${
                    isActive
                      ? "font-medium text-[var(--fm-accent)]"
                      : "text-[var(--fm-muted)] hover:text-[var(--fm-ink)]"
                  }`}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-col gap-2">
        <CopyButton label="Copy markdown" text={markdown} variant="solid" />
        <CopyButton label="Copy link" variant="outline" />
      </div>
    </nav>
  );
}
