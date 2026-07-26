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
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "speed-to-lead",
    title: "Speed to Lead",
    tagline: "Cut inbound lead response from hours to seconds with an AI-qualified, auto-drafted follow-up.",
    stack: ["n8n", "Twilio", "SendGrid", "Claude API", "Next.js"],
    problem:
      "Inbound leads go cold fast — response time is the single biggest predictor of conversion, yet most teams reply in hours, not minutes. Manual triage means good leads sit in an inbox while a rep is heads-down on something else.",
    build: [
      "An n8n pipeline that fires the instant a lead lands, enriches it, and routes it.",
      "A Claude API step that qualifies each lead — scoring intent and fit and explaining the reasoning, not just a yes/no.",
      "Auto-drafted, on-brand follow-ups delivered two ways: email via SendGrid and SMS via Twilio.",
      "A Next.js dashboard so the team can see every lead, its score, the AI's reasoning, and what was sent.",
    ],
    architecture: [
      "Trigger (webhook/form) → n8n orchestration.",
      "Claude API qualification node returns a structured verdict + reasoning + drafted copy.",
      "Branch: high-intent → immediate SMS + email + human ping; lower → nurture.",
      "Everything logged to the dashboard for visibility and follow-through.",
    ],
    outcome:
      "Leads get a qualified, personalized response in seconds instead of hours, and the team gets the AI's reasoning attached to every one — so they trust it and act on it. The live demo on this site is the same qualify-and-draft loop, wired to send you a real email.",
    demo: { label: "Try the live Speed-to-Lead demo", href: "/#gallery" },
  },
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
      "The repetitive path from idea to a live, marketed product runs without manual intervention, freeing the operator to focus on judgment and strategy. It's a concrete demonstration of multi-agent orchestration doing real operational work.",
  },
];

export const caseStudyBySlug = Object.fromEntries(caseStudies.map((c) => [c.slug, c]));
