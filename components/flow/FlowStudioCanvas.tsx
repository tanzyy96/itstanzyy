"use client";

import "@xyflow/react/dist/style.css";
import { useMemo, useState } from "react";
import { ReactFlow, Background, BackgroundVariant, Controls, useNodesState } from "@xyflow/react";
import { buildInitialFlowNodes, type FlowLayoutNode } from "@/lib/flowScene";
import CardNode, { DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT, type CardNodeType } from "./CardNode";
import TextNode, { type TextNodeType } from "./TextNode";
import { FlowEditableProvider } from "./FlowEditableContext";
import ContentEditorModal from "./ContentEditorModal";

const nodeTypes = { card: CardNode, text: TextNode };
const COLOR_SWATCHES = ["#ffec99", "#a5d8ff", "#b2f2bb", "#eebefa", "#ffc9c9", "#ffffff"];
const STROKE_SWATCHES = ["#1e1e1e", "#495057", "#b04a30", "#1971c2", "#2f9e44"];
const FILL_STYLES = ["hachure", "cross-hatch", "solid"];

let addCounter = 0;

export default function FlowStudioCanvas({ postCount }: { postCount?: number }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowLayoutNode>(() =>
    buildInitialFlowNodes(postCount).map((n) => ({ ...n, draggable: true, selectable: true })),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [contentModalOpen, setContentModalOpen] = useState(false);

  const selectedCard = useMemo(
    () => nodes.find((n): n is CardNodeType => n.type === "card" && !!n.selected),
    [nodes],
  );
  const selectedText = useMemo(
    () => nodes.find((n): n is TextNodeType => n.type === "text" && !!n.selected),
    [nodes],
  );

  function updateSelectedCard(patch: Partial<CardNodeType["data"]>) {
    if (!selectedCard) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedCard.id ? { ...n, data: { ...n.data, ...patch } } : n)),
    );
  }

  function updateSelectedText(patch: Partial<TextNodeType["data"]>) {
    if (!selectedText) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedText.id ? { ...n, data: { ...n.data, ...patch } } : n)),
    );
  }

  function deleteSelected() {
    const id = selectedCard?.id ?? selectedText?.id;
    if (!id) return;
    setNodes((prev) => prev.filter((n) => n.id !== id));
  }

  function addCard() {
    addCounter += 1;
    const id = `card-custom-${Date.now()}-${addCounter}`;
    const newCard: CardNodeType = {
      id,
      type: "card",
      position: { x: 300 + addCounter * 20, y: 300 + addCounter * 20 },
      width: DEFAULT_CARD_WIDTH,
      height: DEFAULT_CARD_HEIGHT,
      selected: true,
      data: {
        label: "New Card",
        link: "https://example.com",
        backgroundColor: COLOR_SWATCHES[0],
        isOpen: false,
      },
    };
    setNodes((prev) => [...prev.map((n) => ({ ...n, selected: false })), newCard]);
  }

  function addText() {
    addCounter += 1;
    const id = `text-custom-${Date.now()}-${addCounter}`;
    const newText: TextNodeType = {
      id,
      type: "text",
      position: { x: 300 + addCounter * 20, y: 200 + addCounter * 20 },
      selected: true,
      data: { text: "New text", size: "md" },
    };
    setNodes((prev) => [...prev.map((n) => ({ ...n, selected: false })), newText]);
  }

  async function handleSave() {
    setStatus("saving");
    const cleanNodes = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      width: n.width,
      height: n.height,
      data: n.data,
    }));
    try {
      const res = await fetch("/api/flow/save-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: cleanNodes }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <FlowEditableProvider>
      <div
        style={{ width: "100vw", height: "100dvh", background: "#fefefe", position: "relative" }}
      >
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 text-zinc-900">
          <button
            type="button"
            onClick={addCard}
            className="rounded-md border-2 border-zinc-900 bg-white px-3 py-2 text-sm font-medium shadow hover:bg-zinc-100"
          >
            + Card
          </button>
          <button
            type="button"
            onClick={addText}
            className="rounded-md border-2 border-zinc-900 bg-white px-3 py-2 text-sm font-medium shadow hover:bg-zinc-100"
          >
            + Text
          </button>
          <button
            type="button"
            onClick={() => setContentModalOpen(true)}
            className="rounded-md border-2 border-zinc-900 bg-white px-3 py-2 text-sm font-medium shadow hover:bg-zinc-100"
          >
            Edit Content
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md border-2 border-zinc-900 bg-white px-4 py-2 font-medium shadow hover:bg-zinc-100"
          >
            {status === "saving" ? "Saving…" : "Save Layout"}
          </button>
        </div>
        {status !== "idle" && (
          <span className="absolute right-4 top-16 z-10 text-sm text-zinc-600">
            {status === "saved" && "Saved to data/flow-scene.json"}
            {status === "error" && "Save failed — check the terminal"}
          </span>
        )}

        {selectedCard && (
          <div className="absolute left-4 top-4 z-10 w-72 rounded-md border-2 border-zinc-900 bg-white p-4 text-zinc-900 shadow">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Card</p>
              <button
                type="button"
                onClick={deleteSelected}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>

            <label className="mb-1 block text-xs text-zinc-500">Label</label>
            <input
              type="text"
              value={selectedCard.data.label}
              onChange={(e) => updateSelectedCard({ label: e.target.value })}
              className="mb-3 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
            />

            <label className="mb-1 block text-xs text-zinc-500">
              Link (# for spawn card, / for a page, http for external)
            </label>
            <input
              type="text"
              value={selectedCard.data.link}
              onChange={(e) => updateSelectedCard({ link: e.target.value })}
              className="mb-3 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
            />

            <p className="mb-1 text-xs text-zinc-500">Fill color</p>
            <div className="mb-3 flex gap-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateSelectedCard({ backgroundColor: color })}
                  className="h-6 w-6 rounded-full border-2"
                  style={{
                    background: color,
                    borderColor:
                      selectedCard.data.backgroundColor === color ? "#1e1e1e" : "#d4d4d8",
                  }}
                />
              ))}
            </div>

            <p className="mb-1 text-xs text-zinc-500">Stroke color</p>
            <div className="mb-3 flex gap-2">
              {STROKE_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateSelectedCard({ strokeColor: color })}
                  className="h-6 w-6 rounded-full border-2"
                  style={{
                    background: color,
                    borderColor:
                      (selectedCard.data.strokeColor ?? "#1e1e1e") === color
                        ? "#1e1e1e"
                        : "#d4d4d8",
                  }}
                />
              ))}
            </div>

            <label className="mb-1 block text-xs text-zinc-500">
              Roughness ({(selectedCard.data.roughness ?? 1.6).toFixed(1)})
            </label>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={selectedCard.data.roughness ?? 1.6}
              onChange={(e) => updateSelectedCard({ roughness: Number(e.target.value) })}
              className="mb-3 w-full"
            />

            <label className="mb-1 block text-xs text-zinc-500">Fill style</label>
            <select
              value={selectedCard.data.fillStyle ?? "hachure"}
              onChange={(e) => updateSelectedCard({ fillStyle: e.target.value })}
              className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
            >
              {FILL_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedText && (
          <div className="absolute left-4 top-4 z-10 w-72 rounded-md border-2 border-zinc-900 bg-white p-4 text-zinc-900 shadow">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Text</p>
              <button
                type="button"
                onClick={deleteSelected}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>

            <label className="mb-1 block text-xs text-zinc-500">Text</label>
            <input
              type="text"
              value={selectedText.data.text}
              onChange={(e) => updateSelectedText({ text: e.target.value })}
              className="mb-3 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
            />

            <label className="mb-1 block text-xs text-zinc-500">Size</label>
            <div className="flex gap-2">
              {(["lg", "md"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateSelectedText({ size })}
                  className={`rounded px-3 py-1 text-sm ${
                    selectedText.data.size === size
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {size === "lg" ? "Large" : "Medium"}
                </button>
              ))}
            </div>
          </div>
        )}

        <ReactFlow nodes={nodes} onNodesChange={onNodesChange} nodeTypes={nodeTypes} fitView>
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#c7c7c7" />
          <Controls />
        </ReactFlow>
      </div>
      {contentModalOpen && <ContentEditorModal onClose={() => setContentModalOpen(false)} />}
    </FlowEditableProvider>
  );
}
