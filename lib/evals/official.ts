// An "official" run: the full suite against the real API, with no visitor caps,
// plus the metadata needed to compare runs over time.
import { EVAL_CASES } from "./cases";
import { SYSTEM_PROMPT, PROMPT_SHA256, PROMPT_VERSION, userMessage } from "./prompt";
import { runSuite, type SuiteReport } from "./runner";
import { callHaiku, HAIKU } from "@/lib/anthropic";
import { killSwitchOn } from "@/lib/ai-rate-limit";

export type RunRecord = SuiteReport & {
  id: string;
  timestamp: string;
  model: string;
  promptSha256: string;
  promptVersion: string;
  gitSha: string | null;
  temperature: number | null; // null = API default
  liveCalls: number;
  trigger: "cli" | "admin-route" | "ci";
};

export const MAX_TOKENS = 400;

export function gitShaFromEnv(): string | null {
  return process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || process.env.EVAL_GIT_SHA || null;
}

export async function runOfficial(opts: {
  n: number;
  concurrency: number;
  temperature?: number;
  maxCalls: number;
  trigger: RunRecord["trigger"];
  gitSha?: string | null;
  onProgress?: (done: number, total: number) => void;
}): Promise<RunRecord> {
  const total = EVAL_CASES.length * opts.n;
  if (total > opts.maxCalls)
    throw new Error(`Refusing to run: ${EVAL_CASES.length} cases x N=${opts.n} = ${total} calls exceeds max ${opts.maxCalls}.`);
  if (killSwitchOn()) throw new Error("AI_KILL_SWITCH is on: official runs are disabled.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set.");

  let calls = 0;
  let done = 0;
  const report = await runSuite({
    cases: EVAL_CASES,
    n: opts.n,
    concurrency: opts.concurrency,
    generate: async (tc) => {
      calls++;
      try {
        const text = await callHaiku({
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage(tc.request, tc.cloud) }],
          maxTokens: MAX_TOKENS,
          temperature: opts.temperature,
        });
        return { source: "live", text };
      } finally {
        opts.onProgress?.(++done, total);
      }
    },
  });

  const timestamp = new Date().toISOString();
  return {
    ...report,
    id: timestamp,
    timestamp,
    model: HAIKU,
    promptSha256: PROMPT_SHA256,
    promptVersion: PROMPT_VERSION,
    gitSha: opts.gitSha ?? gitShaFromEnv(),
    temperature: opts.temperature ?? null,
    liveCalls: calls,
    trigger: opts.trigger,
  };
}
