"use client";
import { Card, FallbackNote } from "@/components/ui";
import { ThinkingBar } from "@/components/motion";

// Wraps a demo's input + result area with consistent chrome:
// loading shimmer + labeled-fallback banner handled once, here.
export function DemoResultArea({
  status, source, reason, children,
}: {
  status: "idle" | "loading" | "done";
  source?: "live" | "fallback";
  reason?: string;
  children?: React.ReactNode;
}) {
  if (status === "idle") return null;
  return (
    <Card className="mt-5 p-5">
      {status === "loading" ? (
        <div className="space-y-3">
          <p className="font-mono text-xs text-muted">Claude Haiku is thinking…</p>
          <ThinkingBar />
        </div>
      ) : (
        <>
          {source === "fallback" && <FallbackNote reason={reason || ""} />}
          {source === "live" && (
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ember">● Live Claude response</p>
          )}
          {children}
        </>
      )}
    </Card>
  );
}
