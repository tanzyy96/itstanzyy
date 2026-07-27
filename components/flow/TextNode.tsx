"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { useFlowEditable } from "./FlowEditableContext";

export type TextNodeData = {
  text: string;
  size: "lg" | "md";
};

export type TextNodeType = Node<TextNodeData, "text">;

export default function TextNode({ data, selected }: NodeProps<TextNodeType>) {
  const editable = useFlowEditable();

  return (
    <div
      className={`font-ugly select-none whitespace-nowrap px-1 ${
        data.size === "lg" ? "text-5xl text-zinc-900" : "text-2xl text-zinc-500"
      } ${editable ? "cursor-pointer" : "pointer-events-none"} ${
        editable && selected ? "outline outline-2 outline-dashed outline-zinc-400" : ""
      }`}
    >
      {data.text}
    </div>
  );
}
