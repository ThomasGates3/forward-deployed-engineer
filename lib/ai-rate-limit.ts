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

const TTL_SECONDS = 60 * 60 * 25;

type Slot = { key: string; cap: number; reason: FallbackReason };
type Reservation = { ok: true; release: () => Promise<void> } | { ok: false; reason: FallbackReason };

/**
 * Atomically reserve one unit against every cap BEFORE spending money.
 * Each counter is INCR'd first; if any comes back over its cap, everything taken so
 * far is DECR'd and the request is rejected. Under contention this can briefly
 * over-reject (a rejected request's INCR is visible for one round-trip) but it can
 * never over-admit, which is the property that protects spend.
 * Without Redis configured, nothing is counted (local dev / preview).
 */
async function reserve(slots: Slot[]): Promise<Reservation> {
  const redis = getRedis();
  if (!redis) return { ok: true, release: async () => {} };
  const taken: string[] = [];
  const undo = async () => {
    await Promise.all(taken.map((k) => redis.decr(k)));
  };
  for (const s of slots) {
    const n = await redis.incr(s.key);
    taken.push(s.key);
    if (n === 1) await redis.expire(s.key, TTL_SECONDS);
    if (n > s.cap) {
      await undo();
      return { ok: false, reason: s.reason };
    }
  }
  return { ok: true, release: undo };
}

function slotsFor(req: Request, tool: string, perVisitorCap: number, toolCap: number): Slot[] {
  const day = today();
  // Visitor first so an over-cap visitor is turned away before touching shared counters.
  return [
    { key: `ai:${tool}:${visitorId(req)}:${day}`, cap: perVisitorCap, reason: "per-visitor-cap" },
    { key: `ai:${tool}:global:${day}`, cap: toolCap, reason: "global-cap" },
    { key: `ai:global:${day}`, cap: GLOBAL_CAP, reason: "global-cap" },
  ];
}

/**
 * The single entry point every /api/ai/* route uses. Enforces per-visitor, per-tool,
 * and site-wide daily caps, then calls Claude Haiku. On any cap hit, error, or
 * missing config it returns a labeled fallback: the tool NEVER surfaces an error.
 *
 * Quota accounting: a reservation is released if the model call itself fails (no
 * tokens billed, or unknown). It is KEPT if the call returned but parse() rejected
 * the output, because those tokens were spent.
 */
export async function guardedClaude<T>(opts: {
  req: Request;
  tool: string;
  system?: string;
  buildMessages: () => Anthropic.MessageParam[];
  parse: (raw: string) => T;
  fallback: T;
  maxTokens?: number;
  temperature?: number;
  perVisitorCap?: number; // override for pricier tools (e.g. image gen)
  globalCap?: number; // per-tool daily cap
}): Promise<DemoResult<T>> {
  const fallback = (reason: FallbackReason): DemoResult<T> => ({ ok: true, source: "fallback", data: opts.fallback, reason });
  if (!process.env.ANTHROPIC_API_KEY) return fallback("unconfigured");

  let res: Reservation;
  try {
    res = await reserve(slotsFor(opts.req, opts.tool, opts.perVisitorCap ?? PER_VISITOR_CAP, opts.globalCap ?? GLOBAL_CAP));
  } catch {
    return fallback("error"); // Redis unreachable: fail closed, spend nothing
  }
  if (!res.ok) return fallback(res.reason);

  let raw: string;
  try {
    raw = await callHaiku({
      system: opts.system,
      messages: opts.buildMessages(),
      maxTokens: opts.maxTokens ?? 400,
      temperature: opts.temperature,
    });
  } catch {
    await res.release().catch(() => {});
    return fallback("error");
  }
  try {
    return { ok: true, source: "live", data: opts.parse(raw) };
  } catch {
    return fallback("error");
  }
}

// Shared input guard — reject/truncate oversized input before spending tokens.
export function clampInput(s: unknown, max = 4000): string {
  return String(s ?? "").slice(0, max).trim();
}

/**
 * Generic guarded call for NON-Claude paid work (e.g. fal.ai image gen).
 * Same three-layer cap logic as guardedClaude: site-wide, per-tool, per-visitor.
 * On any cap hit / error / `enabled:false` it returns the labeled fallback — never throws.
 */
export async function guardedCall<T>(opts: {
  req: Request;
  tool: string;
  enabled: boolean; // e.g. Boolean(process.env.FAL_KEY)
  call: () => Promise<T>;
  fallback: T;
  perVisitorCap?: number;
  globalCap?: number;
}): Promise<DemoResult<T>> {
  const fallback = (reason: FallbackReason): DemoResult<T> => ({ ok: true, source: "fallback", data: opts.fallback, reason });
  if (!opts.enabled) return fallback("unconfigured");
  let res: Reservation;
  try {
    res = await reserve(slotsFor(opts.req, opts.tool, opts.perVisitorCap ?? PER_VISITOR_CAP, opts.globalCap ?? GLOBAL_CAP));
  } catch {
    return fallback("error");
  }
  if (!res.ok) return fallback(res.reason);
  try {
    return { ok: true, source: "live", data: await opts.call() };
  } catch {
    await res.release().catch(() => {});
    return fallback("error");
  }
}
