// Run-to-run comparison and the regression gate. Pure functions so they are unit-tested
// and shared by the page, `npm run eval:gate`, and CI.
import type { CaseStatus, SuiteSummary } from "./runner";

export type ComparableRun = {
  promptSha256: string;
  model: string;
  summary: Pick<SuiteSummary, "passRate"> & Partial<SuiteSummary>;
  cases: Array<{ id: string; passes: number; graded: number; passRate: number | null; status: CaseStatus }>;
};

export type CaseDelta = {
  id: string;
  prev: number | null;
  curr: number | null;
  /** curr - prev, or null when either side was not graded. */
  delta: number | null;
  wasPassing: boolean;
  /** Pass rate went down. */
  regressed: boolean;
};

export type RunDiff = {
  cases: CaseDelta[];
  overallDelta: number | null;
  promptChanged: boolean;
  modelChanged: boolean;
};

const round = (x: number) => Math.round(x * 1e6) / 1e6;

export function compareRuns(prev: ComparableRun, curr: ComparableRun): RunDiff {
  const byId = new Map(prev.cases.map((c) => [c.id, c]));
  const cases = curr.cases.map((c): CaseDelta => {
    const p = byId.get(c.id);
    const prevRate = p?.passRate ?? null;
    const delta = prevRate === null || c.passRate === null ? null : round(c.passRate - prevRate);
    return {
      id: c.id,
      prev: prevRate,
      curr: c.passRate,
      delta,
      wasPassing: p?.status === "pass",
      regressed: delta !== null && delta < 0,
    };
  });
  const a = prev.summary.passRate;
  const b = curr.summary.passRate;
  return {
    cases,
    overallDelta: a === null || b === null ? null : round(b - a),
    promptChanged: prev.promptSha256 !== curr.promptSha256,
    modelChanged: prev.model !== curr.model,
  };
}

export type GateResult = { ok: boolean; reasons: string[]; diff: RunDiff | null };

/**
 * Fails when (1) nothing was graded, (2) the overall pass rate is below `threshold`, or
 * (3) any case that passed 100% of runs last time now fails at least one run.
 * A flaky case getting a little worse does not fail the gate: it was already flaky.
 */
export function gate(curr: ComparableRun, prev: ComparableRun | null, threshold: number): GateResult {
  const reasons: string[] = [];
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const rate = curr.summary.passRate;
  if (rate === null) reasons.push("No cases were graded.");
  else if (rate < threshold) reasons.push(`Overall pass rate ${pct(rate)} is below the ${pct(threshold)} threshold.`);
  const diff = prev ? compareRuns(prev, curr) : null;
  for (const d of diff?.cases ?? [])
    if (d.wasPassing && d.regressed)
      reasons.push(`Regression: "${d.id}" passed every run before, now ${pct(d.curr ?? 0)}.`);
  return { ok: reasons.length === 0, reasons, diff };
}
