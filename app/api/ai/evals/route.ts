import { guardedClaude } from "@/lib/ai-rate-limit";
import { fallbacks } from "@/content/fallbacks";

export type EvalRule = { name: string; passed: boolean; detail: string };
export type EvalCaseResult = {
  id: string;
  request: string;
  generated_policy_json: string;
  source: "live" | "fallback";
  rules: EvalRule[];
  overall_pass: boolean;
  score: number;
};

type TestCase = {
  id: string;
  request: string;
  cloud: "aws" | "gcp" | "azure";
  expectServiceKeywords: string[]; // at least one should appear in actions/policy
  allowBroad?: boolean; // true only for cases that legitimately ask for broad access
};

// 8 fixed test cases. Mix of AWS/GCP/Azure-style least-privilege IAM requests.
const TEST_CASES: TestCase[] = [
  {
    id: "s3-read-lambda",
    request: "Grant read-only access to a specific S3 bucket named 'reports-prod' for a reporting Lambda function",
    cloud: "aws",
    expectServiceKeywords: ["s3"],
  },
  {
    id: "cicd-ecs-ecr",
    request: "Allow a CI/CD pipeline to deploy new task definitions to ECS and push images to ECR",
    cloud: "aws",
    expectServiceKeywords: ["ecs", "ecr"],
  },
  {
    id: "bq-analyst-read",
    request: "Give a data analyst read access to a single BigQuery dataset called 'sales_analytics'",
    cloud: "gcp",
    expectServiceKeywords: ["bigquery"],
  },
  {
    id: "gcs-upload-service",
    request: "Allow a backend service account to upload objects to one specific GCS bucket, no delete or list access",
    cloud: "gcp",
    expectServiceKeywords: ["storage"],
  },
  {
    id: "azure-blob-reader",
    request: "Grant an Azure Function read-only access to a single Blob Storage container named 'invoices'",
    cloud: "azure",
    expectServiceKeywords: ["storage", "blob"],
  },
  {
    id: "dynamodb-order-service",
    request: "Allow an order-processing microservice to read and write items in a single DynamoDB table called 'orders', nothing else",
    cloud: "aws",
    expectServiceKeywords: ["dynamodb"],
  },
  {
    id: "kms-decrypt-only",
    request: "Grant a payments service permission to decrypt using one specific KMS key, but never allow key deletion or policy changes",
    cloud: "aws",
    expectServiceKeywords: ["kms"],
  },
  {
    id: "admin-break-glass",
    request: "Create a break-glass emergency admin role with full administrative access to the entire AWS account, for use only during incident response",
    cloud: "aws",
    expectServiceKeywords: ["*"],
    allowBroad: true,
  },
];

const SYSTEM = `You are a cloud IAM policy generator specializing in least-privilege design. Given a plain-English access request, output a single JSON policy document in the native style of the relevant cloud (AWS IAM JSON policy, GCP IAM binding/role JSON, or Azure RBAC role definition JSON).

Rules:
- Scope actions/permissions as narrowly as possible to the specific request.
- Scope resources to the specific named resource when one is given (bucket name, table name, dataset name, key, etc). Use a realistic ARN/resource-name pattern with the given name.
- Do NOT use wildcard "*" for actions or resources unless the request explicitly asks for broad/admin/full access.
- Return ONLY strict, minified JSON — no prose, no markdown fences, no comments.`;

function parsePolicy(raw: string): string {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  JSON.parse(cleaned); // throws if invalid — caller falls back on failure
  return cleaned;
}

// Deterministic rule-based grader — no LLM involved. Checks the raw policy JSON string.
function gradePolicy(tc: TestCase, policyJson: string): { rules: EvalRule[]; score: number } {
  const rules: EvalRule[] = [];

  let validJson = true;
  try {
    JSON.parse(policyJson);
  } catch {
    validJson = false;
  }
  rules.push({
    name: "valid_json",
    passed: validJson,
    detail: validJson ? "Policy parses as valid JSON." : "Policy is not valid JSON.",
  });

  const lower = policyJson.toLowerCase();
  const hasWildcardResource = /"resource"\s*:\s*"\*"|"resource"\s*:\s*\[\s*"\*"\s*\]/i.test(policyJson);
  const passWildcardResource = tc.allowBroad || !hasWildcardResource;
  rules.push({
    name: "no_wildcard_resource",
    passed: passWildcardResource,
    detail: passWildcardResource
      ? "Resource scoping avoids a bare '*' wildcard."
      : "Policy grants access to Resource: '*' — not least-privilege for this request.",
  });

  const hasWildcardAction = /"action"\s*:\s*"\*"|"action"\s*:\s*\[\s*"\*"\s*\]/i.test(policyJson);
  const passWildcardAction = tc.allowBroad || !hasWildcardAction;
  rules.push({
    name: "no_wildcard_action",
    passed: passWildcardAction,
    detail: passWildcardAction
      ? "Actions are scoped rather than using '*'."
      : "Policy grants Action: '*' — overly broad for this request.",
  });

  const scopedToService = tc.expectServiceKeywords.some((kw) => lower.includes(kw.toLowerCase()));
  rules.push({
    name: "scoped_to_requested_service",
    passed: scopedToService,
    detail: scopedToService
      ? `References the expected service (${tc.expectServiceKeywords.join(" / ")}).`
      : `Does not clearly reference the expected service (${tc.expectServiceKeywords.join(" / ")}).`,
  });

  const overall = rules.every((r) => r.passed);
  const score = Math.max(0, 5 - rules.filter((r) => !r.passed).length * (5 / rules.length));
  return { rules, score: Math.round(score * 10) / 10 };
}

export async function POST(req: Request) {
  const results: EvalCaseResult[] = [];

  for (const tc of TEST_CASES) {
    const fallbackEntry = fallbacks["evals"] as Record<string, string>;
    const fallbackJson = fallbackEntry[tc.id] ?? fallbackEntry.default ?? "{}";

    const result = await guardedClaude<string>({
      req,
      tool: "evals",
      system: SYSTEM,
      buildMessages: () => [{ role: "user", content: `Request: ${tc.request}\n\nCloud: ${tc.cloud}` }],
      parse: parsePolicy,
      fallback: fallbackJson,
      maxTokens: 400,
      perVisitorCap: 2,
    });

    const { rules, score } = gradePolicy(tc, result.data);
    results.push({
      id: tc.id,
      request: tc.request,
      generated_policy_json: result.data,
      source: result.source,
      rules,
      overall_pass: rules.every((r) => r.passed),
      score,
    });
  }

  const passed = results.filter((r) => r.overall_pass).length;
  const avg_score = Math.round((results.reduce((s, r) => s + r.score, 0) / results.length) * 10) / 10;

  return Response.json({
    cases: results,
    summary: { total: results.length, passed, avg_score },
  });
}
