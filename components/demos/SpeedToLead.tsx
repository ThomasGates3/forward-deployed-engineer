"use client";
import { useState } from "react";
import { Button, Badge, CopyButton } from "@/components/ui";
import { DemoResultArea } from "@/components/demos/DemoShell";
import { useDemo } from "@/components/demos/useDemo";

type LeadResult = {
  verdict: string;
  score: number;
  reasoning: string;
  followupEmail: string;
  sms: string;
  emailSent?: boolean;
};

export function SpeedToLead() {
  const { state, run } = useDemo<LeadResult>("speed-to-lead");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const loading = state.status === "loading";
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const field =
    "w-full rounded-lg border border-edge bg-surface/60 px-3 py-2.5 font-mono text-sm text-cream placeholder:text-muted focus:border-accent focus:outline-none";

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Pose as your own inbound lead — use{" "}
        <span className="text-cream">your real name and email</span>. Claude qualifies
        the (fake) lead live and emails the drafted follow-up straight to you.
      </p>

      <div className="space-y-3">
        <input
          className={field}
          placeholder="Your name (the lead)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="lead-name"
        />
        <input
          className={field}
          type="email"
          placeholder="Your email — the follow-up lands here"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="lead-email"
        />
        <textarea
          className={`${field} min-h-[96px] resize-y`}
          placeholder="A short message as if you were the lead (e.g. 'We want to speed up lead response this quarter…')"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          data-testid="lead-message"
        />
      </div>

      <div className="mt-4">
        <Button
          onClick={() => run({ name, email, message })}
          disabled={loading || !valid}
          data-testid="lead-submit"
        >
          {loading ? "Qualifying…" : "Qualify & send to me →"}
        </Button>
        {!valid && email.length > 0 && (
          <p className="mt-2 font-mono text-xs text-amber-300">Enter a valid email.</p>
        )}
      </div>

      <DemoResultArea
        status={state.status}
        source={state.status === "done" ? state.source : undefined}
        reason={state.status === "done" ? state.reason : undefined}
      >
        {state.status === "done" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="accent">
                {state.data.verdict} · {state.data.score}/100
              </Badge>
            </div>

            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                Claude&apos;s reasoning
              </p>
              <p className="text-sm leading-relaxed text-cream">{state.data.reasoning}</p>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  Drafted follow-up email
                </p>
                <CopyButton text={state.data.followupEmail} label="Copy email" />
              </div>
              <div className="whitespace-pre-wrap rounded-lg border border-edge bg-surface/60 p-4 text-sm leading-relaxed text-cream">
                {state.data.followupEmail}
              </div>
              {state.data.emailSent && (
                <p className="mt-2 font-mono text-xs text-accent">
                  ✓ Real email sent to {email}
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
                SMS first-touch
              </p>
              <div className="mx-auto max-w-[280px] rounded-[2rem] border border-edge bg-black/60 p-3 shadow-card">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="font-mono text-[10px] text-muted">Messages</span>
                  <Badge tone="amber">Simulated delivery</Badge>
                </div>
                <div className="rounded-2xl rounded-bl-md bg-accent/15 px-3.5 py-2.5 text-sm text-cream">
                  {state.data.sms}
                </div>
                <p className="mt-2 px-1 font-mono text-[10px] text-muted">
                  No real SMS is sent — Twilio is wired in the production build.
                </p>
              </div>
            </div>
          </div>
        )}
      </DemoResultArea>
    </div>
  );
}
