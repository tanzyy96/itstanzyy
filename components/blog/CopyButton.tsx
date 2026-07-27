"use client";

import { useState } from "react";

export default function CopyButton({
  text,
  label,
  variant = "outline",
}: {
  text?: string;
  label: string;
  variant?: "solid" | "outline";
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleClick() {
    const value = text ?? window.location.href;
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      // Both variants are quiet. The solid one used to be a near-black block,
      // which made a utility action the highest-contrast thing on a reading
      // page — it out-shouted the article it sits next to.
      className={`w-full rounded-md px-3 py-1.5 text-[13px] transition-colors ${
        variant === "solid"
          ? "border border-[var(--fm-hairline)] bg-[var(--fm-surface)] font-medium text-[var(--fm-ink)] hover:border-[var(--fm-faint)]"
          : "border border-transparent text-[var(--fm-muted)] hover:border-[var(--fm-hairline)] hover:text-[var(--fm-ink)]"
      }`}
    >
      {status === "copied" ? "Copied!" : status === "error" ? "Couldn't copy" : label}
    </button>
  );
}
