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
      className={`w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        variant === "solid"
          ? "bg-[var(--fm-ink)] text-[var(--fm-paper)] hover:opacity-90"
          : "border border-[var(--fm-hairline)] text-[var(--fm-ink)] hover:bg-[var(--fm-surface)]"
      }`}
    >
      {status === "copied" ? "Copied!" : status === "error" ? "Couldn't copy" : label}
    </button>
  );
}
