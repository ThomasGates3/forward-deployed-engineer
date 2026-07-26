"use client";
import { useRef, useState } from "react";
import { useDemo } from "./useDemo";
import { DemoResultArea } from "./DemoShell";
import { Button, CopyButton } from "@/components/ui";
import type { ExtractResult } from "@/app/api/ai/extract/route";

const EXAMPLE = `From: accounts@northwind-supplies.co
Subj: inv 2043 — pls remit

Hey — attaching the numbers for last month's order below, sorry it's a mess.

Northwind Supplies Ltd, order dated 14 March 2026.
3x oak pallets @ 220 = 660
freight/handling 180
misc packaging 400.00
subtotal comes to 1,240.00, tax (8%) 99.20 so total due 1,339.20 USD.
net-30, so due by Apr 13. Ref our PO 88-C on the wire.

Thanks, Dana`;

function toJson(fields: ExtractResult["fields"]) {
  const obj: Record<string, string> = {};
  for (const f of fields) obj[f.key] = f.value;
  return JSON.stringify(obj, null, 2);
}

export function Extract() {
  const [text, setText] = useState(EXAMPLE);
  const fileRef = useRef<HTMLInputElement>(null);
  const { state, run } = useDemo<ExtractResult>("extract");
  const loading = state.status === "loading";

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? "").slice(0, 4000));
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div>
      <p className="mb-3 font-mono text-xs text-muted">
        The integration wall: unstructured mess in{" "}
        <span className="text-ember">→</span> clean structured JSON out.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a messy invoice, note, or jumbled data…"
        rows={10}
        className="w-full rounded-lg border border-edge bg-surface/70 p-3 font-mono text-xs leading-relaxed text-cream placeholder:text-muted focus:border-ember focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={() => run({ text })} disabled={loading || !text.trim()}>
          {loading ? "Extracting…" : "Extract → JSON"}
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          Upload .txt
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,text/plain"
          onChange={onFile}
          className="hidden"
        />
      </div>

      <DemoResultArea
        status={state.status}
        source={state.status === "done" ? state.source : undefined}
        reason={state.status === "done" ? state.reason : undefined}
      >
        {state.status === "done" && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-edge">
              <table className="w-full border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-edge bg-ink/60 text-left">
                    <th className="px-4 py-2 font-medium uppercase tracking-wider text-muted">
                      Key
                    </th>
                    <th className="px-4 py-2 font-medium uppercase tracking-wider text-muted">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.fields.map((f, i) => (
                    <tr key={i} className="border-b border-edge/50 last:border-0">
                      <td className="whitespace-nowrap px-4 py-2 text-ember">{f.key}</td>
                      <td className="px-4 py-2 text-cream">{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <CopyButton text={toJson(state.data.fields)} label="Copy JSON" />
            </div>
          </div>
        )}
      </DemoResultArea>
    </div>
  );
}
