"use client";
import { useState } from "react";
import { Button, Card, Badge, CopyButton } from "@/components/ui";
import { ThinkingBar } from "@/components/motion";
import type { LeadPipeline } from "@/app/api/ai/speed-to-lead-pipeline/route";

type Data = LeadPipeline & { emailSent?: boolean };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STAGES = ["Lead captured", "Enrich", "Qualify", "Branch", "Notify", "Dashboard"];

export function SpeedToLeadPipeline() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [src, setSrc] = useState<"live" | "fallback">("live");

  const validEmail = EMAIL_RE.test(email);

  async function run() {
    setLoading(true);
    setData(null);
    try {
      const r = await fetch("/api/ai/speed-to-lead-pipeline", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const j = await r.json();
      if (j.ok === false) return;
      setData(j.data);
      setSrc(j.source);
    } catch {
      /* guarded route never throws */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input data-testid="stl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (pose as the lead)"
          className="rounded-lg border border-edge bg-surface/70 p-3 font-mono text-sm text-cream placeholder:text-muted focus:border-accent focus:outline-none" />
        <input data-testid="stl-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your real email (you'll get the follow-up)"
          className="rounded-lg border border-edge bg-surface/70 p-3 font-mono text-sm text-cream placeholder:text-muted focus:border-accent focus:outline-none" />
      </div>
      <textarea data-testid="stl-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="A short inbound message… e.g. 'We want to cut lead response time this quarter.'"
        className="mt-3 w-full resize-y rounded-lg border border-edge bg-surface/70 p-3 font-mono text-sm text-cream placeholder:text-muted focus:border-accent focus:outline-none" />
      <div className="mt-3">
        <Button data-testid="stl-run" onClick={run} disabled={loading || !validEmail}>
          {loading ? "Running pipeline…" : "Qualify & send to me →"}
        </Button>
        {!validEmail && email.length > 0 && <span className="ml-3 font-mono text-[11px] text-amber-300">Enter a valid email</span>}
      </div>

      {/* Stage tracker */}
      <div className="mt-5 flex flex-wrap gap-2">
        {STAGES.map((s, i) => (
          <span key={s} className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
            data || (loading && i === 0) ? "border-accent/50 bg-accent/10 text-accent" : "border-edge text-muted"
          }`}>
            {i + 1}. {s}
          </span>
        ))}
      </div>

      {loading && !data && (
        <div className="mt-5 space-y-3"><p className="font-mono text-xs text-muted">Pipeline running…</p><ThinkingBar /></div>
      )}

      {data && (
        <div className="mt-6 space-y-4">
          {src === "fallback" && <Badge tone="amber">Example run (daily limit)</Badge>}

          <Card className="p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-accent">Stage 2 · Enrich</p>
            <p className="text-sm text-cream">{data.enrichment.company} · <span className="text-muted">{data.enrichment.size}</span></p>
            <ul className="mt-2 space-y-1">
              {data.enrichment.signals.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted"><span className="text-accent">›</span>{s}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-accent">Stage 3 · Qualify (Claude)</p>
            <div className="flex items-center gap-2">
              <Badge tone="accent">{data.verdict} · {data.score}/100</Badge>
              <Badge tone={data.branch === "high-intent" ? "accent" : "edge"}>Branch: {data.branch}</Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-cream/90"><span className="text-muted">Reasoning: </span>{data.reasoning}</p>
          </Card>

          <Card className="p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-accent">Stage 5 · Notify</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Email draft</span>
                  <CopyButton text={data.followupEmail} label="Copy" />
                </div>
                <p className="whitespace-pre-wrap rounded-lg border border-edge bg-ink/40 p-3 text-sm text-cream">{data.followupEmail}</p>
                {data.emailSent ? (
                  <p className="mt-2 font-mono text-[11px] text-accent">✓ Real email sent to {email}</p>
                ) : (
                  <p className="mt-2 font-mono text-[11px] text-muted">Email send simulated (configure Resend to send for real)</p>
                )}
              </div>
              {/* Phone mockup */}
              <div>
                <span className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-muted">SMS</span>
                <div className="mx-auto max-w-[220px] rounded-[2rem] border-4 border-edge bg-black p-3">
                  <div className="rounded-2xl bg-surface p-3">
                    <p className="text-sm text-cream">{data.sms}</p>
                  </div>
                  <p className="mt-2 text-center"><Badge tone="amber">Simulated delivery</Badge></p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-accent">Stage 6 · Dashboard</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="text-muted">
                  <th className="pb-1 pr-4 font-mono text-[10px] uppercase">Lead</th>
                  <th className="pb-1 pr-4 font-mono text-[10px] uppercase">Score</th>
                  <th className="pb-1 pr-4 font-mono text-[10px] uppercase">Branch</th>
                  <th className="pb-1 font-mono text-[10px] uppercase">Status</th>
                </tr></thead>
                <tbody><tr className="border-t border-edge text-cream">
                  <td className="py-2 pr-4">{name || email}</td>
                  <td className="py-2 pr-4">{data.score}</td>
                  <td className="py-2 pr-4">{data.branch}</td>
                  <td className="py-2 text-accent">{data.emailSent ? "Emailed" : "Drafted"}</td>
                </tr></tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
