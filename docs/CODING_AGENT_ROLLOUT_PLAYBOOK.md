# DRAFT — Rolling out a coding agent on a team

> **DRAFT for Thomas to edit.** A one-page starting point, not a finished position.
> Nothing here reports results from a real rollout. Replace bracketed placeholders with
> your own decisions and numbers.

## 1. Pilot (2 to 4 weeks)
- 3 to 5 volunteers across experience levels, including at least one skeptic.
- Pick 2 or 3 real, repeatable task types (for example: writing tests for existing code,
  small bug fixes, dependency upgrades). Avoid greenfield demos; they flatter every tool.
- Record a baseline for those tasks *before* the pilot: time to merge, review rounds,
  defects found after merge.
- One owner who collects feedback weekly and can change the config.

## 2. Shared config in the repo
- A checked-in instructions file the agent reads on every run (for example `CLAUDE.md`
  or `AGENTS.md`): build/test commands, code style, directories it must not touch, how to
  run one test, what "done" means.
- Keep it short and factual. Review changes to it like code: it changes behavior for
  everyone.
- Per-directory files only where a sub-project genuinely differs.

## 3. Skills
- Package repeated multi-step workflows (release notes, migration recipe, incident
  write-up) as reusable skills with their own instructions and scripts.
- Only add a skill after the same task has been done by hand with the agent at least
  [3] times. Vet third-party skills like dependencies: read them, pin them, and give an
  owner.

## 4. Hooks as guardrails
- Deterministic checks that run on agent actions, not advice in a prompt:
  - block edits to secrets, lockfiles, CI config, or generated code without approval;
  - run the formatter and linter after edits;
  - require tests to pass before the agent reports done;
  - deny network access or destructive shell commands by default; allow by list.
- Start strict and loosen with evidence. Log every hook block; that log is your list of
  config improvements.

## 5. Permissions and credentials
- Least privilege: the agent gets the same or fewer permissions than the person driving
  it. No production credentials in agent sessions.
- Spend limits at the provider and per-user caps from day one.
- A documented way to turn it off for one person or the whole team.

## 6. Eval gates
- A small golden set of the team's real tasks with deterministic checks (tests pass,
  lint clean, diff touches only expected paths), run when the config, model, or agent
  version changes.
- Regressions block the change, the same way this site's `eval:gate` does for its
  prompt.
- Track human review findings on agent PRs as a second signal.

## 7. Training
- One live session: how to scope a task, how to review agent output, when to stop and
  take over.
- A short internal page of good and bad prompts from the pilot, using real examples.
- Pairing for the first few sessions; office hours after.

## 8. Metrics (decide before the pilot starts)
- Outcome: time to merge for the pilot task types, vs baseline.
- Quality: review rounds, reverts, defects traced to agent-authored changes.
- Cost: spend per merged change.
- Friction: permission prompts and hook blocks per session, human interventions per
  task.
- Sentiment: a short weekly survey. Treat it as a signal, not proof.

## 9. Exit criteria
- **Expand** if: [quality metrics no worse than baseline] AND [time to merge improves by
  X] AND [cost per change under Y] for [N] consecutive weeks.
- **Adjust and extend the pilot** if quality holds but speed or cost does not.
- **Stop** if: defect or revert rate rises above baseline, a guardrail is bypassed, or
  the pilot group would not keep using it voluntarily.
- Write the decision and the evidence down either way.
