// npm run eval -- [--n 5] [--concurrency 3] [--temperature 0] [--max-calls 150] [--no-store]
// Runs the full suite against the real API, prints a table, writes evals-results/<ts>.json,
// and (if Upstash env vars are set) stores it as evals:latest + evals:history.
import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { runOfficial, type RunRecord } from "../lib/evals/official";
import { storeRun } from "../lib/evals/store";

export function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}
export const flag = (name: string) => process.argv.includes(`--${name}`);

export function localGitSha(): string | null {
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

export function printReport(r: RunRecord) {
  const pct = (x: number | null) => (x === null ? "n/a" : `${Math.round(x * 100)}%`);
  console.log(`\nmodel ${r.model} · prompt ${r.promptVersion} sha256:${r.promptSha256.slice(0, 12)} · git ${r.gitSha?.slice(0, 7) ?? "n/a"} · N=${r.n} · temp ${r.temperature ?? "default"}`);
  console.log("case".padEnd(28), "pass".padEnd(7), "status".padEnd(14), "failed rules (count)");
  for (const c of r.cases) {
    const fails = Object.entries(c.ruleFailures).map(([k, v]) => `${k}(${v})`).join(" ");
    const warns = Object.entries(c.warnings).map(([k, v]) => `${k}(${v})`).join(" ");
    console.log(c.id.padEnd(28), `${c.passes}/${c.graded}`.padEnd(7), c.status.padEnd(14), fails, warns ? `| warn: ${warns}` : "");
  }
  const s = r.summary;
  console.log(`\nOVERALL ${pct(s.passRate)} (${s.passedRuns}/${s.gradedRuns} runs) · ${s.casesPassing} pass · ${s.casesFlaky} flaky · ${s.casesFailing} fail · live calls ${r.liveCalls}\n`);
}

export async function runFromCli(trigger: RunRecord["trigger"]): Promise<RunRecord> {
  const temp = arg("temperature");
  const r = await runOfficial({
    n: Number(arg("n", process.env.EVAL_N ?? "5")),
    concurrency: Number(arg("concurrency", "3")),
    temperature: temp === undefined ? undefined : Number(temp),
    maxCalls: Number(arg("max-calls", "150")),
    trigger,
    gitSha: localGitSha(),
    onProgress: (d, t) => process.stderr.write(`\r${d}/${t} calls`),
  });
  process.stderr.write("\n");
  mkdirSync("evals-results", { recursive: true });
  const file = `evals-results/${r.timestamp.replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(r, null, 2));
  console.log(`wrote ${file}`);
  if (!flag("no-store")) {
    const stored = await storeRun(r);
    console.log(stored ? "stored as evals:latest (+ evals:history)" : "Upstash not configured: not stored in Redis");
  }
  return r;
}

if (process.argv[1]?.endsWith("eval.ts")) {
  runFromCli("cli")
    .then(printReport)
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
