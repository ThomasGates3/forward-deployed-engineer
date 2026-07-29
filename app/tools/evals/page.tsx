import type { Metadata } from "next";
import Link from "next/link";
import EvalsTool from "./EvalsTool";

export const metadata: Metadata = {
  title: "Evals: Eval-Driven IAM Policy Generation",
  description: "A fixed eval suite that grades AI-generated least-privilege IAM policies against rule-based rubrics.",
};

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-ink text-cream">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 md:px-10 md:py-16">
        <Link
          href="/"
          data-testid="back-link"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted transition hover:text-accent"
        >
          ← Back to portfolio
        </Link>

        <header className="mt-8 max-w-2xl">
          <p className="eyebrow mb-3 font-mono text-[11px] uppercase tracking-wider text-accent">Eval-driven development</p>
          <h1 className="font-display text-section text-cream">
            Evals: test the AI before you ship it
          </h1>
          <p className="mt-4 text-muted">
            This suite runs 8 fixed, hardcoded IAM-policy requests through Claude and grades every generated
            policy against explicit, deterministic rules: no wildcard resources, no wildcard actions, valid
            JSON, correctly scoped to the requested service. That&apos;s the difference between prompt-and-hope
            and eval-driven AI development. A fixed rubric, run every time, tells you whether the model&apos;s
            output is actually safe to ship, not just whether it looks plausible.
          </p>
        </header>

        <EvalsTool />

        <footer className="mt-16 border-t border-edge pt-6 text-xs text-muted">
          8 fixed test cases · rule-based grading, no LLM judge · results labeled live vs. fallback per case
        </footer>
      </div>
    </main>
  );
}
