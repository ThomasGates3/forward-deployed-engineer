import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { PER_VISITOR_CAP, GLOBAL_CAP, DEFAULT_TIMEOUT_MS } from "@/lib/ai-rate-limit";

export const metadata: Metadata = {
  title: "How I guard the AI on this site",
  description:
    "The guardrails every AI route on this site goes through: per-visitor, per-tool, and site-wide caps with atomic reservation, input limits, labeled fallbacks, a kill switch, timeouts, and a provider-level spend limit.",
};

// Per-route values, mirrored from each route file. Kept here so the page shows real numbers.
const ROUTES: Array<{ route: string; perVisitor: number; input: string; output: string }> = [
  { route: "Speed to Lead", perVisitor: PER_VISITOR_CAP, input: "name 120, email 200, message 2,000 chars", output: "500 tokens" },
  { route: "Document Q&A", perVisitor: 4, input: "document 6,000, question 500 chars", output: "500 tokens" },
  { route: "Ops Copilot (agent)", perVisitor: 3, input: "last 20 messages, 2,000 chars each", output: "600 tokens per turn, at most 6 turns" },
  { route: "Evals (visitor run)", perVisitor: 2, input: "none: fixed cases only", output: "400 tokens" },
];

const CONTROLS: Array<{ title: string; body: string; where: string }> = [
  {
    title: "Three daily caps",
    body: `Every live call counts against the visitor's cap for that tool, the tool's own cap, and a site-wide cap of ${GLOBAL_CAP} calls a day. The per-tool cap defaults to the same ${GLOBAL_CAP}, so in practice the site-wide cap is the one that binds unless a tool is set lower. Visitors are identified by a salted hash of IP and user agent, never the raw IP.`,
    where: "lib/ai-rate-limit.ts, lib/visitor.ts",
  },
  {
    title: "Atomic reservation",
    body: "Quota is reserved before the model is called: each counter is incremented first, and if any comes back over its cap the increments are undone and the request gets a fallback. An earlier version checked first and counted after the call, so simultaneous requests could all pass the check. A unit test fires 10 requests at once against a cap of 3 and expects exactly 3 model calls. A reservation is returned if the call errors, and kept if it timed out or returned unusable output, because those tokens may have been billed.",
    where: "reserve() and reserveQuota() in lib/ai-rate-limit.ts",
  },
  {
    title: "Input limits before any tokens are spent",
    body: "Every visitor input is trimmed to a fixed length on the server before it reaches the model, and output is capped with max_tokens. The agent route also keeps only the last 20 messages and stops after 6 model turns per request.",
    where: "clampInput() and each route",
  },
  {
    title: "Labeled fallbacks",
    body: "When a cap is hit, the kill switch is on, the call times out, or anything errors, the visitor gets a saved example response with a visible label saying it is an example and why. The site never shows a raw error, and never passes a canned answer off as live. The eval suite goes one step further and refuses to grade a canned answer.",
    where: "content/fallbacks.ts, FallbackNote",
  },
  {
    title: "Kill switch",
    body: "Setting AI_KILL_SWITCH=1 in the hosting environment makes every AI route return its labeled fallback without calling the model or touching the counters, including the agent and the official eval runs. No code change, just an environment variable and a redeploy.",
    where: "killSwitchOn() in lib/ai-rate-limit.ts",
  },
  {
    title: "Timeouts and retries",
    body: `Each model request is aborted after ${DEFAULT_TIMEOUT_MS / 1000} seconds by default (AI_TIMEOUT_MS). The agent gets one time budget for its whole tool loop, not one per turn. The client retries a failed request at most once, so a flaky upstream cannot multiply spend.`,
    where: "withTimeout() and lib/anthropic.ts",
  },
  {
    title: "Keys stay on the server",
    body: "API keys are read only in server code, in one client module, and never sent to the browser. The agent's tools run against a small mock dataset, and its one sensitive action, issuing a refund, is simulated and pauses for a human to confirm before it runs.",
    where: "lib/anthropic.ts, app/api/ai/ops-copilot",
  },
  {
    title: "A spend limit outside the code",
    body: "Code can have bugs, so the last line of defense is a monthly spend limit set in the model provider's console. It does not depend on any of the code above being right.",
    where: "Provider console (not in this repository)",
  },
];

const FAILURES: Array<[string, string]> = [
  ["Runaway spend", "A loop, a retry storm, or a scraper hammering an endpoint. Covered by the three caps with atomic reservation, max_tokens, the 6-turn agent limit, timeouts, one retry, the kill switch, and the provider spend limit."],
  ["Over-broad credentials", "An agent holding a key that can do far more than its job needs. Here the only key is server-side, and the agent's tools are a fixed list in code over mock data, with a human confirmation step on the one write action. Least privilege is also what the eval suite on this site grades."],
  ["Unvetted third-party skills and plugins", "An agent that can load tools or instructions from outside sources inherits whatever those sources do. This site loads none at runtime: every tool an agent can call is defined in the repository, and dependencies are pinned in a lockfile. That is a narrow answer for a small site, not a general solution."],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14" aria-labelledby={id}>
      <h2 id={id} className="font-display text-2xl text-cream">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-ink text-cream">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-5 md:px-10 md:py-16">
        <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted transition hover:text-accent">
          ← Back to portfolio
        </Link>

        <header className="mt-8 max-w-2xl">
          <p className="eyebrow mb-3 font-mono text-[11px] uppercase tracking-wider text-accent">Guardrails</p>
          <h1 className="font-display text-section text-cream">How I guard the AI on this site</h1>
          <p className="mt-4 text-muted">
            Every live AI tool here is open to anyone on the internet and spends real money per call. These are the
            controls each request goes through, in order, with where they live in the code.
          </p>
        </header>

        <Section id="controls" title="The controls">
          <div className="grid gap-3">
            {CONTROLS.map((c) => (
              <Card key={c.title} className="p-5">
                <p className="text-cream">{c.title}</p>
                <p className="mt-2 text-sm text-muted">{c.body}</p>
                <p className="mt-3 break-words font-mono text-[11px] text-muted">{c.where}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section id="limits" title="Per-route limits">
          <div className="overflow-x-auto rounded-2xl border border-edge">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="font-mono text-xs text-muted">
                <tr className="border-b border-edge">
                  <th className="px-3 py-2 font-medium">Route</th>
                  <th className="px-3 py-2 font-medium">Live calls per visitor per day</th>
                  <th className="px-3 py-2 font-medium">Input limit</th>
                  <th className="px-3 py-2 font-medium">Output limit</th>
                </tr>
              </thead>
              <tbody>
                {ROUTES.map((r) => (
                  <tr key={r.route} className="border-b border-edge/60 last:border-0">
                    <td className="px-3 py-2 text-cream">{r.route}</td>
                    <td className="px-3 py-2 font-mono text-muted">{r.perVisitor}</td>
                    <td className="px-3 py-2 text-muted">{r.input}</td>
                    <td className="px-3 py-2 text-muted">{r.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            All routes also share the site-wide cap of {GLOBAL_CAP} live calls a day.
          </p>
        </Section>

        <Section id="failure-modes" title="Where always-on agents usually go wrong">
          <p className="max-w-2xl text-muted">
            Agents that run unattended tend to fail in a few predictable ways. Here is each one and what on this site
            addresses it.
          </p>
          <dl className="mt-6 grid max-w-3xl gap-5">
            {FAILURES.map(([t, d]) => (
              <div key={t}>
                <dt className="text-cream">{t}</dt>
                <dd className="mt-1 text-sm text-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="not-covered" title="What this does not cover">
          <ul className="max-w-3xl list-disc space-y-2 pl-5 text-sm text-muted marker:text-edge">
            <li>
              Visitor identity is a hash of IP and user agent, so someone changing either gets a fresh per-visitor
              allowance. The tool and site-wide caps still hold.
            </li>
            <li>
              Without Redis configured (local development), nothing is counted, so the caps depend on Redis being set in
              production. If Redis is configured but unreachable, the guard fails closed and serves the fallback.
            </li>
            <li>
              The caps limit how many calls happen, not what the model says. Output quality is what the{" "}
              <Link href="/tools/evals" className="text-accent underline decoration-accent/40 underline-offset-4">
                eval suite
              </Link>{" "}
              is for.
            </li>
          </ul>
        </Section>
      </div>
    </main>
  );
}
