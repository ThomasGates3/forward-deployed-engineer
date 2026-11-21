import { timingSafeEqual, createHash } from "crypto";
import { runOfficial } from "@/lib/evals/official";
import { storeRun } from "@/lib/evals/store";
import { toSummary } from "@/lib/evals/store";

// Token-protected official run. Not linked from the site.
//   curl -X POST https://<host>/api/evals/run -H "Authorization: Bearer $EVAL_ADMIN_TOKEN" -d '{"n":3}'
// N x 12 calls must finish inside the function's time limit; on short limits use a small N
// or run `npm run eval` locally instead.
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_N = 10;
const MAX_CALLS = 150;

function authorized(req: Request): boolean {
  const expected = process.env.EVAL_ADMIN_TOKEN;
  if (!expected || expected.length < 16) return false; // unset or weak token: route is off
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  // Hash both sides so the comparison is constant-time regardless of length.
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) return new Response("Not found", { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { n?: unknown };
  const n = Math.min(MAX_N, Math.max(1, Math.floor(Number(body.n) || 5)));
  try {
    const r = await runOfficial({ n, concurrency: 4, maxCalls: MAX_CALLS, trigger: "admin-route" });
    const stored = await storeRun(r);
    return Response.json({ stored, run: toSummary(r) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
