import savedContent from "@/data/site-content.json";

export type InfoCardLink = {
  label: string;
  url: string;
};

export type InfoCardContent = {
  title: string;
  body: string[];
  links?: InfoCardLink[];
};

export type InfoCardId = "about" | "projects" | "contact";

// Hand-authored fallback, used until the content is edited & saved via
// /studio, which persists to data/site-content.json (same pattern as
// data/flow-scene.json for layout).
const DEFAULT_INFO_CARDS: Record<InfoCardId, InfoCardContent> = {
  about: {
    title: "About Me",
    body: [
      "Software Engineer at Ascenda, based in Singapore. NTU grad (2017–2021).",
      "Interested in building things and learning about new systems and tools :D I write about how they work.",
    ],
  },
  projects: {
    title: "Projects",
    body: [
      "• BabyKafka — a distributed-systems learning project recreating Apache Kafka internals\n• Framemarks — a tool for capturing notes, screenshots, and timestamps from video content",
    ],
  },
  contact: {
    title: "Contact",
    body: [],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/zhi-yang-tan-265815166/" },
      { label: "GitHub", url: "https://github.com/tanzyy96" },
      { label: "Medium", url: "https://medium.com/@tanzyy" },
    ],
  },
};

const saved = (savedContent as { cards?: Partial<Record<InfoCardId, InfoCardContent>> }).cards;

export const INFO_CARDS: Record<InfoCardId, InfoCardContent> = {
  about: saved?.about ?? DEFAULT_INFO_CARDS.about,
  projects: saved?.projects ?? DEFAULT_INFO_CARDS.projects,
  contact: saved?.contact ?? DEFAULT_INFO_CARDS.contact,
};
