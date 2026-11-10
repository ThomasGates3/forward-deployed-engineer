// City Scroll hero: one source of truth for stage copy, scroll ranges and assets.
// Scroll progress p (0..1) maps to frame round(p * (FRAME_COUNT - 1)) + 1.

export const FRAME_COUNT = 606; // 485 city frames + 121 door/lobby frames (f0486-f0606)
export const frameSrc = (i: number) => `/hero/frames/f${String(i + 1).padStart(4, "0")}.jpg`;

export const media = {
  poster: "/hero/poster.jpg",
  posterMobile: "/hero/poster-mobile.jpg",
  video: "/hero/scroll-city.mp4",
  videoMobile: "/hero/scroll-city-mobile.mp4",
};

export type StageItem = { title: string; body: string; href?: string; start: number };

// Where the hero hands off to the Projects section (the "Projects ↓" cue and the last rail dot).
export const PROJECTS_HREF = "#gallery";
export const lobby = { still: "/lobby/lobby.jpg", stillMobile: "/lobby/lobby-mobile.jpg" };

export type Stage = {
  n: string;
  label: string;
  start: number;
  end: number;
  fadeStart?: number; // overlay fade-in point when it differs from the stage start
  fadeEnd?: number; // overlay fade-out point when it differs from the stage end
  still: string;
  stillAlt: string;
  title?: string;
  body?: string;
  href?: string;
  items?: StageItem[];
};

export const stages: Stage[] = [
  {
    n: "01", label: "Rooftop", start: 0, end: 0.096,
    still: "/hero/keyframes/stage1-rooftop.jpg",
    stillAlt: "Thomas on a rooftop above the city at dusk, a cyan orb lifting off a projector",
  },
  {
    n: "02", label: "Signal", start: 0.096, end: 0.328,
    still: "/hero/keyframes/stage2-drones.jpg",
    stillAlt: "Drones and flying cars carrying glowing data packets between towers",
    title: "Production LLM apps.",
    body: "Keys server-side, rate limits, graceful fallbacks. Every demo on this page is live.",
  },
  {
    n: "03", label: "Agents", start: 0.328, end: 0.544,
    still: "/hero/keyframes/stage3-tower.jpg",
    stillAlt: "A glass tower with robot agents working on lit floors",
    items: [
      { title: "RAG search", body: "Chunked retrieval, answers cited to the source.", href: "#doc-qa", start: 0.328 },
      { title: "Agentic copilot", body: "Real tool calls. A human approves the risky ones.", href: "#ops-copilot", start: 0.376 },
    ],
  },
  {
    n: "04", label: "Evals", start: 0.544, end: 0.728,
    still: "/hero/keyframes/stage4-billboard.jpg",
    stillAlt: "A street-level holographic screen showing an abstract dashboard",
    title: "Output, graded before it ships.",
    body: "The eval suite behind the IAM Policy Generator: 8 cases, each policy graded on pass or fail rules.",
    href: "#evals",
    fadeEnd: 0.692, // hands over early so the contact card is fully opaque from 0.728
  },
  {
    // Stays fully readable through ~0.79, then fades before the camera reaches the orb (~0.875).
    n: "05", label: "Contact", start: 0.728, end: 0.8, fadeStart: 0.692, fadeEnd: 0.825,
    still: "/hero/keyframes/stage5-terminal.jpg",
    stillAlt: "The cyan orb settling on a calm terminal at street level",
    title: "Let's put AI into your production.",
  },
  {
    // The door flight: through the orb and the arched entrance into the lobby. No HUD card.
    n: "06", label: "Projects", start: 0.8, end: 1,
    still: "/lobby/lobby.jpg",
    stillAlt: "Inside the tower: a dark lobby with cyan light lines",
  },
];
