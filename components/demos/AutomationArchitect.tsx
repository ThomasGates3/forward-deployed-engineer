"use client";
import { useState } from "react";
import { useDemo } from "./useDemo";
import { DemoResultArea } from "./DemoShell";
import { Button, CopyButton } from "@/components/ui";
import type { Workflow } from "@/app/api/ai/automation-architect/route";

function toPlainText(w: Workflow): string {
  const lines = [`Trigger: ${w.trigger}`, ""];
  w.steps.forEach((s, i) => lines.push(`${i + 1}. ${s.title} — ${s.detail}`));
  return lines.join("\n");
}

function Arrow() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <span className="font-mono text-lg leading-none text-accent/60">↓</span>
    </div>
  );
}

const EXAMPLES = [
  "When a new customer signs up, send a welcome email, add them to the CRM, and notify the sales team in Slack.",
  "Every time an invoice is paid in Stripe, generate a receipt PDF and file it in the right Google Drive folder.",
  "When a support ticket is tagged urgent, summarize it, assign it to an on-call engineer, and post to the incidents channel.",
  "Each morning, pull yesterday's signups, score them for fit, and email the founder a ranked shortlist.",
  "When someone books a demo on Calendly, enrich their company, draft a tailored agenda, and send it to the rep.",
];
const RANDOM_LIMIT = 2;

export function AutomationArchitect() {
  const [process, setProcess] = useState("");
  const [randomsLeft, setRandomsLeft] = useState(RANDOM_LIMIT);
  const { state, run } = useDemo<Workflow>("automation-architect");
  const loading = state.status === "loading";

  function surpriseMe() {
    if (randomsLeft <= 0 || loading) return;
    const pick = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    setProcess(pick);
    setRandomsLeft((n) => n - 1);
    run({ process: pick });
  }

  return (
    <div>
      <textarea
        value={process}
        onChange={(e) => setProcess(e.target.value)}
        placeholder="Describe a business process in a sentence or two…"
        rows={3}
        className="w-full rounded-lg border border-edge bg-surface/70 p-3 font-mono text-sm text-cream placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={() => run({ process })} disabled={loading || !process.trim()}>
          {loading ? "Designing…" : "Design workflow →"}
        </Button>
        <Button variant="outline" onClick={surpriseMe} disabled={loading || randomsLeft <= 0}>
          🎲 Random {randomsLeft < RANDOM_LIMIT ? `(${randomsLeft} left)` : ""}
        </Button>
      </div>
      {randomsLeft <= 0 && (
        <p className="mt-2 font-mono text-[11px] text-muted">
          You've used both random examples — type your own process to keep going.
        </p>
      )}

      <DemoResultArea
        status={state.status}
        source={state.status === "done" ? state.source : undefined}
        reason={state.status === "done" ? state.reason : undefined}
      >
        {state.status === "done" && (
          <div className="space-y-4">
            <div className="mx-auto max-w-md">
              {/* Trigger box — accent-accented */}
              <div className="rounded-xl border border-accent/50 bg-accent/10 p-4 shadow-glow">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-accent">● Trigger</p>
                <p className="text-sm text-cream">{state.data.trigger}</p>
              </div>

              {/* Steps as connected boxes */}
              {state.data.steps.map((step, i) => (
                <div key={i}>
                  <Arrow />
                  <div className="rounded-xl border border-edge bg-ink/50 p-4">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                      Step {i + 1} · {step.title}
                    </p>
                    <p className="text-sm text-cream">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <CopyButton text={toPlainText(state.data)} label="Copy plan" />
            </div>
          </div>
        )}
      </DemoResultArea>
    </div>
  );
}
