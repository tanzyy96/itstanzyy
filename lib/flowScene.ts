import type { CardNodeType } from "@/components/flow/CardNode";
import { DEFAULT_CARD_WIDTH, DEFAULT_CARD_HEIGHT } from "@/components/flow/CardNode";
import type { TextNodeType } from "@/components/flow/TextNode";
import { CARDS } from "./cards";
import savedFlowScene from "@/data/flow-scene.json";

export type FlowLayoutNode = CardNodeType | TextNodeType;

function buildDefaultNodes(postCount?: number): FlowLayoutNode[] {
  const header: TextNodeType[] = [
    {
      id: "header-name",
      type: "text",
      position: { x: 100, y: -140 },
      data: { text: "Hi, I'm Zhi Yang 👋", size: "lg" },
      draggable: false,
      selectable: false,
    },
    {
      id: "header-tagline",
      type: "text",
      position: { x: 100, y: -80 },
      data: { text: "Software Engineer @ Ascenda — drag the cards around", size: "md" },
      draggable: false,
      selectable: false,
    },
  ];

  const cards: CardNodeType[] = CARDS.map((card) => ({
    id: card.id,
    type: "card",
    position: { x: card.x, y: card.y },
    width: DEFAULT_CARD_WIDTH,
    height: DEFAULT_CARD_HEIGHT,
    data: {
      label:
        card.id === "card-blog" && postCount !== undefined
          ? `${card.label} (${postCount})`
          : card.label,
      link: card.link,
      backgroundColor: card.backgroundColor,
      isOpen: false,
    },
  }));

  return [...header, ...cards];
}

// A saved layout (edited & saved via /flow/studio) always wins over the
// hand-authored defaults above — note this means the live post count only
// shows until the layout is saved once, since a saved blog card's label
// already has the count baked in.
export function buildInitialFlowNodes(postCount?: number): FlowLayoutNode[] {
  const saved = (savedFlowScene as { nodes?: FlowLayoutNode[] }).nodes;
  if (Array.isArray(saved) && saved.length > 0) {
    return saved;
  }
  return buildDefaultNodes(postCount);
}
