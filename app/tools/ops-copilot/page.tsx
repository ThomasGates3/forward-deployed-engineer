import type { Metadata } from "next";
import Link from "next/link";
import OpsCopilotTool from "./OpsCopilotTool";

export const metadata: Metadata = {
  title: "Ops Copilot: Real Tool-Calling Agent",
  description:
    "A multi-turn agent that calls real tools against a mock dataset and pauses for human confirmation before sensitive actions.",
};

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-ink text-cream">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-16">
        <Link
          href="/"
          data-testid="back-link"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted transition hover:text-[#F2C94C]"
        >
          ← Back to portfolio
        </Link>

        <header className="mt-8">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#D4AF37]">
            Ops Copilot
          </p>
          <h1 className="font-display text-section text-cream">
            A real tool-calling agent, not a chatbot wrapper.
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            This runs Claude&apos;s actual function-calling API against a small mock
            order/inventory dataset. Watch it decide which tool to call, see the
            tool call and its result rendered inline, and for the sensitive
            refund tool, watch it stop and ask for human confirmation before
            taking any action.
          </p>
        </header>

        <div className="mt-10">
          <OpsCopilotTool />
        </div>
      </div>
    </main>
  );
}
