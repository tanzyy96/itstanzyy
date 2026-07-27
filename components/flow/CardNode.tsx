"use client";

import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";
import RoughRect from "./RoughRect";
import { useFlowEditable } from "./FlowEditableContext";

export type CardNodeData = {
  label: string;
  link: string;
  backgroundColor: string;
  isOpen: boolean;
  roughness?: number;
  fillStyle?: string;
  strokeColor?: string;
};

export type CardNodeType = Node<CardNodeData, "card">;

export const DEFAULT_CARD_WIDTH = 220;
export const DEFAULT_CARD_HEIGHT = 140;

export default function CardNode({ data, selected, width, height }: NodeProps<CardNodeType>) {
  const editable = useFlowEditable();
  const w = width ?? DEFAULT_CARD_WIDTH;
  const h = height ?? DEFAULT_CARD_HEIGHT;

  return (
    <>
      {editable && (
        <NodeResizer isVisible={selected} minWidth={140} minHeight={90} color="#1e1e1e" />
      )}
      <div className="font-ugly relative flex h-full w-full cursor-pointer select-none items-center justify-center text-2xl text-zinc-900 transition-transform duration-150 ease-out hover:-rotate-1 hover:scale-105 active:scale-95">
        <RoughRect
          width={w}
          height={h}
          fill={data.backgroundColor}
          stroke={data.strokeColor}
          roughness={data.roughness}
          fillStyle={data.fillStyle}
        />
        {/* Wraps so multi-word labels stay inside the card at the default width. */}
        <span className="relative z-10 px-4 text-center leading-tight">{data.label}</span>
        <span className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-900 bg-white text-sm shadow">
          {data.isOpen ? "×" : "↗"}
        </span>
      </div>
    </>
  );
}
