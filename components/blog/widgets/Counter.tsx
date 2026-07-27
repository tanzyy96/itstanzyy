"use client";

import { useState } from "react";

export default function Counter({ label = "Clicks" }: { label?: string }) {
  const [count, setCount] = useState(0);

  return (
    <div className="sketchy-card my-6 flex items-center gap-4 bg-white p-4">
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="rounded-md border-2 border-zinc-900 px-4 py-2 font-medium hover:bg-zinc-100"
      >
        Click me
      </button>
      <span className="text-zinc-700">
        {label}: {count}
      </span>
    </div>
  );
}
