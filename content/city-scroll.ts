// City Scroll hero: one source of truth for stage copy, scroll ranges and assets.
// Scroll progress p (0..1) maps to frame round(p * (FRAME_COUNT - 1)) + 1.

export const FRAME_COUNT = 485;
export const frameSrc = (i: number) => `/hero/frames/f${String(i + 1).padStart(4, "0")}.jpg`;

export const media = {
  poster: "/hero/poster.jpg",
  posterMobile: "/hero/poster-mobile.jpg",
  video: "/hero/scroll-city.mp4",
  videoMobile: "/hero/scroll-city-mobile.mp4",
};

export type StageItem = { title: string; body: string; href?: string; start: number };

export type Stage = {
  n: string;
  label: string;
  start: number;
  end: number;
  still: string;
  stillAlt: string;
  title?: string;
  body?: string;
  href?: string;
  items?: StageItem[];
};

export const stages: Stage[] = [
  {
    n: "01", label: "Rooftop", start: 0, end: 0.12,
    still: "/hero/keyframes/stage1-rooftop.jpg",
    stillAlt: "Thomas on a rooftop above the city at dusk, a cyan orb lifting off a projector",
  },
  {
    n: "02", label: "Signal", start: 0.12, end: 0.41,
    still: "/hero/keyframes/stage2-drones.jpg",
    stillAlt: "Drones and flying cars carrying glowing data packets between towers",
    title: "Production LLM apps.",
    body: "Keys server-side, rate limits, graceful fallbacks. Every demo on this page is live.",
  },
  {
    n: "03", label: "Agents", start: 0.41, end: 0.68,
    still: "/hero/keyframes/stage3-tower.jpg",
    stillAlt: "A glass tower with robot agents working on lit floors",
    items: [
      { title: "RAG search", body: "Chunked retrieval, answers cited to the source.", href: "#doc-qa", start: 0.41 },
      { title: "Agentic copilot", body: "Real tool calls. A human approves the risky ones.", href: "#ops-copilot", start: 0.47 },
    ],
  },
  {
    n: "04", label: "Evals", start: 0.68, end: 0.91,
    still: "/hero/keyframes/stage4-billboard.jpg",
    stillAlt: "A street-level holographic screen showing an abstract dashboard",
    title: "Structured output, graded.",
    body: "Structured extraction plus eval suites with pass or fail rubrics, so the output is tested before it ships.",
    href: "#evals",
  },
  {
    n: "05", label: "Contact", start: 0.91, end: 1,
    still: "/hero/keyframes/stage5-terminal.jpg",
    stillAlt: "The cyan orb settling on a calm terminal at street level",
    title: "Let's put AI into your production.",
  },
];
