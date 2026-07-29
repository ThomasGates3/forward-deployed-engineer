import Anthropic from "@anthropic-ai/sdk";
import { HAIKU } from "@/lib/anthropic";
import { clampInput } from "@/lib/ai-rate-limit";
import { getRedis } from "@/lib/redis";
import { visitorId } from "@/lib/visitor";
import { fallbacks } from "@/content/fallbacks";

// ---------------------------------------------------------------------------
// Mock dataset — small fictional e-commerce/logistics business.
// ---------------------------------------------------------------------------
const ORDERS = [
  { order_id: "1001", customer_name: "Priya Nair", status: "shipped", items: ["ELEC-4471 x1"], total: 89.99, eta: "2026-07-30" },
  { order_id: "1002", customer_name: "Marcus Webb", status: "processing", items: ["HOME-2210 x2"], total: 54.5, eta: "2026-08-02" },
  { order_id: "1003", customer_name: "Lena Ortiz", status: "delayed", items: ["ELEC-4471 x1", "ACC-9981 x1"], total: 134.25, eta: "2026-08-06" },
  { order_id: "1004", customer_name: "Sam Okafor", status: "delivered", items: ["HOME-2210 x1"], total: 27.25, eta: "2026-07-22" },
  { order_id: "1042", customer_name: "Dana Kim", status: "delivered", items: ["ELEC-4471 x1"], total: 89.99, eta: "2026-07-20" },
  { order_id: "1051", customer_name: "Rina Patel", status: "processing", items: ["ACC-9981 x3"], total: 44.97, eta: "2026-08-01" },
];

const SKUS = [
  { sku: "ELEC-4471", name: "Wireless Earbuds Pro", stock: 4, status: "low-stock" },
  { sku: "HOME-2210", name: "Ceramic Pour-Over Kettle", stock: 128, status: "in-stock" },
  { sku: "ACC-9981", name: "Braided USB-C Cable 2m", stock: 0, status: "out-of-stock" },
  { sku: "ELEC-3390", name: "Bluetooth Speaker Mini", stock: 62, status: "in-stock" },
  { sku: "HOME-1187", name: "Bamboo Cutting Board", stock: 15, status: "in-stock" },
  { sku: "ACC-5502", name: "Phone Grip Stand", stock: 3, status: "low-stock" },
];

const SYSTEM_PROMPT = `You are Ops Copilot, an internal support agent for a small e-commerce/logistics business.
You have tools to look up orders, check inventory, and issue refunds. Use tools whenever the user asks about
an order or SKU — do not guess. When a refund is warranted, CALL the issue_refund tool directly with the
order_id, amount, and reason (do not just describe it in text) — the system automatically pauses and requires
human confirmation before the refund actually executes, so calling the tool is safe and is how confirmation
gets triggered. Keep replies concise (2-4 sentences).`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "lookup_order",
    description: "Look up an order by its order_id and return its status, items, total, and ETA.",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string", description: "The order id, e.g. '1042'" } },
      required: ["order_id"],
    },
  },
  {
    name: "check_inventory",
    description: "Check stock count and status for a SKU.",
    input_schema: {
      type: "object",
      properties: { sku: { type: "string", description: "The SKU, e.g. 'ELEC-4471'" } },
      required: ["sku"],
    },
  },
  {
    name: "issue_refund",
    description: "Issue a refund for an order. SENSITIVE: requires human confirmation before executing.",
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "string" },
        amount: { type: "number", description: "Refund amount in USD" },
        reason: { type: "string" },
      },
      required: ["order_id", "amount", "reason"],
    },
  },
];

const SENSITIVE_TOOLS = new Set(["issue_refund"]);

function runReadOnlyTool(name: string, input: Record<string, unknown>) {
  if (name === "lookup_order") {
    const order = ORDERS.find((o) => o.order_id === String(input.order_id));
    return order ?? { error: "not_found", order_id: input.order_id };
  }
  if (name === "check_inventory") {
    const sku = SKUS.find((s) => s.sku.toLowerCase() === String(input.sku).toLowerCase());
    return sku ?? { error: "not_found", sku: input.sku };
  }
  return { error: "unknown_tool" };
}

function executeRefund(input: Record<string, unknown>) {
  return {
    success: true,
    order_id: input.order_id,
    amount: input.amount,
    reason: input.reason,
    refund_id: `RFD-${Math.floor(Math.random() * 900000 + 100000)}`,
    message: "Refund issued to original payment method.",
  };
}

// ---------------------------------------------------------------------------
// Rate limiting — same key pattern/caps as lib/ai-rate-limit.ts, scoped to this
// route (issue_refund + multi-turn loops don't fit the single-shot guardedClaude
// helper, so we replicate the peek/bump logic directly against the same Redis).
// ---------------------------------------------------------------------------
const TOOL = "ops-copilot";
const PER_VISITOR_CAP = 3; // conversations/day
const MAX_TURNS = 6; // hard stop on assistant turns per request loop

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function peek(key: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  return (await redis.get<number>(key)) ?? 0;
}

async function bump(key: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 60 * 60 * 25);
  return n;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ChatMessage = { role: "user" | "assistant"; content: string };
type ToolCallLog = { tool: string; input: Record<string, unknown>; result?: unknown };

type ReqBody = {
  messages: ChatMessage[];
  pendingConfirmation?: { tool_use_id: string; tool_name: string; input: Record<string, unknown> };
  confirmed?: boolean;
};

let anthropicClient: Anthropic | null | undefined;
function getClient(): Anthropic | null {
  if (anthropicClient !== undefined) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  anthropicClient = apiKey ? new Anthropic({ apiKey }) : null;
  return anthropicClient;
}

function toAnthropicHistory(messages: ChatMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

export async function POST(req: Request) {
  let body: ReqBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const cleaned: ChatMessage[] = messages
    .slice(-20)
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: clampInput(m.content, 2000) }));

  const day = today();
  const visitorKey = `ai:${TOOL}:${visitorId(req)}:${day}`;
  const toolGlobalKey = `ai:${TOOL}:global:${day}`;
  const globalKey = `ai:global:${day}`;

  // ---- Confirmed-refund path: execute directly, no new model call needed for the tool itself ----
  if (body.pendingConfirmation && body.confirmed) {
    const { tool_use_id, tool_name, input } = body.pendingConfirmation;
    if (tool_name !== "issue_refund") {
      return Response.json({ error: "unknown_pending_tool" }, { status: 400 });
    }
    const result = executeRefund(input);
    const toolCalls: ToolCallLog[] = [{ tool: tool_name, input, result }];

    // Continue the conversation with the model so it can narrate the outcome.
    const client = getClient();
    if (!client) {
      return Response.json({
        source: "fallback",
        reply: `Done — ${result.message} Refund ID ${result.refund_id} for $${input.amount} on order ${input.order_id}.`,
        toolCalls,
        awaitingConfirmation: false,
      });
    }
    try {
      const history = toAnthropicHistory(cleaned);
      const followUp = await client.messages.create({
        model: HAIKU,
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: [
          ...history,
          {
            role: "assistant",
            content: [{ type: "tool_use", id: tool_use_id, name: tool_name, input }],
          },
          {
            role: "user",
            content: [{ type: "tool_result", tool_use_id, content: JSON.stringify(result) }],
          },
        ],
      });
      const text = followUp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      await Promise.all([bump(globalKey), bump(toolGlobalKey)]);
      return Response.json({
        source: "live",
        reply: text || `Refund issued: ${result.refund_id}.`,
        toolCalls,
        awaitingConfirmation: false,
      });
    } catch {
      return Response.json({
        source: "fallback",
        reply: `Done — ${result.message} Refund ID ${result.refund_id} for $${input.amount} on order ${input.order_id}.`,
        toolCalls,
        awaitingConfirmation: false,
      });
    }
  }

  if (body.pendingConfirmation && body.confirmed === false) {
    return Response.json({
      source: "live",
      reply: "Refund cancelled — no action taken.",
      toolCalls: [],
      awaitingConfirmation: false,
    });
  }

  // ---- Normal turn: check caps, then run the real tool-use loop ----
  try {
    if ((await peek(globalKey)) >= 200 || (await peek(toolGlobalKey)) >= 200) {
      return Response.json(fallbackTurn("global-cap"));
    }
    if ((await peek(visitorKey)) >= PER_VISITOR_CAP) {
      return Response.json(fallbackTurn("per-visitor-cap"));
    }

    const client = getClient();
    if (!client) return Response.json(fallbackTurn("unconfigured"));

    const history: Anthropic.MessageParam[] = toAnthropicHistory(cleaned);
    const toolCalls: ToolCallLog[] = [];
    let finalText = "";
    let awaitingConfirmation: { tool_use_id: string; tool_name: string; input: Record<string, unknown> } | undefined;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const res = await client.messages.create({
        model: HAIKU,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: history,
      });

      const textBlocks = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
      finalText = textBlocks.map((b) => b.text).join("\n").trim() || finalText;

      if (res.stop_reason !== "tool_use") break;

      const toolUseBlocks = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      const sensitive = toolUseBlocks.find((b) => SENSITIVE_TOOLS.has(b.name));

      if (sensitive) {
        awaitingConfirmation = {
          tool_use_id: sensitive.id,
          tool_name: sensitive.name,
          input: sensitive.input as Record<string, unknown>,
        };
        toolCalls.push({ tool: sensitive.name, input: sensitive.input as Record<string, unknown> });
        break; // pause here; client must confirm before we continue
      }

      // Execute all read-only tools, append assistant turn + tool_results, loop again.
      history.push({ role: "assistant", content: res.content });
      const resultBlocks: Anthropic.ToolResultBlockParam[] = [];
      for (const b of toolUseBlocks) {
        const result = runReadOnlyTool(b.name, b.input as Record<string, unknown>);
        toolCalls.push({ tool: b.name, input: b.input as Record<string, unknown>, result });
        resultBlocks.push({ type: "tool_result", tool_use_id: b.id, content: JSON.stringify(result) });
      }
      history.push({ role: "user", content: resultBlocks });
    }

    await Promise.all([bump(globalKey), bump(toolGlobalKey), bump(visitorKey)]);

    return Response.json({
      source: "live",
      reply: finalText,
      toolCalls,
      awaitingConfirmation: awaitingConfirmation ?? null,
    });
  } catch {
    return Response.json(fallbackTurn("error"));
  }
}

function fallbackTurn(reason: string) {
  const fb = fallbacks["ops-copilot"];
  return {
    source: "fallback",
    reason,
    reply: fb.finalReply,
    toolCalls: fb.toolCalls,
    awaitingConfirmation: null,
    transcript: fb.transcript,
  };
}
