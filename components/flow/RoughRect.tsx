"use client";

import { useEffect, useRef } from "react";
import rough from "roughjs";

type RoughRectProps = {
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  roughness?: number;
  fillStyle?: string;
  strokeWidth?: number;
};

export default function RoughRect({
  width,
  height,
  fill,
  stroke = "#1e1e1e",
  roughness = 1.6,
  fillStyle = "hachure",
  strokeWidth = 2,
}: RoughRectProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || width <= 0 || height <= 0) return;
    svg.innerHTML = "";
    const rc = rough.svg(svg);
    const pad = strokeWidth;
    const node = rc.rectangle(pad, pad, width - pad * 2, height - pad * 2, {
      fill,
      fillStyle,
      stroke,
      strokeWidth,
      roughness,
    });
    svg.appendChild(node);
  }, [width, height, fill, stroke, roughness, fillStyle, strokeWidth]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="absolute inset-0"
      style={{ pointerEvents: "none" }}
    />
  );
}
