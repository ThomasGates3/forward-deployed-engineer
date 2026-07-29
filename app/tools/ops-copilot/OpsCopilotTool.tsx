"use client";
import { useState, useRef, useEffect } from "react";
import { Button, Card, Badge, FallbackNote } from "@/components/ui";
import { ThinkingBar, FadeIn } from "@/components/motion";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ToolCallLog = { tool: string; input: Record<string, unknown>; result?: unknown };
type PendingConfirmation = { tool_use_id: string; tool_name: string; input: Record<string, unknown> };

type TurnEvent =
  | { kind: "message"; role: "user" | "assistant"; content: string }
  | { kind: "tool"; call: ToolCallLog }
  | { kind: "confirm"; pending: PendingConfirmation; resolved?: "confirmed" | "cancelled" };

const EXAMPLES = [
  "What's the status of order #1042?",
  "Is SKU ELEC-4471 in stock?",
  "Refund order #1042, the item arrived damaged",
];

export default function OpsCopilotTool() {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<TurnEvent[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const nextHistory: ChatMessage[] = [...history, { role: "user", content: text }];
    setHistory(nextHistory);
    setEvents((e) => [...e, { kind: "message", role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setFallbackReason(null);
    try {
      const res = await fetch("/api/ai/ops-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextHistory }),
      });
      const data = await res.json();
      applyResponse(data, nextHistory);
    } catch {
      setEvents((e) => [...e, { kind: "message", role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function applyResponse(data: any, nextHistory: ChatMessage[]) {
    if (data.source === "fallback" && data.transcript) {
      setFallbackReason(data.reason ?? "unconfigured");
      const newEvents: TurnEvent[] = [];
      for (const step of data.transcript) {
        if (step.role === "user") continue; // already shown
        if (step.role === "assistant") newEvents.push({ kind: "message", role: "assistant", content: step.content });
        if (step.role === "tool_call") {
          newEvents.push({ kind: "tool", call: { tool: step.tool, input: step.input, result: step.result } });
          if (step.pending) {
            newEvents.push({ kind: "confirm", pending: { tool_use_id: "fallback", tool_name: step.tool, input: step.input } });
            setPending({ tool_use_id: "fallback", tool_name: step.tool, input: step.input });
          }
        }
      }
      setEvents((e) => [...e, ...newEvents]);
      setHistory([...nextHistory, { role: "assistant", content: data.reply }]);
      return;
    }

    const newEvents: TurnEvent[] = [];
    for (const call of data.toolCalls ?? []) {
      newEvents.push({ kind: "tool", call });
    }
    if (data.awaitingConfirmation) {
      newEvents.push({ kind: "confirm", pending: data.awaitingConfirmation });
      setPending(data.awaitingConfirmation);
    } else if (data.reply) {
      newEvents.push({ kind: "message", role: "assistant", content: data.reply });
    }
    setEvents((e) => [...e, ...newEvents]);
    setHistory([...nextHistory, { role: "assistant", content: data.reply || "" }]);
  }

  async function resolveConfirmation(confirmed: boolean) {
    if (!pending) return;
    const thePending = pending;
    setPending(null);
    setEvents((e) =>
      e.map((ev) => (ev.kind === "confirm" && ev.pending === thePending ? { ...ev, resolved: confirmed ? "confirmed" : "cancelled" } : ev))
    );

    if (thePending.tool_use_id === "fallback") {
      setEvents((e) => [
        ...e,
        {
          kind: "message",
          role: "assistant",
          content: confirmed
            ? "Refund issued (example). Refund ID RFD-482913 for $89.99 on order 1042."
            : "Refund cancelled. No action taken.",
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/ops-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, pendingConfirmation: thePending, confirmed }),
      });
      const data = await res.json();
      const newEvents: TurnEvent[] = [];
      for (const call of data.toolCalls ?? []) newEvents.push({ kind: "tool", call });
      if (data.reply) newEvents.push({ kind: "message", role: "assistant", content: data.reply });
      setEvents((e) => [...e, ...newEvents]);
      setHistory((h) => [...h, { role: "assistant", content: data.reply || "" }]);
    } catch {
      setEvents((e) => [...e, { kind: "message", role: "assistant", content: "Something went wrong confirming that action." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-4 md:p-6">
      {fallbackReason && <FallbackNote reason={fallbackReason} />}

      {events.length === 0 && (
        <div className="mb-6">
          <p className="mb-3 text-sm text-muted">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                data-testid="example-prompt"
                onClick={() => send(ex)}
                className="min-h-[44px] rounded-lg border border-edge px-3 py-2 text-left text-sm text-cream transition hover:border-accent hover:text-accent"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      <div data-testid="transcript" className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
        {events.map((ev, i) => (
          <FadeIn key={i} y={8}>
            {ev.kind === "message" && (
              <div
                data-testid={ev.role === "user" ? "user-bubble" : "assistant-bubble"}
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                  ev.role === "user" ? "ml-auto bg-accent text-ink" : "bg-surface text-cream border border-edge"
                }`}
              >
                {ev.content}
              </div>
            )}
            {ev.kind === "tool" && (
              <div data-testid="tool-call" className="rounded-lg border border-edge bg-black/30 p-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-accent">
                  <span>🔧</span>
                  <span>
                    {ev.call.tool}({JSON.stringify(ev.call.input)})
                  </span>
                </div>
                {ev.call.result !== undefined && (
                  <div className="mt-1.5 text-muted">
                    ✅ result: {JSON.stringify(ev.call.result)}
                  </div>
                )}
              </div>
            )}
            {ev.kind === "confirm" && (
              <div data-testid="confirm-refund" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Badge tone="amber">Action requires confirmation</Badge>
                </div>
                <p className="mb-3 text-sm text-cream">
                  Confirm refund of{" "}
                  <span className="font-semibold">${String(ev.pending.input.amount)}</span> for order{" "}
                  <span className="font-semibold">{String(ev.pending.input.order_id)}</span>?
                  <br />
                  <span className="text-muted">Reason: {String(ev.pending.input.reason)}</span>
                </p>
                {!ev.resolved ? (
                  <div className="flex gap-2">
                    <Button data-testid="confirm-btn" onClick={() => resolveConfirmation(true)}>
                      Confirm
                    </Button>
                    <Button data-testid="cancel-btn" variant="outline" onClick={() => resolveConfirmation(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Badge tone={ev.resolved === "confirmed" ? "accent" : "edge"}>
                    {ev.resolved === "confirmed" ? "Confirmed" : "Cancelled"}
                  </Badge>
                )}
              </div>
            )}
          </FadeIn>
        ))}
        {loading && (
          <div className="w-32">
            <ThinkingBar />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-5 flex gap-2"
      >
        <input
          data-testid="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about an order, SKU, or request a refund…"
          className="min-h-[44px] flex-1 rounded-lg border border-edge bg-black/30 px-3 text-sm text-cream placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <Button type="submit" data-testid="send-btn" disabled={loading || !input.trim()}>
          Send
        </Button>
      </form>
    </Card>
  );
}
