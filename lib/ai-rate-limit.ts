import { callHaiku } from "./anthropic";
import { getRedis } from "./redis";
import { visitorId } from "./visitor";
import type Anthropic from "@anthropic-ai/sdk";

export const PER_VISITOR_CAP = 3; // per tool, per day
export const GLOBAL_CAP = 200; // whole site, per day

export type DemoResult<T> =
  | { ok: true; source: "live"; data: T }
  | { ok: true; source: "fallback"; data: T; reason: FallbackReason };

export type FallbackReason = "per-visitor-cap" | "global-cap" | "error" | "unconfigured";

function today() {
  return new Date().toISOString().slice(0, 10);
}

// INCR + set 25h expiry only on first write. Returns the new count (1-based).
async function bump(key: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0; // unconfigured -> never blocks
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 60 * 60 * 25);
  return n;
}

async function peek(key: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  return (await redis.get<number>(key)) ?? 0;
}

/**
 * The single entry point every /api/ai/* route uses. Enforces per-visitor and
 * global daily caps, then calls Claude Haiku. On any cap hit, parse failure, or
 * missing config it returns a labeled fallback — the tool NEVER surfaces an error.
 */
export async function guardedClaude<T>(opts: {
  req: Request;
  tool: string;
  system?: string;
  buildMessages: () => Anthropic.MessageParam[];
  parse: (raw: string) => T;
  fallback: T;
  maxTokens?: number;
}): Promise<DemoResult<T>> {
  const day = today();
  const globalKey = `ai:global:${day}`;
  const visitorKey = `ai:${opts.tool}:${visitorId(opts.req)}:${day}`;

  try {
    // Check caps before spending a call. Peek global, and count this visitor's usage.
    if ((await peek(globalKey)) >= GLOBAL_CAP)
      return { ok: true, source: "fallback", data: opts.fallback, reason: "global-cap" };
    if ((await peek(visitorKey)) >= PER_VISITOR_CAP)
      return { ok: true, source: "fallback", data: opts.fallback, reason: "per-visitor-cap" };

    if (!process.env.ANTHROPIC_API_KEY)
      return { ok: true, source: "fallback", data: opts.fallback, reason: "unconfigured" };

    const raw = await callHaiku({
      system: opts.system,
      messages: opts.buildMessages(),
      maxTokens: opts.maxTokens ?? 400,
    });
    const data = opts.parse(raw);

    // Only real, successful calls consume quota.
    await Promise.all([bump(globalKey), bump(visitorKey)]);
    return { ok: true, source: "live", data };
  } catch {
    return { ok: true, source: "fallback", data: opts.fallback, reason: "error" };
  }
}

// Shared input guard — reject/truncate oversized input before spending tokens.
export function clampInput(s: unknown, max = 4000): string {
  return String(s ?? "").slice(0, max).trim();
}
