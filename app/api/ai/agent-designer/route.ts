import { guardedClaude, clampInput } from "@/lib/ai-rate-limit";
import { fallbacks } from "@/content/fallbacks";

export type AgentDesign = { systemPrompt: string; tools: string[] };

const SYSTEM = `You are an expert AI agent architect. Given a plain-English description of what someone wants an AI agent to do, design a production-ready agent.

Return ONLY strict, minified JSON matching exactly this shape — no prose, no markdown fences:
{"systemPrompt":"<a complete, production-ready system prompt for the agent: role, responsibilities, explicit guardrails, output format, tone>","tools":["<3 to 5 concrete suggested tools or integrations, each a short phrase>"]}

The systemPrompt must be detailed and directly usable. Include explicit safety/guardrail rules. Provide between 3 and 5 tools.`;

function parse(raw: string): AgentDesign {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const obj = JSON.parse(cleaned) as unknown;
  if (
    !obj ||
    typeof obj !== "object" ||
    typeof (obj as AgentDesign).systemPrompt !== "string" ||
    !(obj as AgentDesign).systemPrompt.trim() ||
    !Array.isArray((obj as AgentDesign).tools) ||
    (obj as AgentDesign).tools.length < 3 ||
    !(obj as AgentDesign).tools.every((t) => typeof t === "string" && t.trim())
  ) {
    throw new Error("bad shape");
  }
  const d = obj as AgentDesign;
  return { systemPrompt: d.systemPrompt.trim(), tools: d.tools.slice(0, 5) };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { description?: unknown };
  const description = clampInput(body.description, 2000);

  const result = await guardedClaude<AgentDesign>({
    req,
    tool: "agent-designer",
    system: SYSTEM,
    buildMessages: () => [
      { role: "user", content: `Design an AI agent for this:\n\n${description}` },
    ],
    parse,
    fallback: fallbacks["agent-designer"] as unknown as AgentDesign,
    maxTokens: 700,
  });

  return Response.json(result);
}
