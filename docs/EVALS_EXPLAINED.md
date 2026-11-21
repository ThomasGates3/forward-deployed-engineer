# EVALS EXPLAINED — PRIVATE NOTES

> **Private prep notes for Thomas.** Not linked from the site. If this repository is
> public, anyone can still read this file on GitHub; move it out of the repo (or make
> the repo private) if you don't want that.

Plain-English walkthrough of the IAM eval suite, why it is built this way, and the
hardest questions you are likely to get about it, with answers drawn from the code.

---

## 1. The 60-second version

- **What it tests:** a prompt that turns a plain-English access request into an IAM
  policy (AWS, GCP, or Azure).
- **Dataset:** 12 fixed cases in `lib/evals/cases.ts`: 7 ordinary, 1 break-glass admin
  role, 4 adversarial (prompt injection, "full access" with no reason, vague request,
  pressure to over-scope).
- **Grader:** plain TypeScript, no model. It parses the JSON, normalizes all three
  clouds into one list of grants, and runs 8 fail-level rules plus 2 warnings.
- **Reliability:** each case runs N times (default 5). A case is pass (100%), fail (0%),
  or flaky (anything between).
- **Honesty:** canned examples are never graded. Official runs are stored with
  timestamp, model, prompt SHA-256, and git sha, and the page shows run-to-run changes.
- **Gate:** `npm run eval:gate` exits 1 if the pass rate drops below a threshold or a
  case that passed every run before now fails one.
- **Evaluating the evaluator:** every rule has a must-pass and a must-fail unit test, and
  `npm run test:mutation` injects 10 known bugs into the grader and confirms the tests
  catch each one.

**What you can and cannot say today:** the code, tests, and mutation check are real
and pass. As of writing, **no official run against the real API has been recorded**, so
there is no measured pass rate yet. Run `npm run eval` before the interview if you want
a number, and quote only what it prints.

---

## 2. File map

| File | What it does |
|---|---|
| `lib/evals/cases.ts` | The golden dataset. Each case holds the request and its rubric: allowed services, named resource, required actions, forbidden actions, wildcard exemptions, whether a refusal counts as a pass, and a human-readable `passCriteria`. |
| `lib/evals/prompt.ts` | The system prompt, its SHA-256, and a version label. Changing the prompt changes the hash, which is stored with every run. |
| `lib/evals/policy.ts` | Parsing and normalization. Turns AWS statements, GCP bindings / custom roles, and Azure role definitions into `Grant { effect, actions, notActions, resources, condition }`. Also the glob matching (`globMatch`, `globsIntersect`), `isGranted`, and the per-cloud wildcard and service-prefix helpers. |
| `lib/evals/grader.ts` | The rules. `gradePolicy(case, rawText)` returns every rule's pass/fail, severity, and a detail string, plus `failedRules` and `warnings`. |
| `lib/evals/runner.ts` | Runs N attempts per case with bounded concurrency, grades only live output, and builds per-case and suite summaries. |
| `lib/evals/compare.ts` | Run-to-run diff and the gate decision. |
| `lib/evals/official.ts` | An "official" run: full suite, real API, metadata attached. |
| `lib/evals/store.ts` | Redis: `evals:latest` (full record) and `evals:history` (last 30 summaries). |
| `scripts/eval.ts` | `npm run eval`. Prints a table, writes `evals-results/*.json`, stores to Redis if configured. Refuses to exceed `--max-calls` (150 by default). |
| `scripts/eval-gate.ts` | `npm run eval:gate`. Reads the baseline, runs, applies the gate, exits 0 or 1. |
| `scripts/mutation-check.ts` | `npm run test:mutation`. |
| `app/api/ai/evals/route.ts` | Visitor "Run live (capped)". Goes through `guardedClaude`, 2 live calls per visitor per day. |
| `app/api/evals/run/route.ts` | Token-protected official run (`EVAL_ADMIN_TOKEN`). |
| `.github/workflows/eval-gate.yml` | Manual-only CI gate. |
| `lib/ai-rate-limit.ts` | Shared guard for every AI route: atomic quota reservation, labeled fallbacks. |
| `tests/unit/*` | 98 unit tests at time of writing (`npm run test:unit`). |

---

## 3. How a single output gets graded (walk through this on a whiteboard)

1. **Parse.** Strip markdown fences if present (and record a warning). `JSON.parse`. If
   that fails, or the top level is not an object, `valid_json` fails and the policy rules
   are marked "not graded". The case fails.
2. **Refusal?** If the object has `refused: true` or `needs_clarification: true`, the
   only rule that matters is `refusal_acceptable`: pass if the case allows refusals and a
   reason was given; fail (over-refusal) otherwise.
3. **Detect cloud.** A `Statement` anywhere means AWS. `Actions` / `DataActions` /
   `AssignableScopes` mean Azure. `bindings` / `includedPermissions` / `role` mean GCP.
4. **Normalize** into grants. Notable choices:
   - AWS `Allow` + `NotAction` becomes `"*"` (it grants everything except a list).
     `Allow` + `NotResource` becomes resource `"*"`.
   - GCP predefined roles are expanded from a small table (`GCP_ROLES`): `roles/owner`
     and `roles/editor` become `"*"`, `roles/<svc>.admin` becomes `<svc>.*`. Unknown
     roles are kept as text and not expanded.
   - Azure `DataActions` are treated as actions; `NotActions` / `NotDataActions` are
     subtracted.
5. **Run the rules** against the grants (see the methodology page for each one).
   - "Is X granted?" means: some Allow pattern overlaps X, that grant's NotActions don't
     cover X, and no Deny covers X. Overlap is real glob intersection, so `s3:*`
     overlaps the forbidden `s3:Put*`.
6. **Decide.** Pass if no fail-severity rule failed. Warnings never flip a pass.

---

## 4. Design decisions, and why

**Walk the parsed object, not regex over the JSON text.** The old grader used regexes like
`"Resource":"*"`. They missed `s3:*`, a `"*"` inside a list, every GCP and Azure format,
and passed GCP/Azure cases vacuously. Its service check was a substring search, so
`"s3"` appearing in an ARN passed even if the only action was `ec2:DescribeInstances`.
That exact case is now a unit test.

**Per-case rubrics live next to the request.** One object tells you what the case asks
and what "pass" means. Adding a case doesn't touch the grader.

**Deterministic over LLM-as-judge for these rules.** Every rule has an objective answer.
Code is repeatable, free, unit-testable, and debuggable. A judge model would add its own
noise on top of the model under test. A judge is on the roadmap for the subjective
question ("is this the *smallest* reasonable policy?"), and only once it has been
calibrated against human labels.

**Severity "fail" vs "warn".** Break-glass without an MFA condition is bad practice, but
the request didn't ask for one, so failing it would be grading something the prompt
didn't require. Fences are similar: the output is still usable.

**Break-glass: wildcard rules off, everything else on.** It still has to be valid AWS
policy JSON (`scoped_to_requested_service` checks the cloud format), so a GCP owner
binding fails it. Before, it could not fail at all.

**Wildcard-resource exemptions.** A few AWS actions don't support resource-level
permissions (for example `ecr:GetAuthorizationToken`), so `Resource: "*"` is the only
correct value. A statement is exempt only if *every* action in it is on the case's
exemption list. Mixing `ecr:PutImage` into that statement fails. (Double-check the ECS
task-definition entries against the AWS Service Authorization Reference; that list is
from my reading of the docs.)

**N runs, pass/fail/flaky, pooled pass rate.** Model output varies between calls, so one
run per case tells you very little. "Flaky" is the honest label for "sometimes".
Temperature is left at the API default so the eval sees what production sees;
`--temperature` exists if you want to separate prompt quality from sampling noise.

**Never grade canned examples.** Before, a visitor got 2 live cases and 6 canned ones,
and all 8 were scored, so the "pass rate" was mostly my own hand-written JSON. Now
fallbacks show "not evaluated (canned example)" and are excluded. There was also a
subtler bug: the old route's `parse` was `JSON.parse`, so *invalid* model JSON threw,
fell back to canned JSON, and was then graded as valid. Invalid output now reaches the
grader and fails `valid_json`.

**Atomic quota reservation.** The old guard did `GET` (check cap), call the model, then
`INCR`. Ten concurrent requests could all read "2 of 3 used" and all go through. Now it
`INCR`s first and `DECR`s if that put it over the cap. Worst case under contention it
briefly over-rejects; it can never over-admit. A test races 10 requests against a cap
of 3 and asserts exactly 3 model calls. Reservations are released if the model call
throws, and kept if the call returned but the output failed to parse (those tokens were
billed).

**Gate on "previously 100% case regressed" plus a threshold.** Threshold alone hides a
new failure if something else improved. Gating on every flaky wobble would be noise.

---

## 5. The prompt here vs the standalone app (be upfront about this)

The site used to say this suite "regenerates ... through the same model" as the
standalone IAM Policy Generator. That was not true:

| | This eval suite | Standalone app (`ThomasGates3/ai-powered-iam`, `lambda/index.js`) |
|---|---|---|
| Clouds | AWS, GCP, Azure | AWS only |
| Prompt | System prompt in `lib/evals/prompt.ts`, with least-privilege rules and (v2) a refusal channel | A single user message: "AWS IAM security expert ... generate a least-privilege IAM policy", with one example |
| Model | `claude-haiku-4-5`, Anthropic API directly | `anthropic/claude-3.5-haiku` via OpenRouter |
| Output handling | Raw text graded as-is | Regex extracts the first `{...}` block, then `JSON.parse` |

So results here describe *this* prompt. The page and methodology now say so. A good
next step, and a good interview talking point, is to add the standalone prompt as a
second eval target and run both through the same grader.

Separately: that repo has a committed `.env.production`. Check it and rotate anything
sensitive.

---

## 6. The 10 hardest questions, with honest answers

**1. "How do you know your grader is right?"**
Two layers. Every rule has a unit test with a policy that must pass and one that must
fail, including the tricky ones (`s3:*`, `"*"` in an ARN list, Azure `actions: ["*"]`,
GCP `roles/owner`). Then `npm run test:mutation` breaks the grader in 10 specific ways
(ignore Deny, don't expand owner, accept any refusal, ...) and checks the tests catch
each. What I don't have yet is a measured false-positive/negative rate on *real* model
outputs. That needs human spot checks, which is on the roadmap.

**2. "What's your pass rate?"**
Only answer with a number from a real `npm run eval` run, and give N, the date, and the
prompt hash with it. If you haven't run it: "The harness is built and tested. I haven't
recorded an official run yet, so I don't have a number I'd stand behind."

**3. "Why not use an LLM as a judge?"**
These rules have objective answers, so code is strictly better for them: deterministic,
free, testable. A judge adds a second source of noise and needs its own validation. I'd
add one for "is this the minimal policy?" and calibrate it against my own labels before
trusting it.

**4. "What can your grader miss?" (false negatives)**
Unknown GCP roles aren't expanded, so a dangerous one could pass the forbidden-action
check. Region/account wildcards in ARNs (`arn:aws:dynamodb:*:*:table/orders`) aren't
flagged. Named-resource is a substring check, so `orders-archive` satisfies `orders`. It
checks structure, not real cloud semantics: no policy simulator or validator.

**5. "What can it flag wrongly?" (false positives)**
Any action that legitimately needs `Resource: "*"` but isn't on the case's exemption
list. The `<type>/*` resource heuristic. Forbidden lists are my judgment: e.g.
`adv-overscope-pressure` forbids delete because the *stated need* was read-only, which
someone could reasonably dispute.

**6. "Five runs isn't much. How confident are you in a pass rate?"**
Not very, and I'd say so. At N=5 a case's rate moves in 20-point steps. A case failing 1
time in 20 passes all 5 runs about 77% of the time (0.95^5). N=5 is a cost choice (60
calls per full run). For a real release decision I'd raise N on the cases that matter,
or report a confidence interval.

**7. "Couldn't a model that refuses everything game your adversarial cases?"**
Yes, on those 4 cases. That's why the 8 non-adversarial cases treat a refusal as a
failure (over-refusal). A better design would add adversarial cases with a legitimate
core that *must* be served, and score refusal separately from safety.

**8. "You wrote the prompt and the rubric. Isn't that teaching to the test?"**
It's a real risk and there's no held-out set yet. Mitigations so far: the rubric is
written as explicit, reviewable data per case, and the grader is tested independently
of the prompt. Next step would be a held-out set I don't look at while tuning.

**9. "How would you use this in a team, on a real product?"**
The parts are meant to be reused: a case file with per-case rubrics, a pure grader with
its own tests, a runner that reports flakiness, stored runs keyed by prompt hash and
model, and a gate that fails CI on regressions. The workflow is manual-only on purpose
because each run costs money. On a team I'd run it on PRs that touch the prompt or
model config, with a budget cap.

**10. "Your site's rate limiter: what was wrong and how do you know it's fixed?"**
Check-then-increment race. Concurrent requests all passed the check before any
increment landed. Fixed by reserving with `INCR` first and rolling back if over the
cap. `tests/unit/rate-limit.test.ts` uses an in-memory Redis that yields between every
operation (like a network round trip), fires 10 concurrent requests at a cap of 3, and
asserts exactly 3 model calls. Honest caveat: that's a fake Redis, not Upstash under
real load.

---

## 7. How to demo it live

1. `npm run test:unit` (fast, offline): show the grader tests.
2. `npm run test:mutation`: "here's me testing the tester."
3. Open `tests/unit/grader.test.ts` at the `scoped_to_requested_service` block and show
   the "service name appears only in a resource string" case the old grader passed.
4. If you've recorded a run: `/tools/evals`, open a failing or flaky case, and walk
   through the rule detail strings.
5. Make a deliberate bad prompt edit locally, run `npm run eval:gate -- --n 2 --baseline
   evals-results/<previous>.json --no-store`, and show it exit 1. (24 calls.)
