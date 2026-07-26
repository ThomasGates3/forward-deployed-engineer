"use client";
import { useState } from "react";

export type DemoState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; data: T; source: "live" | "fallback"; reason?: string };

// Shared client-side runner. Posts to /api/ai/{tool}, always resolves to a
// rendered result (the server guarantees a graceful fallback, never an error).
export function useDemo<T>(tool: string) {
  const [state, setState] = useState<DemoState<T>>({ status: "idle" });

  async function run(body: unknown) {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/ai/${tool}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setState({ status: "done", data: json.data, source: json.source, reason: json.reason });
    } catch {
      setState({ status: "idle" });
    }
  }

  return { state, run, reset: () => setState({ status: "idle" }) };
}
