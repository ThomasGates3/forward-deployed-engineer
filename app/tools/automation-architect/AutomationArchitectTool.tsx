"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Step = { title: string; detail: string };
type ApiResponse = {
  ok: boolean;
  source: "live" | "fallback";
  data: { trigger: string; steps: Step[] };
  reason?: string;
};

const EXAMPLES = [
  "onboard a new SaaS customer from signup to first value",
  "qualify inbound sales leads and route hot ones to reps",
  "process a refund request from a support ticket",
];

function toPlainText(d: { trigger: string; steps: Step[] }) {
  const lines = [`Trigger: ${d.trigger}`, ""];
  d.steps.forEach((s, i) => lines.push(`${i + 1}. ${s.title} — ${s.detail}`));
  return lines.join("\n");
}

export default function AutomationArchitectTool() {
  const [process, setProcess] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function design() {
    if (!process.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/automation-architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ process: process.trim() }),
      });
      const json: ApiResponse = await res.json();
      setResult(json);
    } catch {
      setError("link severed — could not reach the schematic engine. retry.");
    } finally {
      setLoading(false);
    }
  }

  async function copyFlow() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(toPlainText(result.data));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section className="mt-8 font-mono">
      {/* input panel */}
      <div className="border border-[#1e3a6b] bg-[#070d1c]/70 shadow-[0_0_40px_-16px_rgba(79,157,255,0.5)] backdrop-blur">
        <div className="flex items-center gap-2 border-b border-[#1e3a6b] bg-[#0a1428] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#57d0ff]/70">
          <span className="h-2 w-2 rounded-full bg-[#00e0ff]/60" />
          input :: process.spec
        </div>
        <div className="p-4 sm:p-6">
          <label htmlFor="process-input" className="mb-2 block text-xs text-[#7fb0ff]/80">
            <span className="text-[#57d0ff]">▸</span> describe the business process
          </label>
          <textarea
            id="process-input"
            data-testid="process-input"
            value={process}
            onChange={(e) => setProcess(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") design();
            }}
            rows={4}
            placeholder="e.g. when a lead fills out the demo form, enrich, score, and route to the right rep…"
            className="w-full resize-y border border-[#1e3a6b] bg-[#03060f] px-3 py-3 text-sm text-[#bcd6ff] caret-[#57d0ff] outline-none placeholder:text-[#4f7ac0]/50 focus:border-[#57d0ff] focus:shadow-[0_0_0_1px_#57d0ff]"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                data-testid="example-chip"
                onClick={() => setProcess(ex)}
                className="min-h-[36px] max-w-full truncate border border-[#1e3a6b] px-2.5 py-1 text-left text-[11px] text-[#7fb0ff]/70 transition-colors hover:border-[#57d0ff] hover:text-[#8fe6ff]"
              >
                {"◆ "}
                {ex}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="hidden text-[11px] text-[#4f7ac0]/70 sm:block">
              ⌘/Ctrl + Enter to run
            </span>
            <button
              type="button"
              data-testid="design-btn"
              onClick={design}
              disabled={loading || !process.trim()}
              className="inline-flex min-h-[44px] items-center gap-2 border border-[#57d0ff] bg-[#57d0ff]/10 px-6 py-2 text-sm font-bold uppercase tracking-wider text-[#aee6ff] transition-all hover:bg-[#57d0ff]/20 hover:shadow-[0_0_24px_-4px_rgba(87,208,255,0.8)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "drafting…" : "◈ Design workflow"}
            </button>
          </div>
        </div>
      </div>

      {/* loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            data-testid="loading-state"
            className="mt-6 flex items-center gap-3 text-sm text-[#57d0ff]/80"
          >
            <span className="h-2 w-2 animate-ping rounded-full bg-[#00e0ff]" />
            routing nodes &amp; tracing connections…
          </motion.div>
        )}
      </AnimatePresence>

      {/* error */}
      {error && (
        <div
          data-testid="error-state"
          className="mt-6 border border-[#5b2140] bg-[#1a0a12]/60 px-4 py-3 text-sm text-[#ff6b9d]"
        >
          {error}
        </div>
      )}

      {/* result graph */}
      <AnimatePresence>
        {result && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="workflow-result"
            className="mt-8"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#57d0ff]/70">
                <span className="h-2 w-2 rounded-full bg-[#00e0ff] shadow-[0_0_8px_#00e0ff]" />
                workflow.schematic
              </div>
              <div className="flex items-center gap-3">
                {result.source === "fallback" && (
                  <span
                    data-testid="fallback-note"
                    className="border border-[#6b5b1e] bg-[#1a1608]/60 px-2 py-1 text-[10px] uppercase tracking-wider text-[#e0c757]"
                  >
                    example output
                  </span>
                )}
                <button
                  type="button"
                  data-testid="copy-btn"
                  onClick={copyFlow}
                  className="inline-flex min-h-[44px] items-center gap-2 border border-[#1e3a6b] px-4 py-2 text-xs uppercase tracking-wider text-[#7fb0ff] transition-colors hover:border-[#57d0ff] hover:text-[#8fe6ff]"
                >
                  {copied ? "✓ copied" : "⧉ copy plain text"}
                </button>
              </div>
            </div>

            {/* node graph */}
            <div className="flex flex-col items-stretch">
              {/* trigger node */}
              <NodeCard
                testid="trigger-node"
                kind="trigger"
                index={0}
                label="TRIGGER"
                title={result.data.trigger}
              />
              <Connector />
              {result.data.steps.map((s, i) => (
                <div key={i}>
                  <NodeCard
                    testid={`step-node-${i}`}
                    kind="step"
                    index={i + 1}
                    label={`STEP ${i + 1}`}
                    title={s.title}
                    detail={s.detail}
                  />
                  {i < result.data.steps.length - 1 && <Connector />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Connector() {
  return (
    <div className="relative mx-auto h-10 w-px overflow-visible">
      <div className="absolute inset-0 bg-gradient-to-b from-[#57d0ff]/60 to-[#57d0ff]/20" />
      <motion.div
        className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#00e0ff] shadow-[0_0_10px_#00e0ff]"
        initial={{ top: "0%" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[#57d0ff]">▼</div>
    </div>
  );
}

function NodeCard({
  testid,
  kind,
  index,
  label,
  title,
  detail,
}: {
  testid: string;
  kind: "trigger" | "step";
  index: number;
  label: string;
  title: string;
  detail?: string;
}) {
  const isTrigger = kind === "trigger";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      data-testid={testid}
      className={`relative mx-auto w-full max-w-xl border ${
        isTrigger
          ? "border-[#00e0ff]/70 bg-[#062033]/80 shadow-[0_0_40px_-10px_rgba(0,224,255,0.7)]"
          : "border-[#2a4a80] bg-[#08122a]/80 shadow-[0_0_30px_-14px_rgba(79,157,255,0.6)]"
      } backdrop-blur`}
    >
      {/* corner ticks */}
      <span className="absolute -left-px -top-px h-2 w-2 border-l border-t border-[#57d0ff]" />
      <span className="absolute -right-px -top-px h-2 w-2 border-r border-t border-[#57d0ff]" />
      <span className="absolute -bottom-px -left-px h-2 w-2 border-b border-l border-[#57d0ff]" />
      <span className="absolute -bottom-px -right-px h-2 w-2 border-b border-r border-[#57d0ff]" />

      <div className="flex items-start gap-3 p-4 sm:p-5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
            isTrigger
              ? "border-[#00e0ff] text-[#00e0ff] shadow-[0_0_12px_-2px_#00e0ff]"
              : "border-[#4f9dff] text-[#8fbaff]"
          }`}
        >
          {isTrigger ? "⚡" : index}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`text-[10px] uppercase tracking-[0.25em] ${
              isTrigger ? "text-[#00e0ff]" : "text-[#57d0ff]/70"
            }`}
          >
            {label}
          </div>
          <div className="mt-1 break-words text-sm font-semibold text-white">{title}</div>
          {detail && (
            <p className="mt-1.5 break-words text-xs leading-relaxed text-[#9db8de]">{detail}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
