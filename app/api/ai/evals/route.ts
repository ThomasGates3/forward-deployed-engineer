import { guardedClaude } from "@/lib/ai-rate-limit";
import { fallbacks } from "@/content/fallbacks";
import { EVAL_CASES } from "@/lib/evals/cases";
import { SYSTEM_PROMPT, userMessage } from "@/lib/evals/prompt";
import { runSuite, type Generator } from "@/lib/evals/runner";

// Visitor-triggered run. Each case is one guarded call; once this visitor's cap is hit
// the remaining cases get a canned example, which is shown but NEVER graded.
export async function POST(req: Request) {
  const canned = fallbacks.evals as Record<string, string>;

  const generate: Generator = async (tc) => {
    const r = await guardedClaude<string>({
      req,
      tool: "evals",
      system: SYSTEM_PROMPT,
      buildMessages: () => [{ role: "user", content: userMessage(tc.request, tc.cloud) }],
      // Identity parse: invalid JSON must reach the grader and fail valid_json,
      // not be swallowed into a fallback.
      parse: (raw) => raw,
      fallback: canned[tc.id] ?? canned.default,
      maxTokens: 400,
      perVisitorCap: 2,
    });
    return r.source === "live" ? { source: "live", text: r.data } : { source: "fallback", text: r.data, reason: r.reason };
  };

  const report = await runSuite({ cases: EVAL_CASES, generate, n: 1, concurrency: 1 });
  return Response.json(report);
}
