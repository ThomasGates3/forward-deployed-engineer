"use client";

import { useState } from "react";
import { Button, Card, Badge, CopyButton, FallbackNote } from "@/components/ui";
import { ThinkingBar, FadeIn } from "@/components/motion";

type EvalRule = { name: string; passed: boolean; detail: string };
type EvalCaseResult = {
  id: string;
  request: string;
  generated_policy_json: string;
  source: "live" | "fallback";
  rules: EvalRule[];
  overall_pass: boolean;
  score: number;
};
type EvalsResponse = {
  cases: EvalCaseResult[];
  summary: { total: number; passed: number; avg_score: number };
};

export default function EvalsTool() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvalsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/evals", { method: "POST" });
      const json = (await res.json()) as EvalsResponse;
      setResult(json);
    } catch {
      setError("Could not reach the eval runner. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setOpen((o) => ({ ...o, [id]: !o[id] }));
  }

  return (
    <section className="mt-10">
      <Button data-testid="run-evals-btn" onClick={run} disabled={loading}>
        {loading ? "Running eval suite…" : "Run eval suite →"}
      </Button>
      {loading && (
        <div className="mt-4 max-w-md" data-testid="eval-progress">
          <ThinkingBar />
          <p className="mt-2 text-xs text-muted">Generating and grading 8 policies against the rubric…</p>
        </div>
      )}
      {error && (
        <p data-testid="eval-error" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}

      {result && (
        <FadeIn className="mt-8">
          <Card className="p-6">
            <p className="font-mono text-2xl text-cream" data-testid="summary-card">
              {result.summary.passed}/{result.summary.total} passing
              <span className="text-muted"> · avg score {result.summary.avg_score}/5</span>
            </p>
          </Card>

          <div className="mt-6 space-y-3" data-testid="eval-results-list">
            {result.cases.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-testid={`eval-case-${c.id}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-cream" title={c.request}>
                      {c.request}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={c.overall_pass ? "accent" : "amber"}>
                        <span data-testid={`badge-${c.id}`}>{c.overall_pass ? "Pass" : "Fail"}</span>
                      </Badge>
                      <span className="font-mono text-xs text-muted">score {c.score}/5</span>
                      <span className="font-mono text-xs text-muted">
                        {c.source === "live" ? "live generation" : "fallback example"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="shrink-0"
                    data-testid={`toggle-${c.id}`}
                    onClick={() => toggle(c.id)}
                  >
                    {open[c.id] ? "Hide details" : "View details"}
                  </Button>
                </div>

                {open[c.id] && (
                  <div className="mt-4 border-t border-edge pt-4" data-testid={`detail-${c.id}`}>
                    {c.source === "fallback" && <FallbackNote reason="per-visitor-cap" />}
                    <ul className="mb-4 space-y-1.5">
                      {c.rules.map((r) => (
                        <li key={r.name} className="flex items-start gap-2 text-xs">
                          <span className={r.passed ? "text-accent" : "text-red-400"}>{r.passed ? "✓" : "✗"}</span>
                          <span className="text-muted">
                            <span className="font-mono text-cream">{r.name}:</span> {r.detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                        Generated policy
                      </span>
                      <CopyButton text={c.generated_policy_json} label="Copy JSON" />
                    </div>
                    <pre
                      className="max-w-full overflow-x-auto rounded-lg border border-edge bg-ink p-3 text-[11px] text-cream"
                      data-testid={`policy-json-${c.id}`}
                    >
                      {c.generated_policy_json}
                    </pre>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </FadeIn>
      )}
    </section>
  );
}
