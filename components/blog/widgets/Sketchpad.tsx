"use client";

import "@excalidraw/excalidraw/index.css";
import dynamic from "next/dynamic";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false },
);

export default function Sketchpad({
  prompt = "Doodle here — it's your canvas too",
  height = 320,
}: {
  prompt?: string;
  height?: number;
}) {
  return (
    <div className="sketchy-card my-6 overflow-hidden bg-white">
      <div style={{ height, width: "100%", position: "relative" }}>
        <Excalidraw
          theme="light"
          detectScroll={false}
          autoFocus={false}
          initialData={{ appState: { viewBackgroundColor: "#ffffff" } }}
          UIOptions={{
            canvasActions: {
              export: false,
              saveToActiveFile: false,
              saveAsImage: false,
              loadScene: false,
              toggleTheme: false,
              changeViewBackgroundColor: false,
            },
          }}
        />
      </div>
      <p className="border-t-2 border-zinc-900 px-4 py-2 text-center text-xs text-zinc-500">
        {prompt}
      </p>
    </div>
  );
}
