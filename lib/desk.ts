import { getBenchmark, getModel } from "@/lib/benchmarks";
import { INFO_CARDS } from "@/lib/content";

// Everything the home desk renders that isn't a component: card placement,
// the flavour copy on each card, and the benchmark gate's rounds.
//
// Card *bodies* come from the real content sources (INFO_CARDS, the blog
// posts, data/benchmarks.json). The blurbs, tags and back-of-card lines
// below are voice copy from the design handoff, trimmed so none of it
// claims something the real content contradicts — rewrite freely.

export type AccentName = "blue" | "green" | "coral" | "purple" | "violet";

export const ACCENTS: Record<AccentName, { accent: string; wash: string }> = {
  blue: { accent: "#8FB6E3", wash: "#EEF4FB" },
  green: { accent: "#9CC79B", wash: "#EFF6EE" },
  coral: { accent: "#E88A7D", wash: "#FBF0EE" },
  purple: { accent: "#C6A6E8", wash: "#F5EFFC" },
  violet: { accent: "#E0A9DC", wash: "#FBEFFA" },
};

export type DeskCardId = "about" | "projects" | "blog" | "bench" | "contact";

export type DeskCardDef = {
  id: DeskCardId;
  title: string;
  /** Short label for the toolbar jump-chip. */
  chip: string;
  meta: string;
  blurb: string;
  tag: string;
  accent: AccentName;
  back: string;
  /** World-space spawn point and collapsed / expanded widths. */
  x: number;
  y: number;
  w: number;
  exp: number;
  rot: number;
  tapeX: number;
  tapeRot: number;
};

export function buildDeskCards(postCount: number, benchmarkCount: number): DeskCardDef[] {
  return [
    {
      id: "about",
      title: INFO_CARDS.about.title,
      chip: "ABOUT",
      meta: "01 · WHO",
      blurb: "Software engineer in Singapore. Likes digging into how the tools we use actually work.",
      tag: "1 MIN READ",
      accent: "purple",
      back: "I got into this because I liked watching logs scroll. Nobody has ever fully talked me out of that.",
      x: 180,
      y: 440,
      w: 300,
      exp: 660,
      rot: -1.2,
      tapeX: 70,
      tapeRot: -4,
    },
    {
      id: "projects",
      title: INFO_CARDS.projects.title,
      chip: "PROJECTS",
      meta: "02 · BUILT",
      blurb: "Things I rebuilt to understand how the originals work.",
      tag: `${parseProjects().length} PROJECTS`,
      accent: "blue",
      back: "Every project starts as “how hard can it be?” The answer is always in the commit history.",
      x: 600,
      y: 640,
      w: 300,
      exp: 660,
      rot: 1,
      tapeX: 150,
      tapeRot: 6,
    },
    {
      id: "blog",
      title: "Tech Blog",
      chip: "BLOG",
      meta: "03 · WRITING",
      blurb: "Writeups from digging into how things actually work.",
      tag: `${postCount} POST${postCount === 1 ? "" : "S"}`,
      accent: "green",
      back: "Every post starts as an angry Slack message I decide not to send.",
      x: 1020,
      y: 410,
      w: 300,
      exp: 660,
      rot: -0.8,
      tapeX: 40,
      tapeRot: 3,
    },
    {
      id: "bench",
      title: "Stupid LLM Benchmarks",
      chip: "BENCHMARKS",
      meta: "04 · PLAY",
      blurb: "Silly prompts handed to frontier models, and the answers they gave back, verbatim.",
      tag: `${benchmarkCount} PROMPTS`,
      accent: "coral",
      back: "Every model got the exact same prompt. What they did with it is on them.",
      x: 1060,
      y: 770,
      w: 320,
      exp: 720,
      rot: 1.6,
      tapeX: 120,
      tapeRot: -7,
    },
    {
      id: "contact",
      title: INFO_CARDS.contact.title,
      chip: "CONTACT",
      meta: "05 · SAY HI",
      blurb: "Where to find me, and where to send a specific question.",
      tag: `${INFO_CARDS.contact.links?.length ?? 0} LINKS`,
      accent: "violet",
      back: "Best way to reach me is a specific question. Worst way is the word “synergies”.",
      x: 220,
      y: 900,
      w: 290,
      exp: 660,
      rot: 0.9,
      tapeX: 100,
      tapeRot: 5,
    },
  ];
}

export type Project = { name: string; desc: string; url?: string };

// Projects are stored as "• Name — description" lines (that's the format the
// /studio editor writes), so split them back into structured rows here.
export function parseProjects(): Project[] {
  const links = INFO_CARDS.projects.links ?? [];
  return INFO_CARDS.projects.body
    .flatMap((chunk) => chunk.split("\n"))
    .map((line) => line.replace(/^\s*[•\-*]\s*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...rest] = line.split(/\s+[—–-]\s+/);
      const desc = rest.join(" — ");
      const url = links.find((link) => link.label.toLowerCase() === name.toLowerCase())?.url;
      return { name: name.trim(), desc, url };
    });
}

// --- Benchmark gate -------------------------------------------------------

// The four models that answered every prompt in data/benchmarks.json. Order
// is canonical: it sets the tally order on the result screen.
export const GATE_MODELS = ["opus-5", "gpt-5-6-terra", "qwen3-7-max", "kimi-k3"] as const;
export type GateModelId = (typeof GATE_MODELS)[number];

// Persona copy is a read of how each model behaved across these prompts —
// it's a joke about the answers, not a claim about the model.
export const GATE_PERSONAS: Record<GateModelId, { bar: string; blurb: string }> = {
  "opus-5": {
    bar: "#C6A6E8",
    blurb:
      "Method actor. You open with a stage direction, commit to the scene completely, and would rather lose the job than break character.",
  },
  "gpt-5-6-terra": {
    bar: "#8FB6E3",
    blurb:
      "Crowd-pleaser. Clean setup, clean punchline, nobody offended, done in one line. You would destroy at a wedding toast and you know it.",
  },
  "qwen3-7-max": {
    bar: "#9CC79B",
    blurb:
      "Over-deliverer. Asked for one joke, you bring three options, a strategy and a juice box. The thoroughness is the bit.",
  },
  "kimi-k3": {
    bar: "#E88A7D",
    blurb:
      "Deadpan. Wry, a little sideways, and happy to answer a yes-or-no question with a flat “No.” Nobody can tell if you're joking. Neither can you.",
  },
};

// Rounds, in play order. Ends on yes-or-no because the answer lengths are
// the punchline and it's a quick one to finish on.
const GATE_ROUND_SLUGS = [
  "the-musk-round",
  "the-barista-gambit",
  "burn-rate-excuse",
  "the-intern-deflection",
  "yes-or-no",
];

export type GateOption = { model: GateModelId; modelName: string; text: string };

export type GateRound = {
  slug: string;
  name: string;
  prompt: string;
  verdict: string;
  options: GateOption[];
};

export function modelName(id: GateModelId): string {
  return getModel(id)?.name ?? id;
}

export function buildGateRounds(): GateRound[] {
  return GATE_ROUND_SLUGS.flatMap((slug, roundIndex) => {
    const benchmark = getBenchmark(slug);
    if (!benchmark) return [];
    const answers = GATE_MODELS.map((model) => ({
      model,
      modelName: modelName(model),
      text: benchmark.responses.find((r) => r.model === model)?.text ?? "",
    }));
    if (answers.some((answer) => !answer.text)) return [];
    // Rotate by round so no model sits in the same slot twice running —
    // otherwise "always pick B" becomes a strategy.
    const options = answers.map((_, slot) => answers[(slot + roundIndex) % answers.length]);
    return [
      {
        slug,
        name: benchmark.name,
        prompt: benchmark.prompt,
        // The last note is the one written with hindsight, so it reads best
        // after the authors are revealed.
        verdict: benchmark.notes[benchmark.notes.length - 1] ?? benchmark.tagline,
        options,
      },
    ];
  });
}

// Most picks wins; a tie goes to whichever tied model the visitor picked
// first, which is closer to "the one that got you" than list order.
export function gateWinner(picks: GateModelId[]): GateModelId {
  const counts = new Map<GateModelId, number>();
  for (const pick of picks) counts.set(pick, (counts.get(pick) ?? 0) + 1);
  const best = Math.max(0, ...counts.values());
  return picks.find((pick) => counts.get(pick) === best) ?? GATE_MODELS[0];
}
