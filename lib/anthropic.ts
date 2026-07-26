import Anthropic from "@anthropic-ai/sdk";

// Single server-only Claude client. The API key never leaves this module.
let anthropic: Anthropic | null | undefined;

function getClient(): Anthropic | null {
  if (anthropic !== undefined) return anthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  anthropic = apiKey ? new Anthropic({ apiKey }) : null;
  return anthropic;
}

export const HAIKU = "claude-haiku-4-5";

export async function callHaiku(opts: {
  system?: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("ANTHROPIC_API_KEY not configured");
  const res = await client.messages.create({
    model: HAIKU,
    max_tokens: opts.maxTokens ?? 400,
    system: opts.system,
    messages: opts.messages,
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
