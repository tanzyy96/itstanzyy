"use client";

import { useEffect, useRef } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import rough from "roughjs";

export type PetMood = "idle" | "walking" | "excited";

export type PetNodeData = {
  mood: PetMood;
  facing: 1 | -1;
};

export type PetNodeType = Node<PetNodeData, "pet">;

const SIZE = 34;
const PAD = 16;
const CANVAS = SIZE + PAD * 2;

export default function PetNode({ data }: NodeProps<PetNodeType>) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.innerHTML = "";
    const rc = rough.svg(svg);
    const cx = CANVAS / 2;
    const bodyTop = PAD + 6;

    const legL = rc.line(cx - 9, bodyTop + SIZE - 8, cx - 15, bodyTop + SIZE + 6, {
      stroke: "#1e1e1e",
      strokeWidth: 1.5,
      roughness: 1.6,
    });
    const legR = rc.line(cx + 9, bodyTop + SIZE - 8, cx + 15, bodyTop + SIZE + 6, {
      stroke: "#1e1e1e",
      strokeWidth: 1.5,
      roughness: 1.6,
    });
    const antennaeL = rc.line(cx - 5, bodyTop + 2, cx - 11, bodyTop - 10, {
      stroke: "#1e1e1e",
      strokeWidth: 1.5,
      roughness: 1.6,
    });
    const antennaeR = rc.line(cx + 5, bodyTop + 2, cx + 11, bodyTop - 10, {
      stroke: "#1e1e1e",
      strokeWidth: 1.5,
      roughness: 1.6,
    });
    const body = rc.ellipse(cx, bodyTop + SIZE / 2, SIZE, SIZE - 6, {
      fill: "#ffd43b",
      fillStyle: "hachure",
      hachureGap: 3,
      stroke: "#1e1e1e",
      strokeWidth: 1.5,
      roughness: 1.7,
    });

    svg.appendChild(legL);
    svg.appendChild(legR);
    svg.appendChild(antennaeL);
    svg.appendChild(antennaeR);
    svg.appendChild(body);

    const ns = "http://www.w3.org/2000/svg";
    const eyeL = document.createElementNS(ns, "circle");
    eyeL.setAttribute("cx", String(cx - 6));
    eyeL.setAttribute("cy", String(bodyTop + SIZE / 2 - 2));
    eyeL.setAttribute("r", "1.8");
    eyeL.setAttribute("fill", "#1e1e1e");
    const eyeR = document.createElementNS(ns, "circle");
    eyeR.setAttribute("cx", String(cx + 6));
    eyeR.setAttribute("cy", String(bodyTop + SIZE / 2 - 2));
    eyeR.setAttribute("r", "1.8");
    eyeR.setAttribute("fill", "#1e1e1e");
    svg.appendChild(eyeL);
    svg.appendChild(eyeR);
  }, []);

  return (
    <div style={{ width: CANVAS, height: CANVAS, transform: data.facing === -1 ? "scaleX(-1)" : undefined }}>
      <div className={`pet-critter pet-${data.mood}`}>
        <svg ref={svgRef} width={CANVAS} height={CANVAS} style={{ overflow: "visible" }} />
      </div>
    </div>
  );
}
