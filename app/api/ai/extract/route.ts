import { guardedClaude, clampInput } from "@/lib/ai-rate-limit";
import { fallbacks } from "@/content/fallbacks";

export type ExtractResult = { fields: { key: string; value: string }[] };

const SYSTEM = `You are a data extraction engine. Given messy, unstructured input (invoices, handwritten-style notes, jumbled emails, receipts), extract every meaningful piece of data.

Return ONLY strict, minified JSON matching exactly this shape — no prose, no markdown fences:
{"fields":[{"key":"<snake_case_key>","value":"<string value>"}]}

Rules:
- Flatten any nested structure into flat key/value pairs.
- Keys MUST be snake_case (e.g. invoice_number, due_date, line_item_1_total).
- Values are strings (stringify numbers/dates). Keep original formatting of amounts.
- Only include fields that are actually present in the input. Do not invent data.`;

function parse(raw: string): ExtractResult {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const obj = JSON.parse(cleaned) as unknown;
  if (
    !obj ||
    typeof obj !== "object" ||
    !Array.isArray((obj as ExtractResult).fields) ||
    !(obj as ExtractResult).fields.every(
      (f) =>
        f &&
        typeof f === "object" &&
        typeof f.key === "string" &&
        f.key.trim() !== "" &&
        typeof f.value === "string"
    )
  ) {
    throw new Error("bad shape");
  }
  const fields = (obj as ExtractResult).fields.map((f) => ({
    key: f.key.trim(),
    value: f.value,
  }));
  if (fields.length === 0) throw new Error("empty");
  return { fields };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { text?: unknown };
  const text = clampInput(body.text, 4000);

  const result = await guardedClaude<ExtractResult>({
    req,
    tool: "extract",
    system: SYSTEM,
    buildMessages: () => [
      { role: "user", content: `Extract structured data from this:\n\n${text}` },
    ],
    parse,
    fallback: fallbacks["extract"] as unknown as ExtractResult,
    maxTokens: 500,
  });

  return Response.json(result);
}
