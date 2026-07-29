export type DemoMeta = {
  id: string;
  name: string;
  value: string;
  flagship?: boolean;
  href?: string;
  external?: boolean;
};

export const demos: DemoMeta[] = [
  { id: "agent-designer", name: "AI Agent Designer", value: "Describe an agent in plain English → get a production system prompt + tools, exportable as a Claude Code skill or n8n workflow.", flagship: true },
  { id: "iam-policy-generator", name: "AI-Powered IAM Policy Generator", value: "Plain English → least-privilege AWS, GCP, or Azure policies via Gemini. A standalone production app, not a demo.", flagship: true, href: "https://ai-powered-iam.vercel.app", external: true },
  { id: "website-planner", name: "Multi-Agent Website Planner", value: "Watch three AI agents collaborate live — supervisor, UX planner, copywriter — turning a one-line brief into a full sitemap + section copy.", flagship: true, href: "https://web-planner-roan.vercel.app", external: true },
  { id: "product-contextualizer", name: "AI Product Contextualizer", value: "Drop in a product photo and a scene prompt — get back a realistic AI-composited placement shot, ready for e-commerce.", flagship: true, href: "https://ai-photo-studio-delta-six.vercel.app", external: true },
  { id: "speed-to-lead", name: "Speed to Lead", value: "Send yourself a fake inbound lead — watch Claude qualify it live, then get the AI-drafted follow-up in your inbox for real." },
  { id: "support-reply", name: "Support Reply Generator", value: "Pick a scenario or paste a customer message → a clear, on-brand support reply with a built-in tone & quality check." },
  { id: "extract", name: "Messy Doc → Structured Data", value: "Paste any messy text — invoice, note, jumble — and get clean structured JSON rendered as a table." },
  { id: "automation-architect", name: "Automation Architect", value: "Describe a business process in a sentence → a legible trigger → steps → logic workflow you can copy." },
  { id: "optimistic-os", name: "Optimistic OS", value: "Run a live six-agent pipeline: trend research → concept → image → listing → marketing, each agent handing off to the next.", flagship: true, href: "/case-studies/optimistic-os" },
];
