// Persistence for official runs. evals:latest holds the full record (including model
// outputs, so the page can show them). evals:history holds compact summaries of the
// last 30 runs, newest first.
import { getRedis } from "@/lib/redis";
import type { RunRecord } from "./official";
import type { CaseStatus } from "./runner";

export const LATEST_KEY = "evals:latest";
export const HISTORY_KEY = "evals:history";
export const HISTORY_LEN = 30;

export type RunSummary = Pick<
  RunRecord,
  "id" | "timestamp" | "model" | "promptSha256" | "promptVersion" | "gitSha" | "n" | "temperature" | "summary" | "trigger"
> & {
  cases: Array<{ id: string; passes: number; graded: number; passRate: number | null; status: CaseStatus }>;
};

export function toSummary(r: RunRecord): RunSummary {
  return {
    id: r.id,
    timestamp: r.timestamp,
    model: r.model,
    promptSha256: r.promptSha256,
    promptVersion: r.promptVersion,
    gitSha: r.gitSha,
    n: r.n,
    temperature: r.temperature,
    summary: r.summary,
    trigger: r.trigger,
    cases: r.cases.map((c) => ({ id: c.id, passes: c.passes, graded: c.graded, passRate: c.passRate, status: c.status })),
  };
}

/** Returns false when Redis is not configured. */
export async function storeRun(r: RunRecord): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  await redis.set(LATEST_KEY, r);
  await redis.lpush(HISTORY_KEY, toSummary(r));
  await redis.ltrim(HISTORY_KEY, 0, HISTORY_LEN - 1);
  return true;
}

export async function getLatest(): Promise<RunRecord | null> {
  const redis = getRedis();
  if (!redis) return null;
  return (await redis.get<RunRecord>(LATEST_KEY)) ?? null;
}

export async function getHistory(): Promise<RunSummary[]> {
  const redis = getRedis();
  if (!redis) return [];
  return (await redis.lrange<RunSummary>(HISTORY_KEY, 0, HISTORY_LEN - 1)) ?? [];
}
