import Anthropic from "@anthropic-ai/sdk";

// Single server-only Claude client. The API key never leaves this module.
let anthropic: Anthropic | null | undefined;

/** Shared client. Every route uses this one so base URL, retries, and key handling stay in one place. */
export function getAnthropicClient(): Anthropic | null {
  if (anthropic !== undefined) return anthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  // baseURL is pinned so a stray ANTHROPIC_BASE_URL in the environment cannot redirect calls.
  // maxRetries: 1 so a flaky upstream cannot multiply spend; callers add their own timeout.
  anthropic = apiKey ? new Anthropic({ apiKey, baseURL: "https://api.anthropic.com", maxRetries: 1 }) : null;
  return anthropic;
}

export const HAIKU = "claude-haiku-4-5";

export async function callHaiku(opts: {
  system?: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
  /** Omit to use the API default (1.0), which is what production traffic sees. */
  temperature?: number;
  /** Aborts the HTTP request (used by the per-request timeout). */
  signal?: AbortSignal;
}): Promise<string> {
  const client = getAnthropicClient();
  if (!client) throw new Error("ANTHROPIC_API_KEY not configured");
  const res = await client.messages.create({
    model: HAIKU,
    max_tokens: opts.maxTokens ?? 400,
    system: opts.system,
    messages: opts.messages,
    ...(opts.temperature === undefined ? {} : { temperature: opts.temperature }),
  }, opts.signal ? { signal: opts.signal } : undefined);
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
