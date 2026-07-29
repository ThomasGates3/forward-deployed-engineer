export type DemoMeta = {
  id: string;
  name: string;
  value: string;
  flagship?: boolean;
  href?: string;
  external?: boolean;
};

export const demos: DemoMeta[] = [
  { id: "iam-policy-generator", name: "AI-Powered IAM Policy Generator", value: "Plain English → least-privilege AWS, GCP, or Azure policies via Gemini. A standalone production app, not a demo.", href: "https://ai-powered-iam.vercel.app", external: true },
  { id: "product-contextualizer", name: "AI Product Contextualizer", value: "Drop in a product photo and a scene prompt → get back a realistic AI-composited placement shot, ready for e-commerce.", href: "https://ai-photo-studio-delta-six.vercel.app", external: true },
  { id: "speed-to-lead", name: "Speed to Lead", value: "Send yourself a fake inbound lead. Watch Claude qualify it live, then get the AI-drafted follow-up in your inbox for real." },
  { id: "doc-qa", name: "Document Q&A", value: "Ask a question and get an answer grounded and cited in retrieved passages from a real document. Retrieval-augmented, not context-stuffing." },
  { id: "ops-copilot", name: "Ops Copilot", value: "A multi-turn agent using Claude's real tool-calling API against a mock orders and inventory dataset. Every tool call shows inline, and it pauses for human confirmation before issuing a refund." },
  { id: "evals", name: "Evals", value: "An eval suite that grades AI-generated least-privilege IAM policies against deterministic pass or fail rubrics, live, not just prompt and hope." },
];
