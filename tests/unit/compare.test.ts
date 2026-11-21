import { describe, it, expect } from "vitest";
import { compareRuns, gate, type ComparableRun } from "@/lib/evals/compare";

const run = (cases: Array<[string, number, number]>, extra: Partial<ComparableRun> = {}): ComparableRun => {
  const graded = cases.reduce((s, c) => s + c[2], 0);
  const passed = cases.reduce((s, c) => s + c[1], 0);
  return {
    promptSha256: "a",
    model: "m",
    summary: { passRate: graded ? passed / graded : null } as ComparableRun["summary"],
    cases: cases.map(([id, passes, g]) => ({
      id,
      passes,
      graded: g,
      passRate: g ? passes / g : null,
      status: g === 0 ? "not_evaluated" : passes === g ? "pass" : passes === 0 ? "fail" : "flaky",
    })),
    ...extra,
  };
};

describe("compareRuns", () => {
  it("reports per-case deltas and flags only cases that got worse", () => {
    const prev = run([["a", 5, 5], ["b", 3, 5], ["c", 0, 5]]);
    const curr = run([["a", 4, 5], ["b", 5, 5], ["c", 0, 5]]);
    const d = compareRuns(prev, curr);
    expect(d.cases.find((x) => x.id === "a")).toMatchObject({ delta: -0.2, regressed: true, wasPassing: true });
    expect(d.cases.find((x) => x.id === "b")).toMatchObject({ delta: 0.4, regressed: false });
    expect(d.cases.find((x) => x.id === "c")).toMatchObject({ delta: 0, regressed: false });
    expect(d.overallDelta).toBeCloseTo(9 / 15 - 8 / 15, 5); // pooled over runs, not averaged per case
  });
  it("treats new or ungraded cases as no comparison, not as regressions", () => {
    const d = compareRuns(run([["a", 5, 5]]), run([["a", 5, 5], ["new", 0, 5]]));
    expect(d.cases.find((x) => x.id === "new")).toMatchObject({ delta: null, regressed: false });
  });
  it("notes when the prompt or model changed between runs", () => {
    const d = compareRuns(run([["a", 5, 5]]), run([["a", 5, 5]], { promptSha256: "b" }));
    expect(d.promptChanged).toBe(true);
    expect(d.modelChanged).toBe(false);
  });
});

describe("gate", () => {
  it("passes when above threshold with no regressions", () => {
    expect(gate(run([["a", 5, 5], ["b", 4, 5]]), run([["a", 5, 5], ["b", 4, 5]]), 0.8)).toMatchObject({ ok: true });
  });
  it("fails below the threshold", () => {
    const g = gate(run([["a", 3, 5]]), null, 0.8);
    expect(g.ok).toBe(false);
    expect(g.reasons.join(" ")).toMatch(/60%.*80%/);
  });
  it("fails when a previously 100%-passing case regresses, even if overall is above threshold", () => {
    const prev = run([["a", 5, 5], ["b", 0, 5]]);
    const curr = run([["a", 4, 5], ["b", 5, 5]]);
    const g = gate(curr, prev, 0.5);
    expect(g.ok).toBe(false);
    expect(g.reasons.join(" ")).toContain("a");
  });
  it("does not fail on a flaky case getting a bit worse (only previously-passing cases gate)", () => {
    expect(gate(run([["a", 5, 5], ["b", 2, 5]]), run([["a", 5, 5], ["b", 3, 5]]), 0.5).ok).toBe(true);
  });
  it("fails when nothing was graded", () => {
    expect(gate(run([["a", 0, 0]]), null, 0.8).ok).toBe(false);
  });
});
