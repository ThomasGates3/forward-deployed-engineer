export type DemoMeta = { id: string; name: string; value: string; flagship?: boolean };

export const demos: DemoMeta[] = [
  { id: "agent-designer", name: "AI Agent Designer", value: "Describe an agent in plain English → get a production system prompt + tools, exportable as a Claude Code skill or n8n workflow.", flagship: true },
  { id: "speed-to-lead", name: "Speed to Lead", value: "Send yourself a fake inbound lead — watch Claude qualify it live, then get the AI-drafted follow-up in your inbox for real." },
  { id: "support-reply", name: "Support Reply Generator", value: "Pick a scenario or paste a customer message → a clear, on-brand support reply with a built-in tone & quality check." },
  { id: "extract", name: "Messy Doc → Structured Data", value: "Paste any messy text — invoice, note, jumble — and get clean structured JSON rendered as a table." },
  { id: "automation-architect", name: "Automation Architect", value: "Describe a business process in a sentence → a legible trigger → steps → logic workflow you can copy." },
];
