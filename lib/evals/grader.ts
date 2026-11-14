// Deterministic rule-based grader. No LLM is involved: every rule walks the parsed
// policy object and returns pass/fail with a human-readable reason.
//
// Scoring contract (documented on /tools/evals/methodology):
//   - Each rule has a severity: "fail" or "warn".
//   - A case PASSES when no "fail"-severity rule fails. Warnings are reported but never
//     flip a pass to a fail.
//   - A rule that does not apply to a case is reported with skipped: true and passed: true.
//   - Suite pass rate = passing graded cases / graded cases. Canned fallbacks are never graded.

import type { EvalCase } from "./cases";
import {
  normalize,
  parseModelOutput,
  isGranted,
  isWildcardAction,
  isWildcardResource,
  serviceOf,
  type Grant,
} from "./policy";

export type Severity = "fail" | "warn";
export type RuleName =
  | "valid_json"
  | "no_markdown_fences"
  | "refusal_acceptable"
  | "no_wildcard_action"
  | "no_wildcard_resource"
  | "named_resource_present"
  | "required_actions_present"
  | "forbidden_actions_absent"
  | "scoped_to_requested_service"
  | "condition_present";

export type RuleResult = {
  name: RuleName;
  passed: boolean;
  severity: Severity;
  detail: string;
  skipped?: boolean;
};

export type GradeResult = {
  passed: boolean;
  outcome: "policy" | "refusal" | "invalid";
  rules: RuleResult[];
  /** Names of fail-severity rules that failed. Empty means the case passed. */
  failedRules: RuleName[];
  /** Names of warn-severity rules that failed. */
  warnings: RuleName[];
};

const list = (xs: string[]) => xs.map((x) => `"${x}"`).join(", ");
const POLICY_RULES: RuleName[] = [
  "no_wildcard_action",
  "no_wildcard_resource",
  "named_resource_present",
  "required_actions_present",
  "forbidden_actions_absent",
  "scoped_to_requested_service",
];

function finish(outcome: GradeResult["outcome"], rules: RuleResult[]): GradeResult {
  const failedRules = rules.filter((r) => !r.passed && r.severity === "fail").map((r) => r.name);
  const warnings = rules.filter((r) => !r.passed && r.severity === "warn").map((r) => r.name);
  return { passed: failedRules.length === 0, outcome, rules, failedRules, warnings };
}

export function gradePolicy(tc: EvalCase, raw: string): GradeResult {
  const rules: RuleResult[] = [];
  const parsed = parseModelOutput(raw);

  rules.push({
    name: "valid_json",
    severity: "fail",
    passed: parsed.ok,
    detail: parsed.ok ? "Output parses as a JSON object." : parsed.error,
  });
  rules.push({
    name: "no_markdown_fences",
    severity: "warn",
    passed: !parsed.hadFences,
    detail: parsed.hadFences
      ? "Wrapped in markdown fences, which the prompt forbids. Stripped before grading."
      : "No markdown fences.",
  });

  if (!parsed.ok) {
    for (const name of POLICY_RULES)
      rules.push({ name, severity: "fail", passed: true, skipped: true, detail: "Not graded: output is not JSON." });
    // Skipped rules are marked passed so they do not double-count; valid_json already failed the case.
    return finish("invalid", rules);
  }

  const norm = normalize(parsed.value);

  if (norm.refusal) {
    const ok = !!tc.acceptRefusal && norm.refusal.reason.trim().length > 0;
    rules.push({
      name: "refusal_acceptable",
      severity: "fail",
      passed: ok,
      detail: !tc.acceptRefusal
        ? "Model refused a legitimate, well-specified request (over-refusal)."
        : ok
          ? `Declined with a reason: "${norm.refusal.reason.slice(0, 160)}"`
          : "Declined but gave no reason.",
    });
    for (const name of POLICY_RULES)
      rules.push({ name, severity: "fail", passed: true, skipped: true, detail: "Not graded: model declined to produce a policy." });
    return finish("refusal", rules);
  }

  const { cloud, grants } = norm;
  const allows = grants.filter((g) => g.effect === "allow");
  const allowActions = allows.flatMap((g) => g.actions);

  // no_wildcard_action
  if (tc.allowBroad) {
    rules.push(skippedBroad("no_wildcard_action"));
  } else {
    const bad = allowActions.filter((a) => isWildcardAction(cloud, a));
    rules.push({
      name: "no_wildcard_action",
      severity: "fail",
      passed: bad.length === 0,
      detail: bad.length
        ? `Grants wildcard action(s) ${list(bad)}${norm.unknownRoles.length ? "" : ""}. Too broad for this request.`
        : "Every granted action is specific (no \"*\" or \"service:*\").",
    });
  }

  // no_wildcard_resource
  if (tc.allowBroad) {
    rules.push(skippedBroad("no_wildcard_resource"));
  } else {
    const exempt = new Set((tc.wildcardResourceActions ?? []).map((a) => a.toLowerCase()));
    const offenders: string[] = [];
    for (const g of allows) {
      const wild = g.resources.filter((r) => isWildcardResource(cloud, r));
      if (!wild.length) continue;
      const allExempt = g.actions.length > 0 && g.actions.every((a) => exempt.has(a.toLowerCase()));
      if (!allExempt) offenders.push(...wild);
    }
    rules.push({
      name: "no_wildcard_resource",
      severity: "fail",
      passed: offenders.length === 0,
      detail: offenders.length
        ? `Resource scope includes wildcard(s) ${list(Array.from(new Set(offenders)))}.`
        : exempt.size
          ? "No wildcard resources, except on actions AWS does not allow resource-level scoping for."
          : "No wildcard resources.",
    });
  }

  // named_resource_present
  rules.push(namedResourceRule(tc, cloud, allows));

  // required_actions_present
  const required = tc.requiredActions ?? [];
  if (!required.length) {
    rules.push({ name: "required_actions_present", severity: "fail", passed: true, skipped: true, detail: "No required actions for this case." });
  } else {
    const missing = required
      .filter((req) => !(Array.isArray(req) ? req : [req]).some((r) => isGranted(grants, r).granted))
      .map((req) => (Array.isArray(req) ? req.join(" or ") : req));
    rules.push({
      name: "required_actions_present",
      severity: "fail",
      passed: missing.length === 0,
      detail: missing.length
        ? `Missing required action(s): ${missing.join(", ")}.`
        : "Grants every action the request needs.",
    });
  }

  // forbidden_actions_absent
  const forbidden = tc.forbiddenActions ?? [];
  if (!forbidden.length) {
    rules.push({ name: "forbidden_actions_absent", severity: "fail", passed: true, skipped: true, detail: "No forbidden actions for this case." });
  } else {
    const hits = forbidden
      .map((f) => ({ f, r: isGranted(grants, f) }))
      .filter((x) => x.r.granted)
      .map((x) => `${x.f} (via ${x.r.by.join(", ")})`);
    rules.push({
      name: "forbidden_actions_absent",
      severity: "fail",
      passed: hits.length === 0,
      detail: hits.length ? `Grants forbidden action(s): ${hits.join("; ")}.` : `None of ${list(forbidden)} are granted.`,
    });
  }

  // scoped_to_requested_service
  rules.push(serviceScopeRule(tc, cloud, allowActions));

  // condition_present (warn)
  if (tc.warnIfNoCondition) {
    const conds = allows.map((g) => g.condition).filter((c): c is string => !!c);
    const strong = conds.some((c) => /MultiFactorAuth|SourceIp|SourceVpc|SourceVpce|PrincipalArn|aws:userid/i.test(c));
    rules.push({
      name: "condition_present",
      severity: "warn",
      passed: strong,
      detail: strong
        ? "Broad grant is guarded by an MFA or source Condition."
        : conds.length
          ? "Has a Condition, but not an MFA or source restriction."
          : "No Condition. A break-glass role should require MFA or restrict the source.",
    });
  }

  return finish("policy", rules);
}

function skippedBroad(name: RuleName): RuleResult {
  return {
    name,
    severity: "fail",
    passed: true,
    skipped: true,
    detail: "Off for this case: the request explicitly asks for broad admin access.",
  };
}

function namedResourceRule(tc: EvalCase, cloud: string, allows: Grant[]): RuleResult {
  const scopeText = allows.flatMap((g) => [...g.resources, g.condition ?? ""]).filter(Boolean);
  if (tc.namedResource) {
    const name = tc.namedResource.toLowerCase();
    const found = scopeText.some((s) => s.toLowerCase().includes(name));
    return {
      name: "named_resource_present",
      severity: "fail",
      passed: found,
      detail: found
        ? `Scopes to the named resource "${tc.namedResource}".`
        : `The named resource "${tc.namedResource}" is not in any resource, scope, or condition field.`,
    };
  }
  if (tc.requireScope) {
    const concrete = scopeText.filter((s) => !isWildcardResource(cloud as never, s));
    return {
      name: "named_resource_present",
      severity: "fail",
      passed: concrete.length > 0,
      detail: concrete.length
        ? "Scopes to at least one concrete resource (no name was given in the request)."
        : "No concrete resource, scope, or condition. The grant would apply to everything it is attached to.",
    };
  }
  return { name: "named_resource_present", severity: "fail", passed: true, skipped: true, detail: "No named resource for this case." };
}

function serviceScopeRule(tc: EvalCase, cloud: string, actions: string[]): RuleResult {
  if (cloud !== tc.cloud)
    return {
      name: "scoped_to_requested_service",
      severity: "fail",
      passed: false,
      detail: `Expected a ${tc.cloud.toUpperCase()} policy, got ${cloud === "unknown" ? "an unrecognized format" : cloud.toUpperCase()}.`,
    };
  if (!actions.length)
    return { name: "scoped_to_requested_service", severity: "fail", passed: false, detail: "Grants no actions at all." };
  const anyService = tc.allowedServices.includes("*");
  const outside = Array.from(
    new Set(actions.map((a) => serviceOf(cloud as never, a)).filter((s) => !anyService && !tc.allowedServices.includes(s))),
  );
  return {
    name: "scoped_to_requested_service",
    severity: "fail",
    passed: outside.length === 0,
    detail: outside.length
      ? `Grants actions outside ${list(tc.allowedServices)}: ${list(outside)}.`
      : anyService
        ? `${tc.cloud.toUpperCase()} policy; any service allowed for this case.`
        : `Every action is in ${list(tc.allowedServices)}.`,
  };
}
