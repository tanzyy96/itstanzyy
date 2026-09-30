"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Benchmark } from "@/lib/benchmarks";
import {
  buildDeskCards,
  buildGateRounds,
  gateWinner,
  GATE_MODELS,
  modelName,
  type DeskCardDef,
  type DeskCardId,
  type GateModelId,
} from "@/lib/desk";
import BenchmarkReader from "@/components/flow/BenchmarkReader";
import BenchmarkGate from "./BenchmarkGate";
import CardBody, { type DeskPost } from "./CardBodies";
import DeskCard, { type CardPlacement } from "./DeskCard";
import { deskFontVars } from "./fonts";
import styles from "./desk.module.css";

type Props = {
  posts: DeskPost[];
  benchmarkCount: number;
  /** When false, mount straight onto the desk. */
  quizFirst?: boolean;
  /** Truncates the gate to its first N rounds. */
  quizRounds?: number;
};

type Gate = "quiz" | "result" | "done";
type Camera = { x: number; y: number; zoom: number };
type Stamp = { x: number; y: number; glyph: string; rot: number; size: number; color: string };
type Placements = Record<DeskCardId, CardPlacement>;

const CANVAS_KEY = "zy-canvas-expand-v1";
const QUIZ_KEY = "zy-bench-quiz-v1";
const DEFAULT_CAMERA: Camera = { x: 40, y: 20, zoom: 0.74 };
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 1.6;
const OPEN_MAX_ZOOM = 0.86;
const GLIDE = "transform .6s cubic-bezier(.22,.9,.25,1)";
const GLIDE_MS = 650;
const CLICK_SLOP = 5;
const GLYPHS = ["✦", "✱", "✎", "★"];
const STAMP_COLORS = ["#E88A7D", "#8FB6E3", "#9CC79B", "#C6A6E8"];
const NARROW_QUERY = "(max-width: 720px)";

function defaultPlacements(cards: DeskCardDef[]): Placements {
  return Object.fromEntries(
    cards.map((card, index) => [card.id, { x: card.x, y: card.y, z: index + 1, rot: card.rot }]),
  ) as Placements;
}

function subscribeNarrow(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// localStorage can throw (private mode, blocked storage) — the desk works
// fine without it, it just forgets.
function readStorage<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export default function Desk({ posts, benchmarkCount, quizFirst = true, quizRounds }: Props) {
  const cards = useMemo(() => buildDeskCards(posts.length, benchmarkCount), [posts.length, benchmarkCount]);
  const rounds = useMemo(() => {
    const all = buildGateRounds();
    return all.slice(0, Math.max(1, Math.min(all.length, quizRounds ?? all.length)));
  }, [quizRounds]);

  // --- Gate state ---
  const [gate, setGate] = useState<Gate>(quizFirst ? "quiz" : "done");
  const [round, setRound] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [picks, setPicks] = useState<GateModelId[]>([]);
  // The last completed run, which powers the toolbar's humor chip. Kept
  // separate from `picks` so re-running the quiz doesn't clear it until
  // the new run finishes.
  const [storedPicks, setStoredPicks] = useState<GateModelId[] | null>(null);

  // --- Canvas state ---
  const [placements, setPlacements] = useState<Placements>(() => defaultPlacements(cards));
  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [camTrans, setCamTrans] = useState("none");
  const [panning, setPanning] = useState(false);
  const [openId, setOpenId] = useState<DeskCardId | null>(null);
  const [flipped, setFlipped] = useState<Partial<Record<DeskCardId, boolean>>>({});
  const [dragId, setDragId] = useState<DeskCardId | null>(null);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [stampMode, setStampMode] = useState(false);
  const [glyph, setGlyph] = useState(GLYPHS[0]);
  const [reader, setReader] = useState<Benchmark | null>(null);
  const [loaded, setLoaded] = useState(false);

  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );

  // Non-state refs: pointer sessions and animation loops live outside the
  // render cycle so a drag or the bee doesn't re-render more than it must.
  const cameraRef = useRef(camera);
  const placementsRef = useRef(placements);
  const topZRef = useRef(cards.length + 1);
  const dragRef = useRef<{
    id: DeskCardId;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    lx: number;
    ly: number;
    t: number;
    vx: number;
    vy: number;
    moved: number;
  } | null>(null);
  const panRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const inertiaRef = useRef<{ id: DeskCardId; vx: number; vy: number } | null>(null);
  const [inertiaActive, setInertiaActive] = useState(false);
  const glideTimer = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const beeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);
  useEffect(() => {
    placementsRef.current = placements;
  }, [placements]);

  // Restore the saved desk and the last quiz result once, after hydration
  // (the server can't see localStorage, so the first render is the default).
  useEffect(() => {
    const saved = readStorage<{
      cards?: Partial<Placements>;
      panX?: number;
      panY?: number;
      zoom?: number;
      stamps?: Stamp[];
    }>(CANVAS_KEY);
    const quiz = readStorage<{ picks?: string[] }>(QUIZ_KEY);
    if (saved) {
      setPlacements((prev) => {
        const next = { ...prev };
        for (const card of cards) {
          const p = saved.cards?.[card.id];
          if (p && [p.x, p.y, p.z, p.rot].every(Number.isFinite)) next[card.id] = p;
        }
        topZRef.current = Math.max(topZRef.current, ...Object.values(next).map((p) => p.z + 1));
        return next;
      });
      if ([saved.panX, saved.panY, saved.zoom].every(Number.isFinite)) {
        setCamera({ x: saved.panX!, y: saved.panY!, zoom: saved.zoom! });
      }
      if (Array.isArray(saved.stamps)) setStamps(saved.stamps);
    }
    const validPicks = quiz?.picks?.filter((p): p is GateModelId =>
      (GATE_MODELS as readonly string[]).includes(p),
    );
    if (validPicks?.length) setStoredPicks(validPicks);
    setLoaded(true);
  }, [cards]);

  // Persist once things settle — skipped mid-drag, mid-pan and mid-fling so
  // we write once per gesture rather than once per frame.
  useEffect(() => {
    if (!loaded || dragId || panning || inertiaActive) return;
    const timer = window.setTimeout(() => {
      writeStorage(CANVAS_KEY, {
        cards: placements,
        panX: camera.x,
        panY: camera.y,
        zoom: camera.zoom,
        stamps,
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loaded, placements, camera, stamps, dragId, panning, inertiaActive]);

  // --- Camera ---
  const glide = useCallback((next: Camera) => {
    if (glideTimer.current) window.clearTimeout(glideTimer.current);
    setCamTrans(GLIDE);
    setCamera(next);
    glideTimer.current = window.setTimeout(() => setCamTrans("none"), GLIDE_MS);
  }, []);

  const setZoomAround = useCallback((zoom: number, cx?: number, cy?: number) => {
    setCamTrans("none");
    setCamera((cam) => {
      const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
      const x = cx ?? window.innerWidth / 2;
      const y = cy ?? window.innerHeight / 2;
      const wx = (x - cam.x) / cam.zoom;
      const wy = (y - cam.y) / cam.zoom;
      return { zoom: nz, x: x - wx * nz, y: y - wy * nz };
    });
  }, []);

  const raise = useCallback((id: DeskCardId) => {
    const z = ++topZRef.current;
    setPlacements((prev) => ({ ...prev, [id]: { ...prev[id], z } }));
  }, []);

  // --- Cards ---
  const toggle = useCallback(
    (id: DeskCardId) => {
      if (openId === id) {
        setOpenId(null);
        return;
      }
      setOpenId(id);
      if (narrow) return;
      raise(id);
      const card = cards.find((c) => c.id === id)!;
      const p = placementsRef.current[id];
      const z = Math.min(cameraRef.current.zoom, OPEN_MAX_ZOOM);
      // Horizontally centred, 90px from the top.
      glide({ x: window.innerWidth / 2 - (p.x + card.exp / 2) * z, y: 90 - p.y * z, zoom: z });
    },
    [openId, narrow, raise, cards, glide],
  );

  const flip = useCallback((id: DeskCardId) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const onCardPointerDown = useCallback(
    (id: DeskCardId, event: ReactPointerEvent) => {
      event.stopPropagation();
      if (stampMode || narrow || event.button !== 0) return;
      const p = placementsRef.current[id];
      dragRef.current = {
        id,
        sx: event.clientX,
        sy: event.clientY,
        ox: p.x,
        oy: p.y,
        lx: event.clientX,
        ly: event.clientY,
        t: performance.now(),
        vx: 0,
        vy: 0,
        moved: 0,
      };
      inertiaRef.current = null;
      setInertiaActive(false);
      setCamTrans("none");
      setDragId(id);
      raise(id);
    },
    [stampMode, narrow, raise],
  );

  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const cam = cameraRef.current;
      if (stampMode) {
        const stamp: Stamp = {
          x: (event.clientX - cam.x) / cam.zoom,
          y: (event.clientY - cam.y) / cam.zoom,
          glyph,
          rot: Math.random() * 30 - 15,
          size: 22 + Math.random() * 14,
          color: "",
        };
        setStamps((prev) => [...prev, { ...stamp, color: STAMP_COLORS[prev.length % STAMP_COLORS.length] }]);
        return;
      }
      if (openId) setOpenId(null);
      panRef.current = { x: event.clientX, y: event.clientY, px: cam.x, py: cam.y };
      setCamTrans("none");
      setPanning(true);
    },
    [stampMode, glyph, openId],
  );

  // Pointer move / up on the window so a fast drag can leave the card.
  // Handlers read the latest state through a ref rather than re-binding.
  const latest = useRef({ toggle, flipped });
  useEffect(() => {
    latest.current = { toggle, flipped };
  }, [toggle, flipped]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (drag) {
        const zoom = cameraRef.current.zoom;
        const dx = (event.clientX - drag.sx) / zoom;
        const dy = (event.clientY - drag.sy) / zoom;
        drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
        const now = performance.now();
        const dt = Math.max(8, now - drag.t);
        drag.vx = ((event.clientX - drag.lx) / zoom / dt) * 16;
        drag.vy = ((event.clientY - drag.ly) / zoom / dt) * 16;
        drag.lx = event.clientX;
        drag.ly = event.clientY;
        drag.t = now;
        const { id, ox, oy } = drag;
        setPlacements((prev) => ({ ...prev, [id]: { ...prev[id], x: ox + dx, y: oy + dy } }));
      } else if (panRef.current) {
        const pan = panRef.current;
        setCamera((cam) => ({
          ...cam,
          x: pan.px + (event.clientX - pan.x),
          y: pan.py + (event.clientY - pan.y),
        }));
      }
    };
    const onUp = () => {
      const drag = dragRef.current;
      if (drag) {
        dragRef.current = null;
        setDragId(null);
        if (drag.moved < CLICK_SLOP) {
          // A click on the back of a card turns it back over rather than
          // unfolding something you can't see.
          if (latest.current.flipped[drag.id]) {
            setFlipped((prev) => ({ ...prev, [drag.id]: false }));
          } else {
            latest.current.toggle(drag.id);
          }
        } else if (Math.abs(drag.vx) + Math.abs(drag.vy) > 1.5) {
          inertiaRef.current = { id: drag.id, vx: drag.vx * 2.2, vy: drag.vy * 2.2 };
          setInertiaActive(true);
        }
      }
      if (panRef.current) {
        panRef.current = null;
        setPanning(false);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // Wheel pans; ctrl/cmd + wheel (and trackpad pinch, which arrives as
  // ctrl + wheel) zooms toward the cursor. Bound natively because React's
  // wheel listener is passive and can't preventDefault the page zoom.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        setZoomAround(
          cameraRef.current.zoom * (event.deltaY > 0 ? 0.94 : 1.06),
          event.clientX,
          event.clientY,
        );
      } else {
        setCamTrans("none");
        setCamera((cam) => ({ ...cam, x: cam.x - event.deltaX, y: cam.y - event.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setZoomAround, narrow]);

  // One rAF loop for the bee and for flung cards. The bee is written
  // straight to the DOM — routed through state it would re-render the whole
  // desk sixty times a second.
  useEffect(() => {
    if (narrow) return;
    const target = { x: -60, y: -60 };
    const bee = { x: -60, y: -60, vx: 0, vy: 0 };
    const onPointer = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
    };
    window.addEventListener("pointermove", onPointer);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      bee.vx = bee.vx * 0.86 + (target.x + 46 - bee.x) * 0.045;
      bee.vy = bee.vy * 0.86 + (target.y + 34 - bee.y) * 0.045;
      bee.x += bee.vx;
      bee.y += bee.vy;
      const tilt = Math.max(-22, Math.min(22, bee.vx * 1.6));
      if (beeRef.current) {
        beeRef.current.style.transform = `translate3d(${bee.x}px, ${bee.y}px, 0) rotate(${tilt}deg)`;
      }

      const fling = inertiaRef.current;
      if (fling) {
        fling.vx *= 0.93;
        fling.vy *= 0.93;
        if (Math.abs(fling.vx) + Math.abs(fling.vy) < 0.3) {
          inertiaRef.current = null;
          setInertiaActive(false);
        } else {
          const { id, vx, vy } = fling;
          setPlacements((prev) => ({
            ...prev,
            [id]: { ...prev[id], x: prev[id].x + vx, y: prev[id].y + vy, rot: prev[id].rot + vx * 0.05 },
          }));
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [narrow]);

  // Escape folds the open card and leaves stamp mode — unless the gate or
  // the benchmark reader is up; they own Escape while they're open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || reader || gate !== "done") return;
      setOpenId(null);
      setStampMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reader, gate]);

  useEffect(
    () => () => {
      if (glideTimer.current) window.clearTimeout(glideTimer.current);
    },
    [],
  );

  const tidyUp = () => {
    topZRef.current = cards.length + 1;
    setPlacements(defaultPlacements(cards));
    setStamps([]);
    setFlipped({});
    setOpenId(null);
    setCamTrans("none");
    setCamera(DEFAULT_CAMERA);
  };

  // --- Gate ---
  const restartQuiz = () => {
    setRound(0);
    setPicks([]);
    setPick(null);
    setReader(null);
    setGate("quiz");
  };

  const nextRound = () => {
    if (pick === null) return;
    const nextPicks = [...picks, rounds[round].options[pick].model];
    setPicks(nextPicks);
    setPick(null);
    if (round + 1 >= rounds.length) {
      setGate("result");
      setStoredPicks(nextPicks);
      writeStorage(QUIZ_KEY, { picks: nextPicks });
    } else {
      setRound(round + 1);
    }
  };

  const verdict = storedPicks ? modelName(gateWinner(storedPicks)) : null;

  const renderCard = (def: DeskCardDef) => (
    <DeskCard
      key={def.id}
      def={def}
      placement={placements[def.id]}
      open={openId === def.id}
      flipped={!!flipped[def.id]}
      dragging={dragId === def.id}
      dimmed={openId !== null && openId !== def.id}
      inList={narrow}
      onCardPointerDown={(event) => onCardPointerDown(def.id, event)}
      onToggle={() => toggle(def.id)}
      onFlip={() => flip(def.id)}
    >
      <CardBody id={def.id} posts={posts} onOpenBenchmark={setReader} onRetakeGate={restartQuiz} />
    </DeskCard>
  );

  const header = (
    <>
      <div className={styles.header} style={{ opacity: openId && !narrow ? 0.25 : 1 }}>
        <h1 className={styles.headerName}>Hi, I&rsquo;m Zhi Yang</h1>
        <div className={styles.headerRole}>SOFTWARE ENGINEER @ SYNTHESIS PARTNERS</div>
        <p className={styles.headerIntro}>
          This is a desk, not a page. Nothing here opens in a window &mdash; cards unfold in place
          and the canvas comes to meet them. Throw them around, flip the corners, stamp the paper.
        </p>
      </div>
      <div className={styles.hint} style={{ opacity: openId && !narrow ? 0.25 : 1 }}>
        <span className={styles.hintRule} />
        <span>
          {narrow
            ? "TAP TO UNFOLD · FLIP THE CORNER"
            : "CLICK TO UNFOLD · FLING TO MOVE · FLIP THE CORNER · ESC TO COLLAPSE"}
        </span>
      </div>
    </>
  );

  const gridSize = 22 * camera.zoom;

  return (
    <div className={`${styles.root} ${deskFontVars}`}>
      {narrow ? (
        <main className={styles.list}>
          {header}
          <div className={styles.listCards}>{cards.map(renderCard)}</div>
        </main>
      ) : (
        <div
          ref={canvasRef}
          className={styles.canvas}
          style={{
            backgroundSize: `${gridSize}px ${gridSize}px`,
            backgroundPosition: `${camera.x}px ${camera.y}px`,
            cursor: stampMode ? "crosshair" : panning ? "grabbing" : "grab",
          }}
          onPointerDown={onCanvasPointerDown}
        >
          <div className={styles.fiber} />
          <div className={styles.dim} style={{ background: `rgba(20,19,15,${openId ? 0.1 : 0})` }} />

          <div
            className={styles.world}
            style={{
              transition: camTrans,
              transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
            }}
          >
            {header}
            {stamps.map((stamp, index) => (
              <div
                key={index}
                className={styles.stamp}
                style={{
                  transform: `translate3d(${stamp.x}px, ${stamp.y}px, 0) rotate(${stamp.rot}deg)`,
                  color: stamp.color,
                  fontSize: stamp.size,
                }}
              >
                <span className={styles.stampInner}>{stamp.glyph}</span>
              </div>
            ))}
            {cards.map(renderCard)}
          </div>

          <div ref={beeRef} className={styles.bee} aria-hidden>
            <div className={styles.beeWing} />
            <div className={styles.beeBody} />
          </div>

          <div className={styles.toolbarDock}>
            <div className={styles.toolbar} onPointerDown={(event) => event.stopPropagation()}>
              {cards.map((card) => (
                <button
                  key={card.id}
                  className={`${styles.chip} ${openId === card.id ? styles.chipActive : ""}`}
                  onClick={() => toggle(card.id)}
                >
                  {card.chip}
                </button>
              ))}
              <span className={styles.sep} />
              <button
                className={`${styles.stampBtn} ${stampMode ? styles.stampBtnOn : ""}`}
                onClick={() => setStampMode((on) => !on)}
                aria-pressed={stampMode}
              >
                STAMP
              </button>
              {stampMode && (
                <span className={styles.glyphs}>
                  {GLYPHS.map((g) => (
                    <button
                      key={g}
                      className={`${styles.glyph} ${g === glyph ? styles.glyphOn : ""}`}
                      onClick={() => setGlyph(g)}
                      aria-label={`Stamp ${g}`}
                    >
                      {g}
                    </button>
                  ))}
                </span>
              )}
              {verdict && (
                <>
                  <span className={styles.sep} />
                  <button className={styles.humorChip} onClick={restartQuiz}>
                    HUMOR: {verdict.toUpperCase()}
                  </button>
                </>
              )}
              <span className={styles.sep} />
              <button
                className={styles.zoomBtn}
                onClick={() => setZoomAround(camera.zoom / 1.15)}
                aria-label="Zoom out"
              >
                &minus;
              </button>
              <span className={styles.zoomLabel}>{Math.round(camera.zoom * 100)}%</span>
              <button
                className={styles.zoomBtn}
                onClick={() => setZoomAround(camera.zoom * 1.15)}
                aria-label="Zoom in"
              >
                +
              </button>
              <button className={styles.tidy} onClick={tidyUp}>
                TIDY UP
              </button>
            </div>
          </div>
        </div>
      )}

      {gate !== "done" && (
        <BenchmarkGate
          rounds={rounds}
          phase={gate}
          round={round}
          pick={pick}
          picks={picks}
          onPick={(index) => setPick((current) => current ?? index)}
          onNext={nextRound}
          onSkip={() => setGate("done")}
          onRestart={restartQuiz}
        />
      )}

      {reader && <BenchmarkReader benchmark={reader} onClose={() => setReader(null)} />}
    </div>
  );
}
