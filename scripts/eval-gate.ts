// npm run eval:gate -- [--threshold 0.8] [--baseline path/to/run.json] [--n 5] [--no-store]
// Runs the suite, compares with the previous official run (Redis evals:latest, or a
// --baseline JSON file), and exits 1 if the pass rate is below the threshold or any
// previously 100%-passing case regressed.
import { readFileSync } from "fs";
import { arg, printReport, runFromCli } from "./eval";
import { gate, type ComparableRun } from "../lib/evals/compare";
import { getLatest } from "../lib/evals/store";

async function main() {
  const threshold = Number(arg("threshold", process.env.EVAL_GATE_THRESHOLD ?? "0.8"));
  if (!(threshold >= 0 && threshold <= 1)) throw new Error("--threshold must be between 0 and 1");
  const baselinePath = arg("baseline");
  // Read the baseline BEFORE this run is stored over it.
  const prev: ComparableRun | null = baselinePath
    ? JSON.parse(readFileSync(baselinePath, "utf8"))
    : await getLatest();
  console.log(prev ? `baseline: run ${(prev as { id?: string }).id ?? baselinePath}` : "baseline: none (threshold check only)");

  const r = await runFromCli(process.env.GITHUB_ACTIONS ? "ci" : "cli");
  printReport(r);
  const g = gate(r, prev, threshold);
  if (g.diff?.promptChanged) console.log("note: system prompt changed since the baseline");
  if (g.diff?.modelChanged) console.log("note: model changed since the baseline");
  if (g.ok) {
    console.log(`GATE PASS (threshold ${threshold})`);
  } else {
    console.log("GATE FAIL");
    for (const reason of g.reasons) console.log(`  - ${reason}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
