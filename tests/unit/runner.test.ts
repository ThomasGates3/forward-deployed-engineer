import { describe, it, expect } from "vitest";
import { runSuite, statusFor, pool, type Generator } from "@/lib/evals/runner";
import { getCase } from "@/lib/evals/cases";

const s3 = getCase("s3-read-lambda")!;
const kms = getCase("kms-decrypt-only")!;
const GOOD_S3 = JSON.stringify({ Statement: [{ Effect: "Allow", Action: "s3:GetObject", Resource: "arn:aws:s3:::reports-prod/*" }] });
const BAD = JSON.stringify({ Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }] });

describe("statusFor", () => {
  it("classifies pass / fail / flaky / not evaluated", () => {
    expect(statusFor(5, 5)).toBe("pass");
    expect(statusFor(5, 0)).toBe("fail");
    expect(statusFor(5, 4)).toBe("flaky");
    expect(statusFor(5, 1)).toBe("flaky");
    expect(statusFor(0, 0)).toBe("not_evaluated");
  });
});

describe("runSuite", () => {
  it("runs N attempts per case and reports per-case pass rates", async () => {
    const gen: Generator = async (tc, attempt) => ({ source: "live", text: attempt <= 4 ? GOOD_S3 : BAD });
    const r = await runSuite({ cases: [s3], generate: gen, n: 5 });
    expect(r.cases[0]).toMatchObject({ graded: 5, passes: 4, passRate: 0.8, status: "flaky" });
    expect(r.cases[0].ruleFailures.no_wildcard_action).toBe(1);
    expect(r.summary).toMatchObject({ gradedRuns: 5, passedRuns: 4, passRate: 0.8, casesFlaky: 1 });
  });

  it("never grades fallbacks and leaves them out of the pass rate", async () => {
    const gen: Generator = async (tc) =>
      tc.id === s3.id ? { source: "live", text: GOOD_S3 } : { source: "fallback", text: BAD, reason: "per-visitor-cap" };
    const r = await runSuite({ cases: [s3, kms], generate: gen, n: 1 });
    const k = r.cases.find((x) => x.id === kms.id)!;
    expect(k.status).toBe("not_evaluated");
    expect(k.runs[0].grade).toBeNull();
    expect(r.summary).toMatchObject({ gradedCases: 1, notEvaluatedCases: 1, passRate: 1 });
  });

  it("reports a null pass rate, not 0% or 100%, when nothing was graded", async () => {
    const r = await runSuite({ cases: [s3], generate: async () => ({ source: "fallback", text: "", reason: "unconfigured" }) });
    expect(r.summary.passRate).toBeNull();
  });

  it("turns a throwing generator into an ungraded run instead of crashing the suite", async () => {
    const r = await runSuite({ cases: [s3], generate: async () => { throw new Error("boom"); } });
    expect(r.cases[0].status).toBe("not_evaluated");
    expect(r.cases[0].runs[0].reason).toContain("boom");
  });

  it("grades invalid model JSON as a failure, not as skipped", async () => {
    const r = await runSuite({ cases: [s3], generate: async () => ({ source: "live", text: "Sure! {oops" }) });
    expect(r.cases[0].status).toBe("fail");
    expect(r.cases[0].ruleFailures.valid_json).toBe(1);
  });
});

describe("pool", () => {
  it("never runs more than `limit` tasks at once and keeps order", async () => {
    let inFlight = 0;
    let peak = 0;
    const tasks = Array.from({ length: 20 }, (_, i) => async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 2));
      inFlight--;
      return i;
    });
    const out = await pool(tasks, 3);
    expect(peak).toBe(3);
    expect(out).toEqual(Array.from({ length: 20 }, (_, i) => i));
  });
});
