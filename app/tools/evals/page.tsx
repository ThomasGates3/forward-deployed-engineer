import type { Metadata } from "next";
import Link from "next/link";
import EvalsTool from "./EvalsTool";
import { EVAL_CASES } from "@/lib/evals/cases";
import { getLatest, getHistory } from "@/lib/evals/store";
import OfficialRun from "./OfficialRun";

// Re-read the stored official run at most once a minute.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Evals: grading AI-generated IAM policies",
  description:
    "A fixed suite of IAM requests whose AI-generated policies are graded by deterministic, unit-tested rules: wildcards, named resources, required and forbidden actions, and service scope.",
};

export default async function Page() {
  const [latest, history] = await Promise.all([getLatest().catch(() => null), getHistory().catch(() => [])]);
  return (
    <main className="min-h-screen w-full bg-ink text-cream">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-5 md:px-10 md:py-16">
        <Link
          href="/"
          data-testid="back-link"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted transition hover:text-accent"
        >
          ← Back to portfolio
        </Link>

        <header className="mt-8 max-w-2xl">
          <p className="eyebrow mb-3 font-mono text-[11px] uppercase tracking-wider text-accent">Eval-driven development</p>
          <h1 className="font-display text-section text-cream">Grading AI-generated IAM policies</h1>
          <p className="mt-4 text-muted">
            {EVAL_CASES.length} fixed IAM requests across AWS, GCP, and Azure. The model writes a policy for each one,
            and a deterministic grader walks the parsed policy and checks it against rules defined per case: no
            wildcard actions or resources, the named resource is the one scoped, the needed actions are granted, the
            forbidden ones are not, and every action belongs to the requested service. The grader has its own unit
            tests, so a pass here means the rules ran, not that the output looked plausible.
          </p>
          <p className="mt-4 text-sm text-muted">
            This suite uses its own system prompt. It is related to, but not the same as, the prompt in my standalone{" "}
            <a
              href="https://ai-powered-iam.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
            >
              IAM Policy Generator
            </a>
            .
          </p>
        </header>

        <OfficialRun latest={latest} history={history} />

        <EvalsTool caseCount={EVAL_CASES.length} />

        <footer className="mt-16 border-t border-edge pt-6 text-xs text-muted">
          {EVAL_CASES.length} fixed cases · deterministic rule-based grading, no LLM judge · canned examples are labeled
          and never graded
        </footer>
      </div>
    </main>
  );
}
