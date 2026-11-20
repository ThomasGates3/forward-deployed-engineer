import { describe, it, expect, vi, beforeEach } from "vitest";
import { FakeRedis } from "./fake-redis";

const redis = new FakeRedis();
const callHaiku = vi.fn<(opts: unknown) => Promise<string>>();

vi.mock("@/lib/redis", () => ({ getRedis: () => redis }));
vi.mock("@/lib/anthropic", () => ({ callHaiku: (o: unknown) => callHaiku(o) }));

const { guardedClaude } = await import("@/lib/ai-rate-limit");

const req = (ip = "1.1.1.1") => new Request("http://x", { headers: { "x-forwarded-for": ip } });
const call = (r: Request, extra: Record<string, unknown> = {}) =>
  guardedClaude<string>({
    req: r,
    tool: "t",
    buildMessages: () => [{ role: "user", content: "hi" }],
    parse: (s) => s,
    fallback: "canned",
    perVisitorCap: 3,
    ...extra,
  });

beforeEach(() => {
  redis.store.clear();
  callHaiku.mockReset();
  callHaiku.mockImplementation(async () => {
    await new Promise((r) => setTimeout(r, 5));
    return "live";
  });
  process.env.ANTHROPIC_API_KEY = "test-not-a-real-key";
  delete process.env.AI_KILL_SWITCH;
});

describe("guardedClaude caps under concurrency", () => {
  it("never exceeds the per-visitor cap when 10 requests race", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => call(req())));
    expect(results.filter((r) => r.source === "live")).toHaveLength(3);
    expect(callHaiku).toHaveBeenCalledTimes(3);
    expect(redis.total("ai:t:global")).toBe(3);
  });

  it("never exceeds the per-tool cap across many visitors", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) => call(req(`10.0.0.${i}`), { globalCap: 5 })),
    );
    expect(results.filter((r) => r.source === "live")).toHaveLength(5);
    expect(callHaiku).toHaveBeenCalledTimes(5);
  });

  it("releases the reservation when the model call throws", async () => {
    callHaiku.mockRejectedValueOnce(new Error("network"));
    const r1 = await call(req());
    expect(r1).toMatchObject({ source: "fallback", reason: "error" });
    // The failed call must not burn quota: 3 more live calls still fit.
    const rest = await Promise.all([call(req()), call(req()), call(req())]);
    expect(rest.every((r) => r.source === "live")).toBe(true);
  });

  it("keeps the reservation when the call succeeded but parsing failed (tokens were spent)", async () => {
    const r = await call(req(), { parse: () => { throw new Error("bad"); } });
    expect(r).toMatchObject({ source: "fallback", reason: "error" });
    expect(redis.total("ai:t:global")).toBe(1);
  });

  it("does not reserve anything when unconfigured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const r = await call(req());
    expect(r).toMatchObject({ source: "fallback", reason: "unconfigured" });
    expect(callHaiku).not.toHaveBeenCalled();
    expect(redis.total("ai:")).toBe(0);
  });

  it("a request rejected by the cap leaves the counters where they were", async () => {
    await Promise.all([call(req()), call(req()), call(req())]);
    const before = new Map(redis.store);
    const r = await call(req());
    expect(r).toMatchObject({ source: "fallback", reason: "per-visitor-cap" });
    expect(redis.store).toEqual(before);
  });
});
