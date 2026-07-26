"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ApiResponse = {
  ok: boolean;
  source: "live" | "fallback";
  data: { systemPrompt: string; tools: string[] };
  reason?: string;
};

const EXAMPLES = [
  "a customer support agent for a crypto exchange that handles KYC questions",
  "a research assistant that summarizes arxiv papers and drafts tweet threads",
  "a devops on-call agent that triages alerts and proposes runbooks",
];

export default function AgentDesignerTool() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/agent-designer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const json: ApiResponse = await res.json();
      setResult(json);
    } catch {
      setError("connection refused — network unreachable. retry.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPrompt() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.data.systemPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section className="mt-6">
      {/* input panel */}
      <div className="border border-[#1f4d18] bg-black/40">
        <div className="border-b border-[#1f4d18] bg-[#0a1408] px-3 py-2 text-xs text-[#39ff14]/60">
          input :: agent.spec
        </div>
        <div className="p-4 sm:p-5">
          <label htmlFor="agent-desc" className="mb-2 block text-xs text-[#39ff14]/70">
            <span className="text-[#7dff5e]">$</span> describe the agent you want to build
          </label>
          <textarea
            id="agent-desc"
            data-testid="description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate();
            }}
            rows={4}
            placeholder="e.g. a support agent that investigates failed forex trades and drafts empathetic replies…"
            className="w-full resize-y rounded-none border border-[#1f4d18] bg-[#020402] px-3 py-3 text-sm text-[#7dff5e] caret-[#39ff14] outline-none placeholder:text-[#39ff14]/25 focus:border-[#39ff14] focus:shadow-[0_0_0_1px_#39ff14]"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                data-testid="example-chip"
                onClick={() => setDescription(ex)}
                className="min-h-[36px] max-w-full truncate border border-[#1f4d18] px-2 py-1 text-left text-[11px] text-[#39ff14]/60 transition-colors hover:border-[#39ff14] hover:text-[#7dff5e]"
              >
                {"> "}
                {ex}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="hidden text-[11px] text-[#39ff14]/40 sm:block">
              ⌘/Ctrl + Enter to run
            </span>
            <button
              type="button"
              data-testid="generate-btn"
              onClick={generate}
              disabled={loading || !description.trim()}
              className="inline-flex min-h-[44px] items-center gap-2 border border-[#39ff14] bg-[#39ff14]/10 px-6 py-2 text-sm font-bold uppercase tracking-wider text-[#7dff5e] transition-all hover:bg-[#39ff14]/20 hover:shadow-[0_0_20px_-4px_rgba(57,255,20,0.6)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "compiling…" : "▶ generate"}
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
            className="mt-6 border border-[#1f4d18] bg-black/40 p-5 font-mono text-sm text-[#39ff14]/80"
          >
            <ThinkingLines />
          </motion.div>
        )}
      </AnimatePresence>

      {/* error */}
      {error && (
        <div
          data-testid="error-state"
          className="mt-6 border border-[#ff5f56]/60 bg-[#ff5f56]/10 p-4 text-sm text-[#ff8a82]"
        >
          <span className="font-bold">✗ error:</span> {error}
        </div>
      )}

      {/* result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="result"
            className="mt-6 space-y-5"
          >
            {result.source === "fallback" && (
              <div
                data-testid="fallback-note"
                className="border border-[#ffbd2e]/50 bg-[#ffbd2e]/10 px-3 py-2 text-xs text-[#ffd479]"
              >
                ⚠ example response (daily limit) — this is a canned sample, not an error.
                {result.reason ? ` [${result.reason}]` : ""}
              </div>
            )}

            {/* system prompt */}
            <div className="border border-[#1f4d18] bg-black/40">
              <div className="flex items-center justify-between border-b border-[#1f4d18] bg-[#0a1408] px-3 py-2">
                <span className="text-xs text-[#39ff14]/60">output :: system_prompt.md</span>
                <button
                  type="button"
                  data-testid="copy-btn"
                  onClick={copyPrompt}
                  className="inline-flex min-h-[36px] items-center gap-1 border border-[#1f4d18] px-3 py-1 text-xs text-[#39ff14]/80 transition-colors hover:border-[#39ff14] hover:text-[#7dff5e]"
                >
                  {copied ? "✓ copied" : "⧉ copy"}
                </button>
              </div>
              <pre
                data-testid="system-prompt"
                className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words px-4 py-4 text-[13px] leading-relaxed text-[#9dffb0]"
              >
                {result.data.systemPrompt}
              </pre>
            </div>

            {/* tools */}
            <div className="border border-[#1f4d18] bg-black/40">
              <div className="border-b border-[#1f4d18] bg-[#0a1408] px-3 py-2 text-xs text-[#39ff14]/60">
                output :: tools[] ({result.data.tools.length})
              </div>
              <ul data-testid="tools-list" className="divide-y divide-[#1f4d18]/60">
                {result.data.tools.map((tool, i) => (
                  <li
                    key={`${tool}-${i}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#7dff5e]"
                  >
                    <span className="text-[#39ff14]/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[#39ff14]/50">›</span>
                    <span className="break-words">{tool}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ThinkingLines() {
  const lines = [
    "› parsing mission statement…",
    "› resolving agent capabilities…",
    "› synthesizing system prompt…",
    "› provisioning tool manifest…",
  ];
  return (
    <div className="space-y-1">
      {lines.map((l, i) => (
        <motion.div
          key={l}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
        >
          {l}
        </motion.div>
      ))}
      <div className="pt-1 text-[#7dff5e]">
        compiling
        <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-[#39ff14]" />
      </div>
    </div>
  );
}
