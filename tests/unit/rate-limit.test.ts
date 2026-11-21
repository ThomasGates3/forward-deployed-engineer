import { describe, it, expect, vi, beforeEach } from "vitest";
import { FakeRedis } from "./fake-redis";

const redis = new FakeRedis();
const callHaiku = vi.fn<(opts: unknown) => Promise<string>>();

vi.mock("@/lib/redis", () => ({ getRedis: () => redis }));
vi.mock("@/lib/anthropic", () => ({ callHaiku: (o: unknown) => callHaiku(o) }));

const { guardedClaude, killSwitchOn, withTimeout, TimeoutError, reserveQuota } = await import("@/lib/ai-rate-limit");

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

describe("kill switch", () => {
  it("AI_KILL_SWITCH=1 returns a labeled fallback without reserving or calling the model", async () => {
    process.env.AI_KILL_SWITCH = "1";
    const r = await call(req());
    expect(r).toMatchObject({ source: "fallback", reason: "kill-switch", data: "canned" });
    expect(callHaiku).not.toHaveBeenCalled();
    expect(redis.total("ai:")).toBe(0);
  });
  it("only an explicit on value trips it", async () => {
    for (const v of ["0", "", "false"]) {
      process.env.AI_KILL_SWITCH = v;
      expect((await call(req(`9.9.9.${v.length}`))).source).toBe("live");
    }
    expect(killSwitchOn()).toBe(false);
    process.env.AI_KILL_SWITCH = "true";
    expect(killSwitchOn()).toBe(true);
  });
});

describe("per-request timeout", () => {
  it("returns a timeout fallback when the model call hangs, and aborts the request", async () => {
    let aborted = false;
    callHaiku.mockImplementation(
      (o: unknown) =>
        new Promise((_, reject) => {
          const signal = (o as { signal?: AbortSignal }).signal;
          signal?.addEventListener("abort", () => {
            aborted = true;
            reject(new Error("aborted"));
          });
        }),
    );
    const t0 = Date.now();
    const r = await call(req(), { timeoutMs: 30 });
    expect(r).toMatchObject({ source: "fallback", reason: "timeout" });
    expect(Date.now() - t0).toBeLessThan(1000);
    expect(aborted).toBe(true);
  });
  it("keeps the quota reservation on timeout (the call may still have been billed)", async () => {
    callHaiku.mockImplementation(() => new Promise(() => {}));
    await call(req(), { timeoutMs: 10 });
    expect(redis.total("ai:t:global")).toBe(1);
  });
  it("withTimeout resolves normally when the work is fast", async () => {
    await expect(withTimeout(async () => 42, 50)).resolves.toBe(42);
    await expect(withTimeout(() => new Promise(() => {}), 10)).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe("reserveQuota (used by routes that cannot use guardedClaude)", () => {
  it("is atomic under concurrency and can be released", async () => {
    const rs = await Promise.all(Array.from({ length: 6 }, () => reserveQuota(req(), "agent", { perVisitorCap: 2 })));
    const ok = rs.filter((r) => r.ok);
    expect(ok).toHaveLength(2);
    for (const r of ok) if (r.ok) await r.release();
    expect(redis.total("ai:agent:global")).toBe(0);
  });
  it("can skip the per-visitor counter", async () => {
    const r = await reserveQuota(req(), "agent", { perVisitorCap: 0, countVisitor: false });
    expect(r.ok).toBe(true);
  });
});
