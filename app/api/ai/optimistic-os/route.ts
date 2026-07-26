import { guardedClaude, clampInput } from "@/lib/ai-rate-limit";
import { fallbacks } from "@/content/fallbacks";

export type OptimisticPlan = {
  trend: string;
  concept: { title: string; description: string };
  imagePrompt: string;
  etsy: { title: string; tags: string[]; description: string };
  pinterest: { caption: string; schedule: string };
};

const SYSTEM = `You are Optimistic OS, a six-agent e-commerce automation pipeline for a print-on-demand / digital-product shop. Given a product niche, run the text stages of the pipeline: trend research, product concept, image prompt, Etsy listing, and a Pinterest plan.

Return ONLY strict, minified JSON matching exactly this shape — no prose, no markdown fences:
{"trend":"<1-2 sentence trend insight for this niche>","concept":{"title":"<product title>","description":"<1-2 sentence product concept>"},"imagePrompt":"<a vivid text-to-image prompt for the product artwork>","etsy":{"title":"<SEO Etsy listing title>","tags":["<tag>"],"description":"<2-3 sentence listing description>"},"pinterest":{"caption":"<engaging Pin caption with 2-3 hashtags>","schedule":"<when to post and why, one line>"}}

Rules: 5-8 Etsy tags, all lowercase. Keep it realistic, giftable, and on-trend. No fabricated metrics.`;

function parse(raw: string): OptimisticPlan {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const o = JSON.parse(cleaned) as OptimisticPlan;
  const ok =
    o &&
    typeof o.trend === "string" && o.trend.trim() &&
    o.concept && typeof o.concept.title === "string" && typeof o.concept.description === "string" &&
    typeof o.imagePrompt === "string" && o.imagePrompt.trim() &&
    o.etsy && typeof o.etsy.title === "string" && Array.isArray(o.etsy.tags) && o.etsy.tags.length >= 3 &&
    typeof o.etsy.description === "string" &&
    o.pinterest && typeof o.pinterest.caption === "string" && typeof o.pinterest.schedule === "string";
  if (!ok) throw new Error("bad shape");
  return {
    trend: o.trend.trim(),
    concept: { title: o.concept.title.trim(), description: o.concept.description.trim() },
    imagePrompt: o.imagePrompt.trim(),
    etsy: {
      title: o.etsy.title.trim(),
      tags: o.etsy.tags.slice(0, 8).map((t) => String(t).trim().toLowerCase()),
      description: o.etsy.description.trim(),
    },
    pinterest: { caption: o.pinterest.caption.trim(), schedule: o.pinterest.schedule.trim() },
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { niche?: unknown };
  const niche = clampInput(body.niche, 500);

  const result = await guardedClaude<OptimisticPlan>({
    req,
    tool: "optimistic-os",
    system: SYSTEM,
    buildMessages: () => [
      { role: "user", content: `Run the pipeline for this product niche:\n\n${niche || "botanical wall art"}` },
    ],
    parse,
    fallback: fallbacks["optimistic-os"] as unknown as OptimisticPlan,
    maxTokens: 700,
    perVisitorCap: 3,
  });

  return Response.json(result);
}
