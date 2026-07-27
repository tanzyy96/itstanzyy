export type CardDef = {
  id: string;
  label: string;
  link: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
};

// Placeholder layout for the home canvas — these are just spawn points,
// visitors can drag the cards anywhere. Rearrange the defaults in /studio —
// saving there overwrites data/flow-scene.json, which takes precedence
// over this skeleton.
//
// A `#id` link spawns that card's content as a new detail node on the
// canvas (see components/flow/DetailNode.tsx); a `/path` link is a real
// page navigation — used for the blog, since long-form writeups don't
// belong squeezed onto an infinite canvas.
// `#benchmarks` is the one special case: instead of a single detail node it
// fans every benchmark out as its own expandable note (BenchmarkNode.tsx),
// since browsing them side by side is the whole appeal.
// The three "spawn" cards (about/projects/contact) are stacked along the
// left edge, each with a clear ~420px-wide lane to its right where its
// detail card appears — keeps the default layout collision-free without
// constraining how visitors drag things afterward.
export const CARDS: CardDef[] = [
  {
    id: "card-blog",
    label: "Tech Blog",
    link: "/blog",
    x: 700,
    y: 80,
    width: 220,
    height: 140,
    backgroundColor: "#b2f2bb",
  },
  {
    id: "card-benchmarks",
    label: "Stupid LLM Benchmarks",
    link: "#benchmarks",
    x: 700,
    y: 320,
    width: 220,
    height: 140,
    backgroundColor: "#ffc9c9",
  },
  {
    id: "card-about",
    label: "About Me",
    link: "#about",
    x: 100,
    y: 260,
    width: 220,
    height: 140,
    backgroundColor: "#ffec99",
  },
  {
    id: "card-projects",
    label: "Projects",
    link: "#projects",
    x: 100,
    y: 540,
    width: 220,
    height: 140,
    backgroundColor: "#a5d8ff",
  },
  {
    id: "card-contact",
    label: "Contact",
    link: "#contact",
    x: 100,
    y: 820,
    width: 220,
    height: 140,
    backgroundColor: "#eebefa",
  },
];
