import { Card } from "@/components/ui";
import type { RunRecord } from "@/lib/evals/official";
import type { RunSummary } from "@/lib/evals/store";
import { compareRuns } from "@/lib/evals/compare";
import CaseResults, { SummaryLine } from "./CaseResults";
import { pct } from "@/lib/evals/format";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
const signed = (x: number | null) => (x === null ? "n/a" : `${x > 0 ? "+" : ""}${Math.round(x * 100)} pts`);

export default function OfficialRun({ latest, history }: { latest: RunRecord | null; history: RunSummary[] }) {
  if (!latest) {
    return (
      <section className="mt-10" aria-labelledby="official-heading" data-testid="official-empty">
        <h2 id="official-heading" className="font-display text-2xl text-cream">
          Latest official run
        </h2>
        <Card className="mt-4 p-6">
          <p className="text-sm text-muted">
            No official run has been recorded on this deployment yet. An official run sends every case to the model
            several times, grades every output, and is stored with its timestamp, model, and prompt hash. Until one
            exists there are no results to show here, and none are made up.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="mt-10" aria-labelledby="official-heading" data-testid="official-run">
      <h2 id="official-heading" className="font-display text-2xl text-cream">
        Latest official run
      </h2>
      <Card className="mt-4 p-6">
        <dl className="mb-5 grid grid-cols-1 gap-x-6 gap-y-2 font-mono text-xs text-muted sm:grid-cols-2">
          <div>
            <dt className="inline text-cream">Run at: </dt>
            <dd className="inline">{fmtDate(latest.timestamp)}</dd>
          </div>
          <div>
            <dt className="inline text-cream">Model: </dt>
            <dd className="inline">{latest.model}</dd>
          </div>
          <div className="min-w-0">
            <dt className="inline text-cream">Prompt: </dt>
            <dd className="inline break-all" title={latest.promptSha256}>
              {latest.promptVersion} · sha256:{latest.promptSha256.slice(0, 12)}
            </dd>
          </div>
          <div>
            <dt className="inline text-cream">Code: </dt>
            <dd className="inline">{latest.gitSha ? latest.gitSha.slice(0, 7) : "not recorded"}</dd>
          </div>
          <div>
            <dt className="inline text-cream">Runs per case: </dt>
            <dd className="inline">
              {latest.n} · temperature {latest.temperature ?? "API default"}
            </dd>
          </div>
        </dl>
        <SummaryLine summary={latest.summary} n={latest.n} />
      </Card>
      <p className="mt-4 text-xs text-muted">
        Every output below is a real model response from this run. Open a case to see each run&apos;s policy and the
        rule-by-rule grade.
      </p>
      <CaseResults cases={latest.cases} />
      {history.length > 0 && <History history={history} />}
    </section>
  );
}

function History({ history }: { history: RunSummary[] }) {
  return (
    <div className="mt-12" data-testid="eval-history">
      <h3 className="font-display text-xl text-cream">Run history</h3>
      <p className="mt-2 text-xs text-muted">
        Newest first, last {history.length} runs. Change is against the run below it. A regression is any case whose
        pass rate went down.
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-edge">
        <table className="w-full min-w-[640px] text-left font-mono text-xs">
          <thead className="text-muted">
            <tr className="border-b border-edge">
              <th className="px-3 py-2 font-medium">Date (UTC)</th>
              <th className="px-3 py-2 font-medium">Prompt</th>
              <th className="px-3 py-2 font-medium">N</th>
              <th className="px-3 py-2 font-medium">Pass rate</th>
              <th className="px-3 py-2 font-medium">Change</th>
              <th className="px-3 py-2 font-medium">Regressions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => {
              const prev = history[i + 1];
              const diff = prev ? compareRuns(prev, h) : null;
              const regressed = diff?.cases.filter((c) => c.regressed) ?? [];
              return (
                <tr
                  key={h.id}
                  className={`border-b border-edge/60 last:border-0 ${regressed.length ? "bg-amber-500/10" : ""}`}
                >
                  <td className="whitespace-nowrap px-3 py-2 text-cream">{h.timestamp.slice(0, 16).replace("T", " ")}</td>
                  <td className="px-3 py-2 text-muted">
                    {h.promptVersion} · {h.promptSha256.slice(0, 7)}
                    {diff?.promptChanged ? <span className="text-accent"> (changed)</span> : null}
                  </td>
                  <td className="px-3 py-2 text-muted">{h.n}</td>
                  <td className="px-3 py-2 text-cream">{pct(h.summary.passRate)}</td>
                  <td className="px-3 py-2 text-muted">{diff ? signed(diff.overallDelta) : "first run"}</td>
                  <td className={`px-3 py-2 ${regressed.length ? "text-amber-300" : "text-muted"}`}>
                    {regressed.length
                      ? regressed.map((c) => `${c.id} ${signed(c.delta)}`).join(", ")
                      : diff
                        ? "none"
                        : "n/a"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
