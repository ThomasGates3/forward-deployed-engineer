import { guardedClaude, clampInput } from "@/lib/ai-rate-limit";
import { fallbacks } from "@/content/fallbacks";
import { Resend } from "resend";

export type LeadPipeline = {
  verdict: string;
  score: number;
  reasoning: string;
  followupEmail: string;
  sms: string;
  branch: "high-intent" | "nurture";
  enrichment: { company: string; size: string; signals: string[] };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SYSTEM = `You are a Speed-to-Lead pipeline for a Forward Deployed Engineer / AI consulting practice. Given an inbound lead (name, email, message), run the full pipeline: enrich, qualify, branch, and draft outreach.

Return ONLY strict, minified JSON matching exactly this shape — no prose, no markdown fences:
{"enrichment":{"company":"<best guess of company from the email domain, or 'Unknown (free inbox)'>","size":"<rough size guess, e.g. '50-200 employees' or 'Unknown'>","signals":["<3 short fit/intent signals inferred from the lead>"]},"verdict":"<short label>","score":<integer 0-100>,"reasoning":"<2-3 sentences showing your thinking>","branch":"<'high-intent' if score>=70 else 'nurture'>","followupEmail":"<warm personalized follow-up email body, addressed by first name, referencing their message>","sms":"<short friendly SMS under 160 chars>"}

Reference the actual message. score is an integer 0-100. branch MUST be exactly 'high-intent' or 'nurture'.`;

function parse(raw: string): LeadPipeline {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const d = JSON.parse(cleaned) as LeadPipeline;
  const ok =
    d &&
    typeof d.verdict === "string" && d.verdict.trim() &&
    typeof d.score === "number" &&
    typeof d.reasoning === "string" && d.reasoning.trim() &&
    typeof d.followupEmail === "string" && d.followupEmail.trim() &&
    typeof d.sms === "string" && d.sms.trim() &&
    (d.branch === "high-intent" || d.branch === "nurture") &&
    d.enrichment && typeof d.enrichment.company === "string" &&
    typeof d.enrichment.size === "string" && Array.isArray(d.enrichment.signals);
  if (!ok) throw new Error("bad shape");
  return {
    verdict: d.verdict.trim(),
    score: Math.max(0, Math.min(100, Math.round(d.score))),
    reasoning: d.reasoning.trim(),
    followupEmail: d.followupEmail.trim(),
    sms: d.sms.trim(),
    branch: d.branch,
    enrichment: {
      company: d.enrichment.company.trim(),
      size: d.enrichment.size.trim(),
      signals: d.enrichment.signals.slice(0, 4).map((s) => String(s).trim()),
    },
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: unknown; email?: unknown; message?: unknown };
  const name = clampInput(body.name, 120);
  const email = clampInput(body.email, 200);
  const message = clampInput(body.message, 2000);

  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: "invalid email" }, { status: 400 });
  }

  const result = await guardedClaude<LeadPipeline>({
    req,
    tool: "speed-to-lead-pipeline",
    system: SYSTEM,
    buildMessages: () => [
      { role: "user", content: `Run the pipeline for this lead:\n\nName: ${name || "(not provided)"}\nEmail: ${email}\nMessage: ${message || "(no message)"}` },
    ],
    parse,
    fallback: fallbacks["speed-to-lead-pipeline"] as unknown as LeadPipeline,
    maxTokens: 650,
    perVisitorCap: 3,
  });

  let emailSent = false;
  if (result.source === "live" && process.env.RESEND_API_KEY && process.env.LEAD_FROM_EMAIL) {
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
      emailSent = false;
    }
  }

  return Response.json({ ...result, emailSent, data: { ...result.data, emailSent } });
}
