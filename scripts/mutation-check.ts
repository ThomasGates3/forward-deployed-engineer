// npm run test:mutation
// Evaluates the evaluator: injects known bugs into the grader one at a time and checks
// that the unit tests catch each one. A mutation that survives means a rule is untested.
// Restores the original files afterwards, even on failure.
import { readFileSync, writeFileSync } from "fs";
import { spawnSync } from "child_process";

type Mutation = { name: string; file: string; from: string; to: string };

const MUTATIONS: Mutation[] = [
  { name: "service:* not treated as wildcard", file: "lib/evals/policy.ts", from: 'if (cloud === "aws") return /^[^:]+:\\*$/.test(a);', to: 'if (cloud === "aws") return false;' },
  { name: "Allow+NotAction not treated as broad", file: "lib/evals/policy.ts", from: 'if (effect === "allow" && has(s, "NotAction")) actions.push("*");', to: "" },
  { name: 'bare "*" resource allowed', file: "lib/evals/policy.ts", from: 'if (s === "*" || s === "/" || s === "") return true;', to: "" },
  { name: "Deny statements ignored", file: "lib/evals/policy.ts", from: "if (denied) return { granted: false, by: [] };", to: "" },
  { name: "GCP owner not expanded", file: "lib/evals/policy.ts", from: '"roles/owner": ["*"],', to: '"roles/owner": ["bigquery.tables.get"],' },
  { name: "named resource always found", file: "lib/evals/grader.ts", from: "const found = scopeText.some", to: "const found = true || scopeText.some" },
  { name: "cloud format not checked", file: "lib/evals/grader.ts", from: "if (cloud !== tc.cloud)", to: "if (false)" },
  { name: "break-glass condition always ok", file: "lib/evals/grader.ts", from: "passed: strong,", to: "passed: true," },
  { name: "refusal accepted on every case", file: "lib/evals/grader.ts", from: "const ok = !!tc.acceptRefusal &&", to: "const ok = true ||" },
  { name: "warnings fail the case", file: "lib/evals/grader.ts", from: '!r.passed && r.severity === "fail"', to: "!r.passed" },
];

const originals = new Map<string, string>();
let survived = 0;
try {
  for (const m of MUTATIONS) {
    if (!originals.has(m.file)) originals.set(m.file, readFileSync(m.file, "utf8"));
    const src = originals.get(m.file)!;
    if (!src.includes(m.from)) throw new Error(`Mutation "${m.name}" no longer applies: source changed. Update this script.`);
    writeFileSync(m.file, src.replace(m.from, m.to));
    const r = spawnSync("npx", ["vitest", "run", "tests/unit/grader.test.ts", "tests/unit/adversarial.test.ts"], { encoding: "utf8" });
    const caught = r.status !== 0;
    if (!caught) survived++;
    console.log(`${caught ? "CAUGHT  " : "SURVIVED"} ${m.name}`);
    writeFileSync(m.file, src);
  }
} finally {
  for (const [f, src] of Array.from(originals)) writeFileSync(f, src);
}
console.log(`\n${MUTATIONS.length - survived}/${MUTATIONS.length} mutations caught`);
process.exit(survived ? 1 : 0);
