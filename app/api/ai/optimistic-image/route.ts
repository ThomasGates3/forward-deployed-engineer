import { guardedCall, clampInput } from "@/lib/ai-rate-limit";
import { fallbacks } from "@/content/fallbacks";

export type OptimisticImage = { imageUrl: string };

async function generate(prompt: string): Promise<OptimisticImage> {
  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ prompt, image_size: "landscape_4_3", num_images: 1 }),
  });
  if (!res.ok) throw new Error(`fal ${res.status}`);
  const data = (await res.json()) as { images?: { url?: string }[] };
  const url = data.images?.[0]?.url;
  if (!url) throw new Error("no image url");
  return { imageUrl: url };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { prompt?: unknown };
  const prompt = clampInput(body.prompt, 1000);

  const result = await guardedCall<OptimisticImage>({
    req,
    tool: "optimistic-image",
    enabled: Boolean(process.env.FAL_KEY),
    call: () => generate(prompt || "minimalist botanical art print on cream paper"),
    fallback: fallbacks["optimistic-image"] as unknown as OptimisticImage,
    perVisitorCap: 1,
    globalCap: 40,
  });

  return Response.json(result);
}
