"use client";

import { useState } from "react";
import { Button, Card, Badge, CopyButton } from "@/components/ui";
import type { CaseReport, CaseStatus, SuiteSummary } from "@/lib/evals/runner";
import { pct } from "@/lib/evals/format";

const STATUS_LABEL: Record<CaseStatus, string> = {
  pass: "Pass",
  fail: "Fail",
  flaky: "Flaky",
  not_evaluated: "Not evaluated",
};
const STATUS_TONE: Record<CaseStatus, "accent" | "amber" | "edge"> = {
  pass: "accent",
  fail: "amber",
  flaky: "amber",
  not_evaluated: "edge",
};

function fallbackWhy(reason?: string) {
  if (reason === "per-visitor-cap") return "Your daily live-call limit for this tool was reached.";
  if (reason === "global-cap") return "The site's daily live-call budget was reached.";
  if (reason === "unconfigured") return "Live model calls are not configured on this deployment.";
  if (reason === "kill-switch") return "Live AI calls are switched off site-wide right now.";
  if (reason === "timeout") return "The live call took too long and was stopped.";
  return "The live call failed.";
}


export function SummaryLine({ summary, n }: { summary: SuiteSummary; n: number }) {
  return (
    <div data-testid="summary-card">
      <p className="font-mono text-2xl text-cream">
        {pct(summary.passRate)} <span className="text-base text-muted">pass rate</span>
      </p>
      <p className="mt-2 font-mono text-xs text-muted">
        {summary.passedRuns}/{summary.gradedRuns} graded runs passed · {summary.gradedCases} of {summary.cases} cases
        graded{n > 1 ? ` · ${n} runs per case` : ""} · {summary.casesPassing} pass · {summary.casesFlaky} flaky ·{" "}
        {summary.casesFailing} fail
        {summary.notEvaluatedCases > 0 ? ` · ${summary.notEvaluatedCases} not evaluated` : ""}
      </p>
    </div>
  );
}

export default function CaseResults({ cases }: { cases: CaseReport[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className="mt-6 space-y-3" data-testid="eval-results-list">
      {cases.map((c) => {
        const failed = Object.entries(c.ruleFailures);
        const warned = Object.entries(c.warnings);
        return (
          <Card key={c.id} className="p-4">
            <div
              className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
              data-testid={`eval-case-${c.id}`}
            >
              <div className="min-w-0">
                <p className="text-sm text-cream">{c.request}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[c.status]}>
                    <span data-testid={`badge-${c.id}`}>{STATUS_LABEL[c.status]}</span>
                  </Badge>
                  {c.graded > 0 && (
                    <span className="font-mono text-xs text-muted">
                      {c.passes}/{c.graded} runs passed
                    </span>
                  )}
                  {c.category !== "standard" && <span className="font-mono text-xs text-muted">{c.category}</span>}
                  <span className="font-mono text-xs uppercase text-muted">{c.cloud}</span>
                </div>
                {c.status === "not_evaluated" && (
                  <p className="mt-2 text-xs text-muted">
                    Not evaluated (canned example). {fallbackWhy(c.runs[0]?.reason)} This case shows a saved
                    example and is left out of the pass rate.
                  </p>
                )}
                {failed.length > 0 && (
                  <p className="mt-2 font-mono text-xs text-amber-300">
                    Failed: {failed.map(([r, k]) => `${r} (${k}/${c.graded})`).join(", ")}
                  </p>
                )}
                {warned.length > 0 && (
                  <p className="mt-1 font-mono text-xs text-muted">
                    Warn: {warned.map(([r, k]) => `${r} (${k}/${c.graded})`).join(", ")}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                className="shrink-0"
                data-testid={`toggle-${c.id}`}
                aria-expanded={!!open[c.id]}
                onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}
              >
                {open[c.id] ? "Hide details" : "View details"}
              </Button>
            </div>

            {open[c.id] && (
              <div className="mt-4 space-y-5 border-t border-edge pt-4" data-testid={`detail-${c.id}`}>
                <p className="text-xs text-muted">
                  <span className="font-mono text-cream">Pass means:</span> {c.passCriteria}
                </p>
                {c.runs.map((run) => (
                  <div key={run.attempt}>
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
                      Run {run.attempt} ·{" "}
                      {run.source === "live"
                        ? run.grade?.passed
                          ? "model output · pass"
                          : "model output · fail"
                        : "canned example · not graded"}
                    </p>
                    {run.grade && (
                      <ul className="mb-3 space-y-1.5">
                        {run.grade.rules.map((r) => (
                          <li key={r.name} className="flex items-start gap-2 text-xs">
                            <span
                              aria-hidden
                              className={
                                r.skipped ? "text-muted" : r.passed ? "text-accent" : r.severity === "warn" ? "text-amber-300" : "text-red-400"
                              }
                            >
                              {r.skipped ? "–" : r.passed ? "✓" : r.severity === "warn" ? "!" : "✗"}
                            </span>
                            <span className="text-muted">
                              <span className="font-mono text-cream">
                                {r.name}
                                {r.severity === "warn" ? " (warn)" : ""}
                                {r.skipped ? " (n/a)" : ""}:
                              </span>{" "}
                              <span className="sr-only">{r.skipped ? "not applicable" : r.passed ? "passed" : "failed"}. </span>
                              {r.detail}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                        {run.source === "live" ? "Model output" : "Canned example (not model output)"}
                      </span>
                      <CopyButton text={run.output} label="Copy JSON" />
                    </div>
                    <pre
                      className="max-h-72 max-w-full overflow-auto whitespace-pre-wrap break-all rounded-lg border border-edge bg-ink p-3 text-[11px] text-cream"
                      data-testid={`policy-json-${c.id}-${run.attempt}`}
                    >
                      {run.output || "(empty)"}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
