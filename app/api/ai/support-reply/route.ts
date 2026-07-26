import { guardedClaude, clampInput } from "@/lib/ai-rate-limit";
import { fallbacks } from "@/content/fallbacks";

export type SupportReply = { reply: string; notes: string[] };

const SYSTEM = `You are a customer support agent for a modern SaaS product. You are helpful, calm, and professional.

Hard rules:
- NEVER promise refunds, credits, or outcomes you can't verify.
- NEVER guarantee exact timelines (use ranges/qualifiers like "typically" and "may vary").
- ALWAYS give the customer a self-serve step they can take first.
- ALWAYS give a clear escalation path (what to send, who it goes to).
- Reassure without over-promising; keep the brand professional and warm.

Return ONLY strict, minified JSON matching exactly this shape — no prose, no markdown fences:
{"reply":"<the full on-brand reply to the customer>","notes":["<3 to 5 short tone/quality notes explaining why the reply is safe and on-brand>"]}`;

const SCENARIOS: Record<string, string> = {
  "refund-delay":
    "Hi, I cancelled my subscription over a week ago and requested a refund but I still haven't seen the money back on my card. Where is it? Is something wrong?",
  "account-access":
    "I'm locked out of my account — the password reset email never arrives and I've checked my spam folder. I need to get back in today for a client demo.",
  "billing-question":
    "I was charged twice this month and I don't understand why. One charge is the normal amount and there's a second smaller one I didn't expect. Can you explain and fix it?",
};

function parse(raw: string): SupportReply {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const obj = JSON.parse(cleaned) as unknown;
  if (
    !obj ||
    typeof obj !== "object" ||
    typeof (obj as SupportReply).reply !== "string" ||
    !(obj as SupportReply).reply.trim() ||
    !Array.isArray((obj as SupportReply).notes) ||
    (obj as SupportReply).notes.length < 1 ||
    !(obj as SupportReply).notes.every((n) => typeof n === "string" && n.trim())
  ) {
    throw new Error("bad shape");
  }
  const d = obj as SupportReply;
  return { reply: d.reply.trim(), notes: d.notes.map((n) => n.trim()).slice(0, 5) };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { scenario?: unknown; message?: unknown };
  const scenario = String(body.scenario ?? "custom");
  const customerMessage =
    scenario in SCENARIOS ? SCENARIOS[scenario] : clampInput(body.message, 2000);

  const result = await guardedClaude<SupportReply>({
    req,
    tool: "support-reply",
    system: SYSTEM,
    buildMessages: () => [
      {
        role: "user",
        content: `A customer sent this message. Write a compliant, on-brand support reply.\n\nCustomer message:\n"""${customerMessage || "(no message provided)"}"""`,
      },
    ],
    parse,
    fallback: fallbacks["support-reply"] as unknown as SupportReply,
    maxTokens: 500,
  });

  return Response.json(result);
}
