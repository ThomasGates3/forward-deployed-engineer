export type DemoMeta = {
  id: string;
  name: string;
  value: string;
  tag: string; // what kind of AI tool it is (no vendor or model names on the public site)
  flagship?: boolean;
  href?: string;
  external?: boolean;
};

// Card art lives at /projects/<id>.{avif,webp,jpg} (generated to match the city film).
export const cardImage = (id: string, ext: "avif" | "webp" | "jpg") => `/projects/${id}.${ext}`;

export const demos: DemoMeta[] = [
  { id: "iam-policy-generator", name: "AI-Powered IAM Policy Generator", tag: "Cloud security", value: "Plain English → least-privilege AWS, GCP, or Azure policies. A standalone production app, not a demo.", href: "https://ai-powered-iam.vercel.app", external: true },
  { id: "product-contextualizer", name: "AI Product Contextualizer", tag: "Image generation", value: "Drop in a product photo and a scene prompt → get back a realistic AI-composited placement shot, ready for e‑commerce.", href: "https://ai-photo-studio-delta-six.vercel.app", external: true },
  { id: "speed-to-lead", name: "Speed to Lead", tag: "Lead qualification", value: "Send yourself a fake inbound lead. Watch AI qualify it live, then get the AI‑drafted follow‑up in your inbox for real." },
  { id: "doc-qa", name: "Document Q&A", tag: "RAG search", value: "Ask a question and get an answer grounded and cited in retrieved passages from a real document. Retrieval-augmented, not context-stuffing." },
  { id: "ops-copilot", name: "Ops Copilot", tag: "AI agent", value: "A multi-turn agent making real tool calls against a mock orders and inventory dataset. Every tool call shows inline, and it pauses for human confirmation before issuing a refund." },
  { id: "evals", name: "Evals", tag: "AI testing", value: "A 12-case eval suite for an AI IAM-policy prompt, 4 of them adversarial. A unit-tested, rule-based grader checks every generated policy for wildcards, the right resource, and forbidden actions. Recorded runs keep the model, date, and prompt hash, so regressions show." },
];
