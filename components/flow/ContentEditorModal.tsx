"use client";

import { useState } from "react";
import { INFO_CARDS, type InfoCardContent, type InfoCardId, type InfoCardLink } from "@/lib/content";

const CARD_IDS: InfoCardId[] = ["about", "projects", "contact"];

export default function ContentEditorModal({ onClose }: { onClose: () => void }) {
  const [cards, setCards] = useState<Record<InfoCardId, InfoCardContent>>(() =>
    JSON.parse(JSON.stringify(INFO_CARDS)),
  );
  const [activeTab, setActiveTab] = useState<InfoCardId>("about");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const active = cards[activeTab];

  function updateActive(patch: Partial<InfoCardContent>) {
    setCards((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], ...patch } }));
  }

  function updateParagraph(index: number, value: string) {
    const body = [...active.body];
    body[index] = value;
    updateActive({ body });
  }

  function updateLink(index: number, patch: Partial<InfoCardLink>) {
    const links = [...(active.links ?? [])];
    links[index] = { ...links[index], ...patch };
    updateActive({ links });
  }

  async function handleSave() {
    setStatus("saving");
    try {
      const res = await fetch("/api/studio/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-md border-2 border-zinc-900 bg-white p-6 text-zinc-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Content</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-zinc-500 hover:text-zinc-900"
          >
            ×
          </button>
        </div>

        <div className="mb-4 flex gap-2 border-b border-zinc-200 pb-3">
          {CARD_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`rounded px-3 py-1 text-sm capitalize ${
                activeTab === id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
              }`}
            >
              {id}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs text-zinc-500">Title</label>
        <input
          type="text"
          value={active.title}
          onChange={(e) => updateActive({ title: e.target.value })}
          className="mb-4 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
        />

        <label className="mb-1 block text-xs text-zinc-500">Body paragraphs</label>
        {active.body.map((paragraph, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <textarea
              value={paragraph}
              onChange={(e) => updateParagraph(i, e.target.value)}
              rows={2}
              className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => updateActive({ body: active.body.filter((_, idx) => idx !== i) })}
              className="text-zinc-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => updateActive({ body: [...active.body, ""] })}
          className="mb-4 text-sm text-blue-700 hover:underline"
        >
          + Add paragraph
        </button>

        <label className="mb-1 block text-xs text-zinc-500">Links</label>
        {(active.links ?? []).map((link, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input
              type="text"
              placeholder="Label"
              value={link.label}
              onChange={(e) => updateLink(i, { label: e.target.value })}
              className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm"
            />
            <input
              type="text"
              placeholder="https://..."
              value={link.url}
              onChange={(e) => updateLink(i, { url: e.target.value })}
              className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() =>
                updateActive({ links: (active.links ?? []).filter((_, idx) => idx !== i) })
              }
              className="text-zinc-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => updateActive({ links: [...(active.links ?? []), { label: "", url: "" }] })}
          className="mb-4 block text-sm text-blue-700 hover:underline"
        >
          + Add link
        </button>

        <div className="flex items-center gap-3 border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving"}
            className="rounded-md border-2 border-zinc-900 bg-white px-4 py-2 text-sm font-medium shadow hover:bg-zinc-100 disabled:opacity-50"
          >
            {status === "saving" ? "Saving…" : "Save Content"}
          </button>
          {status === "saved" && <span className="text-sm text-zinc-600">Saved</span>}
          {status === "error" && <span className="text-sm text-red-600">Save failed</span>}
        </div>
      </div>
    </div>
  );
}
