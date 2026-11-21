"use client";

import { useState } from "react";
import { MotionConfig } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { ThinkingBar, FadeIn } from "@/components/motion";
import type { SuiteReport } from "@/lib/evals/runner";
import CaseResults, { SummaryLine } from "./CaseResults";

// Visitor-triggered run. Capped per visitor, so most cases usually come back as
// canned examples, which are labeled and excluded from the pass rate.
export default function EvalsTool({ caseCount }: { caseCount: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuiteReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/evals", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      setResult((await res.json()) as SuiteReport);
    } catch {
      setError("Could not reach the eval runner. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <section className="mt-10" aria-labelledby="try-live-heading">
        <h2 id="try-live-heading" className="font-display text-2xl text-cream">
          Try a live run yourself
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          This sends real requests to the model, but it is capped: each visitor gets 2 live generations per day. The
          other {caseCount - 2} cases show a saved example, labeled &ldquo;not evaluated (canned example)&rdquo;, and
          they are not counted in the pass rate below. One run per case, so this cannot show flakiness; the official run above can.
        </p>
        <Button data-testid="run-evals-btn" className="mt-4" onClick={run} disabled={loading}>
          {loading ? "Running…" : "Run live (capped) →"}
        </Button>
        {loading && (
          <div className="mt-4 max-w-md" data-testid="eval-progress" role="status">
            <ThinkingBar />
            <p className="mt-2 text-xs text-muted">Generating and grading…</p>
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
              <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Your live run</p>
              <SummaryLine summary={result.summary} n={result.n} />
            </Card>
            <CaseResults cases={result.cases} />
          </FadeIn>
        )}
      </section>
    </MotionConfig>
  );
}
