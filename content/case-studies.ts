export type CaseStudy = {
  slug: string;
  title: string;
  tagline: string;
  stack: string[];
  problem: string;
  build: string[];
  architecture: string[];
  outcome: string;
  demo?: { label: string; href: string };
  liveDemo?: "speed-to-lead" | "optimistic-os";
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "optimistic-os",
    title: "Optimistic OS",
    tagline: "A six-agent pipeline that takes a product from trend to a scheduled, listed, marketed item — hands-off.",
    stack: ["Multi-agent orchestration", "Image generation", "Etsy API", "Pinterest API", "Claude"],
    problem:
      "Running a print-on-demand / e-commerce shop is a chain of repetitive creative and operational steps — research, design, listing, marketing — that eats all the founder's time and doesn't scale.",
    build: [
      "Agent 1 — trend research: finds what's rising and worth making.",
      "Agent 2 — image generation: produces the product artwork.",
      "Agent 3 — Etsy listing creation: writes and publishes the listing.",
      "Agent 4 — Pinterest scheduling: queues marketing posts to drive traffic.",
      "Coordinated end-to-end so one input flows through the whole chain.",
    ],
    architecture: [
      "A six-agent pipeline where each agent owns one stage and hands structured output to the next.",
      "Research → image gen → Etsy listing → Pinterest scheduling, orchestrated as a sequence with checkpoints.",
    ],
    outcome:
      "The repetitive path from idea to a live, marketed product runs without manual intervention, freeing the operator to focus on judgment and strategy. It's a concrete demonstration of multi-agent orchestration doing real operational work. Run the live six-agent pipeline below.",
    liveDemo: "optimistic-os",
  },
];

export const caseStudyBySlug = Object.fromEntries(caseStudies.map((c) => [c.slug, c]));
