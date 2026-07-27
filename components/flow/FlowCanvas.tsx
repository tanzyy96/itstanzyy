"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  type NodeMouseHandler,
  type ReactFlowInstance,
} from "@xyflow/react";
import { INFO_CARDS, type InfoCardContent } from "@/lib/content";
import { getBenchmarks } from "@/lib/benchmarks";
import { buildInitialFlowNodes, type FlowLayoutNode } from "@/lib/flowScene";
import CardNode, { DEFAULT_CARD_WIDTH, type CardNodeType } from "./CardNode";
import DetailNode, { type DetailNodeType } from "./DetailNode";
import TextNode, { type TextNodeType } from "./TextNode";
import PetNode, { type PetMood, type PetNodeType } from "./PetNode";
import BrowserWindowNode, {
  BROWSER_CHROME_HANDLE,
  DEFAULT_BROWSER_HEIGHT,
  DEFAULT_BROWSER_WIDTH,
  type BrowserWindowNodeType,
} from "./BrowserWindowNode";
import BenchmarkNode, {
  BENCHMARK_NODE_WIDTH,
  type BenchmarkNodeType,
} from "./BenchmarkNode";
import BenchmarkReader from "./BenchmarkReader";
import type { Benchmark } from "@/lib/benchmarks";

const nodeTypes = {
  card: CardNode,
  detail: DetailNode,
  text: TextNode,
  pet: PetNode,
  browser: BrowserWindowNode,
  benchmark: BenchmarkNode,
};
const CLOSE_DURATION = 180;
const DETAIL_GAP = 60;
// Benchmark notes fan out in a grid. A single row reads better but goes so
// wide that fitView zooms them to illegibility, so they wrap instead — and
// the row pitch leaves room for one to expand without hitting the note below.
const BENCHMARK_COLUMNS = 3;
const BENCHMARK_GAP = 40;
// Tall enough that a note expanded to its full height (header + prompt +
// the 300px scrolling answer area) still clears the note in the row below.
const BENCHMARK_ROW_PITCH = 700;
const BENCHMARK_PREFIX = "benchmark-";
const BENCHMARK_INTRO_PREFIX = "benchmark-intro-";

// Everything the benchmarks card spawns — the notes plus their heading —
// so opening and closing treat the whole cluster as one unit.
function isBenchmarkSpawn(node: FlowNode): boolean {
  return node.type === "benchmark" || node.id.startsWith(BENCHMARK_INTRO_PREFIX);
}
const PET_ID = "desk-pet";
const MOVE_DURATION = 1300;
const WANDER_MIN_DELAY = 3000;
const WANDER_MAX_DELAY = 6000;

type SpawnableCardId = keyof typeof INFO_CARDS;
type FlowNode =
  | FlowLayoutNode
  | DetailNodeType
  | PetNodeType
  | BrowserWindowNodeType
  | BenchmarkNodeType;

export default function FlowCanvas({ postCount }: { postCount?: number }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(
    buildInitialFlowNodes(postCount),
  );
  // Captured via onInit rather than useReactFlow(), since this component
  // renders the <ReactFlow> provider itself and so sits outside its context.
  const flowRef = useRef<ReactFlowInstance<FlowNode> | null>(null);
  // The reader lives outside the node graph so canvas zoom can't shrink it.
  const [readerBenchmark, setReaderBenchmark] = useState<Benchmark | null>(null);

  const toggleDetail = useCallback(
    (cardId: SpawnableCardId, origin: CardNodeType) => {
      const detailId = `detail-${cardId}`;
      const alreadyOpen = nodes.some((n) => n.id === detailId);

      setNodes((prev) =>
        prev.map((n) =>
          n.id === origin.id ? { ...n, data: { ...n.data, isOpen: !alreadyOpen } } : n,
        ),
      );

      if (alreadyOpen) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === detailId && n.type === "detail"
              ? { ...n, data: { ...n.data, closing: true } }
              : n,
          ),
        );
        window.setTimeout(() => {
          setNodes((prev) => prev.filter((n) => n.id !== detailId));
        }, CLOSE_DURATION);
        return;
      }

      const originWidth = origin.width ?? DEFAULT_CARD_WIDTH;
      const detailNode: DetailNodeType = {
        id: detailId,
        type: "detail",
        position: { x: origin.position.x + originWidth + DETAIL_GAP, y: origin.position.y },
        data: { content: INFO_CARDS[cardId] as InfoCardContent },
      };
      setNodes((prev) => [...prev, detailNode]);
    },
    [nodes, setNodes],
  );

  const closeBrowserWindow = useCallback(
    (originId: string, browserId: string) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === originId && n.type === "card" ? { ...n, data: { ...n.data, isOpen: false } } : n,
        ),
      );
      setNodes((prev) =>
        prev.map((n) =>
          n.id === browserId && n.type === "browser"
            ? { ...n, data: { ...n.data, closing: true } }
            : n,
        ),
      );
      window.setTimeout(() => {
        setNodes((prev) => prev.filter((n) => n.id !== browserId));
      }, CLOSE_DURATION);
    },
    [setNodes],
  );

  const toggleBrowserWindow = useCallback(
    (url: string, origin: CardNodeType) => {
      const browserId = `browser-${origin.id}`;
      const alreadyOpen = nodes.some((n) => n.id === browserId);

      if (alreadyOpen) {
        closeBrowserWindow(origin.id, browserId);
        return;
      }

      setNodes((prev) =>
        prev.map((n) =>
          n.id === origin.id && n.type === "card" ? { ...n, data: { ...n.data, isOpen: true } } : n,
        ),
      );

      const originWidth = origin.width ?? DEFAULT_CARD_WIDTH;
      const browserNode: BrowserWindowNodeType = {
        id: browserId,
        type: "browser",
        position: { x: origin.position.x + originWidth + DETAIL_GAP, y: origin.position.y },
        width: DEFAULT_BROWSER_WIDTH,
        height: DEFAULT_BROWSER_HEIGHT,
        dragHandle: `.${BROWSER_CHROME_HANDLE}`,
        data: { url, onClose: () => closeBrowserWindow(origin.id, browserId) },
      };
      setNodes((prev) => [...prev, browserNode]);
    },
    [nodes, setNodes, closeBrowserWindow],
  );

  // Spawns every benchmark as its own note on the canvas. Clicking the card
  // again clears them all; clicking an individual note loads it into the
  // shared reader panel.
  const toggleBenchmarks = useCallback(
    (origin: CardNodeType) => {
      const alreadyOpen = nodes.some((n) => n.type === "benchmark");

      setNodes((prev) =>
        prev.map((n) =>
          n.id === origin.id && n.type === "card"
            ? { ...n, data: { ...n.data, isOpen: !alreadyOpen } }
            : n,
        ),
      );

      if (alreadyOpen) {
        setReaderBenchmark(null);
        setNodes((prev) =>
          prev.map((n) =>
            n.type === "benchmark" ? { ...n, data: { ...n.data, closing: true } } : n,
          ),
        );
        window.setTimeout(() => {
          setNodes((prev) => prev.filter((n) => !isBenchmarkSpawn(n)));
        }, CLOSE_DURATION);
        return;
      }

      const originWidth = origin.width ?? DEFAULT_CARD_WIDTH;
      const startX = origin.position.x + originWidth + DETAIL_GAP;
      const benchmarkNodes: BenchmarkNodeType[] = getBenchmarks().map((benchmark, index) => ({
        id: `${BENCHMARK_PREFIX}${benchmark.slug}`,
        type: "benchmark",
        position: {
          x: startX + (index % BENCHMARK_COLUMNS) * (BENCHMARK_NODE_WIDTH + BENCHMARK_GAP),
          y: origin.position.y + Math.floor(index / BENCHMARK_COLUMNS) * BENCHMARK_ROW_PITCH,
        },
        data: { benchmark, active: false },
      }));

      // A soft heading above the grid, in the same handwriting as the page
      // header — enough to explain the bit to someone arriving cold.
      const intro: TextNodeType[] = [
        {
          id: `${BENCHMARK_INTRO_PREFIX}title`,
          type: "text",
          position: { x: startX, y: origin.position.y - 120 },
          draggable: false,
          selectable: false,
          data: { text: "My Stupid LLM Benchmarks", size: "lg" },
        },
        {
          id: `${BENCHMARK_INTRO_PREFIX}subtitle`,
          type: "text",
          position: { x: startX, y: origin.position.y - 60 },
          draggable: false,
          selectable: false,
          data: {
            text: "Silly prompts I give to LLMs, and the answers they gave back — click a note to read them",
            size: "md",
          },
        },
      ];

      setNodes((prev) => [...prev, ...intro, ...benchmarkNodes]);
      // They land off to the right of the viewport, so pull the camera out
      // to include them rather than leaving the visitor to go hunting.
      window.setTimeout(() => {
        flowRef.current?.fitView({ duration: 400, padding: 0.12 });
      }, 60);
    },
    [nodes, setNodes],
  );

  const closeReader = useCallback(() => {
    setReaderBenchmark(null);
    setNodes((prev) =>
      prev.map((n) => (n.type === "benchmark" ? { ...n, data: { ...n.data, active: false } } : n)),
    );
  }, [setNodes]);

  const openReader = useCallback(
    (benchmarkNodeId: string) => {
      const origin = nodes.find((n) => n.id === benchmarkNodeId);
      if (!origin || origin.type !== "benchmark") return;

      setReaderBenchmark(origin.data.benchmark);
      setNodes((prev) =>
        prev.map((n) =>
          n.type === "benchmark"
            ? { ...n, data: { ...n.data, active: n.id === benchmarkNodeId } }
            : n,
        ),
      );
    },
    [nodes, setNodes],
  );

  const handleNodeClick: NodeMouseHandler<FlowNode> = useCallback(
    (_event, node) => {
      if (node.type === "benchmark") {
        openReader(node.id);
        return;
      }
      if (node.type !== "card") return;
      const link = node.data.link;

      if (link === "#benchmarks") {
        toggleBenchmarks(node as CardNodeType);
        return;
      }
      if (link.startsWith("/")) {
        toggleBrowserWindow(link, node as CardNodeType);
        return;
      }
      if (link.startsWith("#")) {
        const cardId = link.slice(1) as SpawnableCardId;
        if (cardId in INFO_CARDS) {
          toggleDetail(cardId, node as CardNodeType);
        }
        return;
      }
      if (link.startsWith("http")) {
        window.open(link, "_blank", "noopener,noreferrer");
      }
    },
    [toggleDetail, toggleBrowserWindow, toggleBenchmarks, openReader],
  );

  // --- Desk pet: a small critter that idly wanders the canvas and hops up
  // to say hi whenever a visitor hovers a card. ---
  const nodesRef = useRef<FlowNode[]>(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const petPosRef = useRef({ x: 0, y: 0 });
  const hoveredCardIdRef = useRef<string | null>(null);
  const moveTimeoutRef = useRef<number | null>(null);
  const wanderTimeoutRef = useRef<number | null>(null);

  const movePet = useCallback(
    (target: { x: number; y: number }, mood: PetMood, settleMood: PetMood = "idle") => {
      const from = petPosRef.current;
      const facing: 1 | -1 = target.x >= from.x ? 1 : -1;
      petPosRef.current = target;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === PET_ID && n.type === "pet" ? { ...n, position: target, data: { mood, facing } } : n,
        ),
      );

      if (moveTimeoutRef.current) window.clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = window.setTimeout(() => {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === PET_ID && n.type === "pet"
              ? { ...n, data: { ...n.data, mood: hoveredCardIdRef.current ? "excited" : settleMood } }
              : n,
          ),
        );
      }, MOVE_DURATION);
    },
    [setNodes],
  );

  const wander = useCallback(() => {
    if (hoveredCardIdRef.current) return;
    const contentNodes = nodesRef.current.filter((n) => n.type === "card" || n.type === "text");
    if (contentNodes.length === 0) return;

    const xs = contentNodes.map((n) => n.position.x);
    const ys = contentNodes.map((n) => n.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) + 220;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) + 140;

    const target = {
      x: minX + Math.random() * Math.max(1, maxX - minX - 60),
      y: minY + Math.random() * Math.max(1, maxY - minY - 60),
    };
    movePet(target, "walking");
  }, [movePet]);

  useEffect(() => {
    const firstCard = nodesRef.current.find((n) => n.type === "card");
    const start = firstCard
      ? { x: firstCard.position.x + 40, y: firstCard.position.y + 160 }
      : { x: 200, y: 400 };
    petPosRef.current = start;
    const petNode: PetNodeType = {
      id: PET_ID,
      type: "pet",
      position: start,
      draggable: false,
      selectable: false,
      focusable: false,
      data: { mood: "idle", facing: 1 },
    };
    setNodes((prev) => [...prev, petNode]);

    function scheduleWander() {
      const delay = WANDER_MIN_DELAY + Math.random() * (WANDER_MAX_DELAY - WANDER_MIN_DELAY);
      wanderTimeoutRef.current = window.setTimeout(() => {
        wander();
        scheduleWander();
      }, delay);
    }
    scheduleWander();

    return () => {
      if (wanderTimeoutRef.current) window.clearTimeout(wanderTimeoutRef.current);
      if (moveTimeoutRef.current) window.clearTimeout(moveTimeoutRef.current);
    };
    // Runs once on mount — the wander loop reads live positions via nodesRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNodeMouseEnter: NodeMouseHandler<FlowNode> = useCallback(
    (_event, node) => {
      if (node.type !== "card") return;
      hoveredCardIdRef.current = node.id;
      const width = node.width ?? DEFAULT_CARD_WIDTH;
      movePet(
        { x: node.position.x + width / 2 - 25, y: node.position.y - 50 },
        "excited",
        "excited",
      );
    },
    [movePet],
  );

  const handleNodeMouseLeave: NodeMouseHandler<FlowNode> = useCallback(
    (_event, node) => {
      if (node.type !== "card" || hoveredCardIdRef.current !== node.id) return;
      hoveredCardIdRef.current = null;
      if (moveTimeoutRef.current) window.clearTimeout(moveTimeoutRef.current);
      setNodes((prev) =>
        prev.map((n) =>
          n.id === PET_ID && n.type === "pet" ? { ...n, data: { ...n.data, mood: "idle" } } : n,
        ),
      );
    },
    [setNodes],
  );

  return (
    <div style={{ width: "100vw", height: "100dvh", background: "#fefefe" }}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          flowRef.current = instance;
        }}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#c7c7c7" />
        <Controls />
      </ReactFlow>

      {readerBenchmark && (
        <BenchmarkReader benchmark={readerBenchmark} onClose={closeReader} />
      )}
    </div>
  );
}
