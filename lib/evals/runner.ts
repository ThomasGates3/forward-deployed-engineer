// Runs the suite: N attempts per case, bounded concurrency, grades only real model
// output. Shared by the public route, the admin route, `npm run eval`, and the gate.

import type { EvalCase } from "./cases";
import { gradePolicy, type GradeResult, type RuleName } from "./grader";

export type Generation =
  | { source: "live"; text: string }
  | { source: "fallback"; text: string; reason: string };

export type Generator = (tc: EvalCase, attempt: number) => Promise<Generation>;

export type CaseRun = {
  attempt: number;
  source: "live" | "fallback";
  reason?: string;
  output: string;
  /** null when the output was a canned fallback: never graded. */
  grade: GradeResult | null;
};

export type CaseStatus = "pass" | "fail" | "flaky" | "not_evaluated";

export type CaseReport = {
  id: string;
  request: string;
  cloud: EvalCase["cloud"];
  category: EvalCase["category"];
  passCriteria: string;
  runs: CaseRun[];
  graded: number;
  passes: number;
  /** passes / graded, or null when nothing was graded. */
  passRate: number | null;
  /** pass = 100% of graded runs, fail = 0%, flaky = anything in between. */
  status: CaseStatus;
  /** How many graded runs failed each rule. */
  ruleFailures: Partial<Record<RuleName, number>>;
  warnings: Partial<Record<RuleName, number>>;
};

export type SuiteSummary = {
  cases: number;
  gradedCases: number;
  notEvaluatedCases: number;
  gradedRuns: number;
  passedRuns: number;
  /** passedRuns / gradedRuns across all graded runs, or null if none were graded. */
  passRate: number | null;
  casesPassing: number;
  casesFailing: number;
  casesFlaky: number;
};

export type SuiteReport = { n: number; cases: CaseReport[]; summary: SuiteSummary };

export function statusFor(graded: number, passes: number): CaseStatus {
  if (graded === 0) return "not_evaluated";
  if (passes === graded) return "pass";
  if (passes === 0) return "fail";
  return "flaky";
}

export function buildCaseReport(tc: EvalCase, runs: CaseRun[]): CaseReport {
  const gradedRuns = runs.filter((r) => r.grade);
  const passes = gradedRuns.filter((r) => r.grade!.passed).length;
  const ruleFailures: CaseReport["ruleFailures"] = {};
  const warnings: CaseReport["warnings"] = {};
  for (const r of gradedRuns) {
    for (const f of r.grade!.failedRules) ruleFailures[f] = (ruleFailures[f] ?? 0) + 1;
    for (const w of r.grade!.warnings) warnings[w] = (warnings[w] ?? 0) + 1;
  }
  return {
    id: tc.id,
    request: tc.request,
    cloud: tc.cloud,
    category: tc.category,
    passCriteria: tc.passCriteria,
    runs,
    graded: gradedRuns.length,
    passes,
    passRate: gradedRuns.length ? passes / gradedRuns.length : null,
    status: statusFor(gradedRuns.length, passes),
    ruleFailures,
    warnings,
  };
}

export function summarize(cases: CaseReport[]): SuiteSummary {
  const graded = cases.filter((c) => c.graded > 0);
  const gradedRuns = graded.reduce((s, c) => s + c.graded, 0);
  const passedRuns = graded.reduce((s, c) => s + c.passes, 0);
  return {
    cases: cases.length,
    gradedCases: graded.length,
    notEvaluatedCases: cases.length - graded.length,
    gradedRuns,
    passedRuns,
    passRate: gradedRuns ? passedRuns / gradedRuns : null,
    casesPassing: cases.filter((c) => c.status === "pass").length,
    casesFailing: cases.filter((c) => c.status === "fail").length,
    casesFlaky: cases.filter((c) => c.status === "flaky").length,
  };
}

/** Run `tasks` with at most `limit` in flight. Results keep input order. */
export async function pool<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  const out = new Array<T>(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      out[i] = await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, tasks.length)) }, worker));
  return out;
}

export async function runSuite(opts: {
  cases: EvalCase[];
  generate: Generator;
  n?: number;
  concurrency?: number;
}): Promise<SuiteReport> {
  const n = Math.max(1, Math.floor(opts.n ?? 1));
  const jobs: Array<{ tc: EvalCase; attempt: number }> = [];
  for (const tc of opts.cases) for (let a = 1; a <= n; a++) jobs.push({ tc, attempt: a });

  const results = await pool(
    jobs.map(({ tc, attempt }) => async (): Promise<CaseRun> => {
      let gen: Generation;
      try {
        gen = await opts.generate(tc, attempt);
      } catch (e) {
        gen = { source: "fallback", text: "", reason: `error: ${(e as Error).message}` };
      }
      return gen.source === "live"
        ? { attempt, source: "live", output: gen.text, grade: gradePolicy(tc, gen.text) }
        : { attempt, source: "fallback", reason: gen.reason, output: gen.text, grade: null };
    }),
    opts.concurrency ?? 1,
  );

  const cases = opts.cases.map((tc) =>
    buildCaseReport(
      tc,
      results.filter((_, i) => jobs[i].tc.id === tc.id),
    ),
  );
  return { n, cases, summary: summarize(cases) };
}
