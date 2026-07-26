"use client";
import { useState } from "react";
import { Button, Badge, CopyButton } from "@/components/ui";
import { DemoResultArea } from "@/components/demos/DemoShell";
import { useDemo } from "@/components/demos/useDemo";

type SupportReplyData = { reply: string; notes: string[] };

const PRESETS = [
  { id: "refund-delay", label: "Refund delay" },
  { id: "account-access", label: "Account access" },
  { id: "billing-question", label: "Billing question" },
] as const;

export function SupportReply() {
  const { state, run } = useDemo<SupportReplyData>("support-reply");
  const [scenario, setScenario] = useState<string>("refund-delay");
  const [message, setMessage] = useState("");
  const loading = state.status === "loading";

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            variant={scenario === p.id ? "solid" : "outline"}
            onClick={() => setScenario(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-muted">
        Or paste a customer message
      </label>
      <textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setScenario("custom");
        }}
        onFocus={() => setScenario("custom")}
        rows={4}
        placeholder="e.g. My account was frozen and I don't know why…"
        className="w-full resize-y rounded-lg border border-edge bg-surface/70 p-3 font-mono text-sm text-cream placeholder:text-muted/60 focus:border-accent focus:outline-none"
      />

      <div className="mt-4">
        <Button
          variant="solid"
          disabled={loading || (scenario === "custom" && !message.trim())}
          onClick={() => run({ scenario, message })}
        >
          {loading ? "Generating…" : "Generate reply →"}
        </Button>
      </div>

      <DemoResultArea
        status={state.status}
        source={state.status === "done" ? state.source : undefined}
        reason={state.status === "done" ? state.reason : undefined}
      >
        {state.status === "done" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-edge bg-ink/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  Suggested reply
                </span>
                <CopyButton text={state.data.reply} label="Copy reply" />
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream">
                {state.data.reply}
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone="accent">Compliant</Badge>
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  Compliance & tone check
                </span>
              </div>
              <ul className="space-y-1.5">
                {state.data.notes.map((n, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted">
                    <span className="text-accent">✓</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </DemoResultArea>
    </div>
  );
}
