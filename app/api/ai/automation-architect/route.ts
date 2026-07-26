import { guardedClaude, clampInput } from "@/lib/ai-rate-limit";
import { fallbacks } from "@/content/fallbacks";

export type WorkflowStep = { title: string; detail: string };
export type Workflow = { trigger: string; steps: WorkflowStep[] };

const SYSTEM = `You are an automation architect. Given a plain-English description of a business process, design a proposed n8n-style workflow.

Return ONLY strict, minified JSON matching exactly this shape — no prose, no markdown fences:
{"trigger":"<the event that starts the workflow>","steps":[{"title":"<short step name, 1-3 words>","detail":"<what this step does; include branching/conditional logic where relevant>"}]}

Rules: provide between 3 and 6 steps in logical execution order. Where a decision point exists, express the branching logic explicitly in that step's detail (e.g. "If score ≥ 70 → notify sales; else → nurture"). Keep each title terse and each detail one concise sentence.`;

function parse(raw: string): Workflow {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const obj = JSON.parse(cleaned) as unknown;
  if (
    !obj ||
    typeof obj !== "object" ||
    typeof (obj as Workflow).trigger !== "string" ||
    !(obj as Workflow).trigger.trim() ||
    !Array.isArray((obj as Workflow).steps) ||
    (obj as Workflow).steps.length < 3 ||
    !(obj as Workflow).steps.every(
      (s) =>
        s &&
        typeof s === "object" &&
        typeof s.title === "string" &&
        s.title.trim() &&
        typeof s.detail === "string" &&
        s.detail.trim()
    )
  ) {
    throw new Error("bad shape");
  }
  const w = obj as Workflow;
  return {
    trigger: w.trigger.trim(),
    steps: w.steps.slice(0, 6).map((s) => ({ title: s.title.trim(), detail: s.detail.trim() })),
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { process?: unknown };
  const process = clampInput(body.process, 2000);

  const result = await guardedClaude<Workflow>({
    req,
    tool: "automation-architect",
    system: SYSTEM,
    buildMessages: () => [
      { role: "user", content: `Design an automation workflow for this process:\n\n${process}` },
    ],
    parse,
    fallback: fallbacks["automation-architect"] as unknown as Workflow,
    maxTokens: 500,
  });

  return Response.json(result);
}
