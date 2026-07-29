import { guardedClaude, clampInput } from "@/lib/ai-rate-limit";
import { fallbacks } from "@/content/fallbacks";

export type Citation = { chunk_index: number; quote: string };
export type DocQAResult = {
  answer: string;
  relevant_chunk_indices: number[];
  citations: Citation[];
};

const SYSTEM = `You are a retrieval-augmented Q&A engine. You are given a QUESTION and a numbered list of DOCUMENT CHUNKS retrieved from a source document. You must:
1. Identify which chunk numbers are actually relevant to answering the question.
2. Answer the question using ONLY information found in those relevant chunks — never use outside knowledge, never invent facts not present in the chunks.
3. Cite your sources inline in the answer text as [Source N] referencing chunk numbers.
4. If the chunks don't contain enough information to answer, say so plainly instead of guessing.

Return ONLY strict, minified JSON matching exactly this shape — no prose, no markdown fences:
{"relevant_chunk_indices":[<int>,...],"answer":"<string with inline [Source N] citations>","citations":[{"chunk_index":<int>,"quote":"<short exact substring copied verbatim from that chunk, max ~200 chars>"}]}

Rules:
- relevant_chunk_indices and citations must only reference chunk numbers that were actually provided.
- quote must be an exact, verbatim substring of the referenced chunk (do not paraphrase it).
- Keep answer under 120 words.`;

// Split on paragraph boundaries into ~500-900 char passages — genuine chunking, not whole-doc stuffing.
function chunkDocument(doc: string): string[] {
  const paras = doc.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const p of paras) {
    if (current && (current.length + p.length + 2 > 900)) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
    if (current.length >= 500 && current.length <= 900) {
      chunks.push(current);
      current = "";
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [doc];
}

function parse(raw: string): DocQAResult {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const obj = JSON.parse(cleaned) as unknown;
  if (
    !obj ||
    typeof obj !== "object" ||
    typeof (obj as DocQAResult).answer !== "string" ||
    (obj as DocQAResult).answer.trim() === "" ||
    !Array.isArray((obj as DocQAResult).relevant_chunk_indices) ||
    !(obj as DocQAResult).relevant_chunk_indices.every((n) => typeof n === "number") ||
    !Array.isArray((obj as DocQAResult).citations) ||
    !(obj as DocQAResult).citations.every(
      (c) =>
        c &&
        typeof c === "object" &&
        typeof c.chunk_index === "number" &&
        typeof c.quote === "string" &&
        c.quote.trim() !== ""
    )
  ) {
    throw new Error("bad shape");
  }
  return obj as DocQAResult;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { document?: unknown; question?: unknown };
  const document = clampInput(body.document, 6000);
  const question = clampInput(body.question, 500);

  if (!document || !question) {
    return Response.json(
      { ok: false, error: "document and question are required" },
      { status: 400 }
    );
  }

  const chunks = chunkDocument(document);
  const numbered = chunks.map((c, i) => `[Chunk ${i + 1}]\n${c}`).join("\n\n");

  const result = await guardedClaude<DocQAResult>({
    req,
    tool: "doc-qa",
    system: SYSTEM,
    buildMessages: () => [
      {
        role: "user",
        content: `DOCUMENT CHUNKS:\n\n${numbered}\n\nQUESTION: ${question}`,
      },
    ],
    parse,
    fallback: fallbacks["doc-qa"] as unknown as DocQAResult,
    maxTokens: 500,
    perVisitorCap: 4,
  });

  // Attach the exact retrieved chunk text for whichever indices were cited, so the UI can
  // render the grounding passage. Only meaningful for a live call against the real doc —
  // the canned fallback ships its own self-consistent quote instead.
  const data = result.data;
  const citations = data.citations.map((c) => ({
    ...c,
    chunkText: result.source === "live" ? chunks[c.chunk_index - 1] ?? c.quote : c.quote,
  }));

  return Response.json({ ...result, data: { ...data, citations }, chunkCount: chunks.length });
}
