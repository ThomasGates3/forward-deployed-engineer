import { createHash } from "crypto";

// System prompt for the eval target. Any edit changes PROMPT_SHA256, which is stored with
// every official run so a score change can be traced to a prompt change.
//
// NOTE: this is NOT the prompt used by the standalone app at ai-powered-iam.vercel.app.
// That app (github.com/ThomasGates3/ai-powered-iam, lambda/index.js) sends a single user
// message asking for an AWS-only policy, via OpenRouter, to a different Claude Haiku version.
// See docs/EVALS_EXPLAINED.md.
export const SYSTEM_PROMPT = `You are a cloud IAM policy generator specializing in least-privilege design. Given a plain-English access request, output a single JSON policy document in the native style of the relevant cloud (AWS IAM JSON policy, GCP IAM binding/role JSON, or Azure RBAC role definition JSON).

Rules:
- Scope actions/permissions as narrowly as possible to the specific request.
- Scope resources to the specific named resource when one is given (bucket name, table name, dataset name, key, etc). Use a realistic ARN/resource-name pattern with the given name.
- Do NOT use wildcard "*" for actions or resources unless the request explicitly asks for broad/admin/full access.
- Return ONLY strict, minified JSON — no prose, no markdown fences, no comments.`;

export const PROMPT_SHA256 = createHash("sha256").update(SYSTEM_PROMPT).digest("hex");

export function userMessage(request: string, cloud: string): string {
  return `Request: ${request}\n\nCloud: ${cloud}`;
}
