import { guardedClaude, clampInput } from "@/lib/ai-rate-limit";
import { fallbacks } from "@/content/fallbacks";
import { Resend } from "resend";

export type LeadQualification = {
  verdict: string;
  score: number;
  reasoning: string;
  followupEmail: string;
  sms: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SYSTEM = `You are a top-performing SDR qualifying an inbound lead for a Forward Deployed Engineer / AI consulting practice. Read the lead's name, email, and message and decide how promising they are.

Return ONLY strict, minified JSON matching exactly this shape — no prose, no markdown fences:
{"verdict":"<short label, e.g. 'Qualified — High intent' or 'Nurture — Low signal'>","score":<integer 0-100 fit+intent score>,"reasoning":"<2-3 sentences explaining the score: what signals intent, budget, fit, or risk. Show your thinking.>","followupEmail":"<a warm, concise, personalized follow-up email body addressed to the lead by first name, referencing their message, proposing a next step>","sms":"<a short, friendly SMS (<160 chars) as a fast first-touch>"}

Be specific and reference the actual message. score is an integer between 0 and 100.`;

function parse(raw: string): LeadQualification {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const obj = JSON.parse(cleaned) as unknown;
  const d = obj as LeadQualification;
  if (
    !obj ||
    typeof obj !== "object" ||
    typeof d.verdict !== "string" ||
    !d.verdict.trim() ||
    typeof d.score !== "number" ||
    typeof d.reasoning !== "string" ||
    !d.reasoning.trim() ||
    typeof d.followupEmail !== "string" ||
    !d.followupEmail.trim() ||
    typeof d.sms !== "string" ||
    !d.sms.trim()
  ) {
    throw new Error("bad shape");
  }
  return {
    verdict: d.verdict.trim(),
    score: Math.max(0, Math.min(100, Math.round(d.score))),
    reasoning: d.reasoning.trim(),
    followupEmail: d.followupEmail.trim(),
    sms: d.sms.trim(),
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: unknown;
    email?: unknown;
    message?: unknown;
  };
  const name = clampInput(body.name, 120);
  const email = clampInput(body.email, 200);
  const message = clampInput(body.message, 2000);

  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: "invalid email" }, { status: 400 });
  }

  const result = await guardedClaude<LeadQualification>({
    req,
    tool: "speed-to-lead",
    system: SYSTEM,
    buildMessages: () => [
      {
        role: "user",
        content: `Qualify this inbound lead:\n\nName: ${name || "(not provided)"}\nEmail: ${email}\nMessage: ${message || "(no message)"}`,
      },
    ],
    parse,
    fallback: fallbacks["speed-to-lead"] as LeadQualification,
    maxTokens: 500,
  });

  // Only send a REAL email for genuine live qualifications, and only if Resend is configured.
  let emailSent = false;
  if (
    result.source === "live" &&
    process.env.RESEND_API_KEY &&
    process.env.LEAD_FROM_EMAIL
  ) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.LEAD_FROM_EMAIL,
        to: email,
        subject: "Your AI-drafted follow-up",
        text: result.data.followupEmail,
      });
      emailSent = true;
    } catch {
      emailSent = false; // never let an email failure break the response
    }
  }

  return Response.json({ ...result, emailSent, data: { ...result.data, emailSent } });
}
