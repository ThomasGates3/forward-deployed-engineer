"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Field = { key: string; value: string };
type ApiResponse = {
  ok: true;
  source: "live" | "fallback";
  data: { fields: Field[] };
  reason?: string;
};

const SAMPLE = `INVOICE — Northwind Trading Co.
billed to: Acme Robotics, 44 Foundry Rd, Detroit MI
inv #NW-20418 ... dated apr 3 2026, net-30 so due may 3

hey — items below, prices in USD
- 12x servo motor SM-9  @ 42.50 = 510.00
- 3 controller boards (rev C) 189 each -> 567
- shipping/handling ...... 38.75

subtotal 1115.75, tax(6%) 66.95 total due = 1182.70
pay to acct 0091-33-2 (Midwest Bank). questions: ap@northwind.co / 313-555-0142`;

export default function ExtractTool({ serifClass }: { serifClass: string }) {
  const [text, setText] = useState(SAMPLE);
  const [fields, setFields] = useState<Field[] | null>(null);
  const [source, setSource] = useState<"live" | "fallback" | null>(null);
  const [reason, setReason] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json()) as ApiResponse;
      setFields(json.data.fields);
      setSource(json.source);
      setReason(json.reason);
    } catch {
      setError("Could not reach the extractor. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(f);
  }

  function copyJson() {
    if (!fields) return;
    const obj: Record<string, string> = {};
    for (const f of fields) obj[f.key] = f.value;
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  const label = "text-[11px] font-bold uppercase tracking-[0.25em]";

  return (
    <section className="mt-8 grid gap-8 lg:grid-cols-2">
      {/* INPUT */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={label}>Unstructured in</span>
          <div className="flex items-center gap-2">
            <button
              data-testid="upload-btn"
              onClick={() => fileRef.current?.click()}
              className="min-h-[44px] border-2 border-black bg-transparent px-3 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-[#f4f1e9]"
            >
              Upload .txt
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,text/plain"
              onChange={onFile}
              className="hidden"
              data-testid="file-input"
            />
          </div>
        </div>
        <textarea
          data-testid="input-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="h-[360px] w-full resize-none border-[3px] border-black bg-[#fbfaf5] p-4 font-mono text-[13px] leading-relaxed outline-none focus:bg-white"
          style={{ boxShadow: "6px 6px 0 #111" }}
        />
        <button
          data-testid="extract-btn"
          onClick={run}
          disabled={loading || !text.trim()}
          className={`${serifClass} mt-5 min-h-[44px] w-full border-[3px] border-black px-6 py-3 text-2xl font-black italic tracking-tight transition disabled:opacity-40`}
          style={{ backgroundColor: "#8a1a10", color: "#f4f1e9", boxShadow: "6px 6px 0 #111" }}
        >
          {loading ? "Extracting…" : "Extract →"}
        </button>
        {error && (
          <p data-testid="error" className="mt-3 text-sm font-bold text-[#8a1a10]">
            {error}
          </p>
        )}
      </div>

      {/* OUTPUT */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={label}>Structured out</span>
          {fields && (
            <button
              data-testid="copy-btn"
              onClick={copyJson}
              className="min-h-[44px] border-2 border-black px-3 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-[#f4f1e9]"
            >
              {copied ? "Copied ✓" : "Copy JSON"}
            </button>
          )}
        </div>

        <div
          className="min-h-[360px] border-[3px] border-black bg-[#fbfaf5] p-1"
          style={{ boxShadow: "6px 6px 0 #111" }}
        >
          <AnimatePresence mode="wait">
            {!fields ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[352px] items-center justify-center p-8 text-center text-sm text-black/50"
              >
                The extracted record prints here once you run the extractor.
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {source === "fallback" && (
                  <div
                    data-testid="fallback-note"
                    className="m-1 border-2 border-dashed border-[#8a1a10] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a1a10]"
                  >
                    Example output {reason ? `· ${reason}` : "· live model unavailable"}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table data-testid="result-table" className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b-[3px] border-black text-left">
                        <th className={`${label} p-3`}>Field</th>
                        <th className={`${label} p-3`}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((f, i) => (
                        <tr key={f.key + i} className="border-b border-black/20 align-top">
                          <td className="whitespace-nowrap p-3 font-mono text-[12px] font-bold text-[#8a1a10]">
                            {f.key}
                          </td>
                          <td className="p-3 font-medium">{f.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
