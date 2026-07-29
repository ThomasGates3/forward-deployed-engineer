import type { Metadata } from "next";
import Link from "next/link";
import DocQATool from "./DocQATool";

export const metadata: Metadata = {
  title: "Document Q&A: Retrieval-Augmented Answers",
  description: "Ask a question and get an answer grounded in cited passages retrieved from a document, not hallucinated from general knowledge.",
};

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-ink text-cream">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-10 md:py-14">
        <Link
          href="/"
          data-testid="back-link"
          className="inline-flex min-h-[44px] items-center gap-2 font-mono text-sm text-muted hover:text-accent"
        >
          ← Back to portfolio
        </Link>

        <header className="mt-8 max-w-3xl">
          <p className="eyebrow mb-3">Retrieval-augmented generation</p>
          <h1 className="font-display text-section text-cream">
            Document Q&A, <span className="text-accent">grounded in citations</span>
          </h1>
          <p className="mt-4 text-muted">
            This is the core FDE pattern for putting AI in front of a client's own docs. Instead of
            stuffing the whole file into context and hoping, it chunks the document, retrieves only
            the passages relevant to the question, and forces the model to answer from (and cite)
            exactly those passages. Every claim below traces back to a quoted source chunk on the right.
          </p>
        </header>

        <div className="mt-10">
          <DocQATool />
        </div>

        <footer className="mt-14 border-t border-edge pt-6 font-mono text-[11px] uppercase tracking-widest text-muted">
          Chunk → retrieve → answer with citations · demo runs on Claude Haiku
        </footer>
      </div>
    </main>
  );
}
