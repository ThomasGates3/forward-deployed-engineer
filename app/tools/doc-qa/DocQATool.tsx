"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Card, Badge, FallbackNote } from "@/components/ui";
import { ThinkingBar } from "@/components/motion";
import { HANDBOOK, SUPPORT_KB } from "./samples";

type Citation = { chunk_index: number; quote: string; chunkText: string };
type DocQAResult = { answer: string; relevant_chunk_indices: number[]; citations: Citation[] };
type ApiResponse = {
  ok: true;
  source: "live" | "fallback";
  data: DocQAResult;
  reason?: string;
  chunkCount?: number;
};

const SAMPLES = [
  { id: "handbook", label: "Employee Handbook", text: HANDBOOK, sampleQ: "How much PTO do I get and does it roll over?" },
  { id: "kb", label: "Product & API Support KB", text: SUPPORT_KB, sampleQ: "What's the refund policy if I cancel within two weeks?" },
] as const;

export default function DocQATool() {
  const [docChoice, setDocChoice] = useState<string>("handbook");
  const [customText, setCustomText] = useState("");
  const [question, setQuestion] = useState<string>(SAMPLES[0].sampleQ);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docOpen, setDocOpen] = useState(false);

  const activeSample = SAMPLES.find((s) => s.id === docChoice);
  const document = docChoice === "custom" ? customText : activeSample?.text ?? "";

  function pickDoc(id: string) {
    setDocChoice(id);
    setResult(null);
    setError(null);
    const s = SAMPLES.find((x) => x.id === id);
    if (s) setQuestion(s.sampleQ);
  }

  async function run() {
    if (!document.trim() || !question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/doc-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, question }),
      });
      const json = (await res.json()) as ApiResponse | { ok: false; error: string };
      if (!("data" in json)) {
        setError(json.error || "Something went wrong.");
        return;
      }
      setResult(json);
    } catch {
      setError("Could not reach the Q&A engine. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      {/* LEFT: source + question */}
      <div className="space-y-6">
        <Card className="p-5">
          <p className="eyebrow mb-3">1 · Choose a source document</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                data-testid={`sample-doc-${s.id}`}
                onClick={() => pickDoc(s.id)}
                className={`min-h-[44px] rounded-lg border px-3 text-sm font-mono transition ${
                  docChoice === s.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-edge text-muted hover:border-accent/50 hover:text-cream"
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              data-testid="sample-doc-custom"
              onClick={() => pickDoc("custom")}
              className={`min-h-[44px] rounded-lg border px-3 text-sm font-mono transition ${
                docChoice === "custom"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-edge text-muted hover:border-accent/50 hover:text-cream"
              }`}
            >
              Paste your own
            </button>
          </div>

          {docChoice === "custom" ? (
            <textarea
              data-testid="custom-doc-input"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste up to ~6,000 characters of source text to ground answers in…"
              className="mt-4 h-56 w-full resize-none rounded-lg border border-edge bg-ink p-3 font-mono text-[13px] leading-relaxed text-cream outline-none focus:border-accent"
            />
          ) : (
            <div className="mt-4">
              <button
                data-testid="toggle-doc-view"
                onClick={() => setDocOpen((v) => !v)}
                className="min-h-[44px] text-xs font-mono uppercase tracking-wider text-muted hover:text-accent"
              >
                {docOpen ? "Hide document ▲" : "View full document ▼"}
              </button>
              {docOpen && (
                <div
                  data-testid="doc-preview"
                  className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-edge bg-ink p-3 font-mono text-[12px] leading-relaxed text-muted"
                >
                  {document}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="eyebrow mb-3">2 · Ask a question</p>
          <textarea
            data-testid="question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="h-24 w-full resize-none rounded-lg border border-edge bg-ink p-3 text-sm leading-relaxed text-cream outline-none focus:border-accent"
            placeholder="Ask something answerable from the document above…"
          />
          <Button
            data-testid="ask-btn"
            onClick={run}
            disabled={loading || !document.trim() || !question.trim()}
            className="mt-4 w-full"
          >
            {loading ? "Retrieving…" : "Ask →"}
          </Button>
          {loading && (
            <div className="mt-3">
              <ThinkingBar />
            </div>
          )}
          {error && (
            <p data-testid="error" className="mt-3 text-sm text-amber-300">
              {error}
            </p>
          )}
        </Card>
      </div>

      {/* RIGHT: answer + sources */}
      <Card className="p-5">
        <p className="eyebrow mb-3">Grounded answer</p>
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-edge p-8 text-center text-sm text-muted"
            >
              The answer and its cited source passages will appear here, grounded in
              retrieved chunks of the document, not the model's general knowledge.
            </motion.div>
          ) : (
            <motion.div
              key="result"
              data-testid="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {result.source === "fallback" && <FallbackNote reason={result.reason ?? "error"} />}

              <div data-testid="answer" className="rounded-lg border border-edge bg-ink p-4 text-sm leading-relaxed text-cream">
                {result.data.answer}
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone="accent">Sources</Badge>
                  <span className="text-xs text-muted">
                    Retrieved {result.data.relevant_chunk_indices.length} of {result.chunkCount ?? "?"} chunks
                  </span>
                </div>
                <div className="space-y-3" data-testid="sources-panel">
                  {result.data.citations.map((c, i) => (
                    <div key={i} data-testid={`citation-${c.chunk_index}`} className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                      <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-accent">
                        [Source {c.chunk_index}]
                      </p>
                      <p className="text-sm italic leading-relaxed text-cream/90">"{c.chunkText}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
