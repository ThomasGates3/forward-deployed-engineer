// Parse a model's raw output and normalize AWS, GCP, or Azure policy JSON into one
// shape the grader can walk: a list of grants, each with actions and resource scopes.
// No regex over the JSON text: we walk the parsed object.

import type { Cloud } from "./cases";

export type Grant = {
  effect: "allow" | "deny";
  actions: string[]; // granted action/permission patterns (GCP roles expanded where known)
  notActions: string[]; // Azure NotActions/NotDataActions, subtracted from actions
  resources: string[]; // ARNs, GCP resource names, Azure scopes
  condition: string | null; // serialized Condition / condition expression, if any
};

export type Normalized = {
  cloud: Cloud | "unknown";
  grants: Grant[];
  refusal: { reason: string } | null;
  unknownRoles: string[]; // GCP predefined roles we could not expand
};

export type ParseResult =
  | { ok: true; value: Record<string, unknown>; hadFences: boolean }
  | { ok: false; error: string; hadFences: boolean };

export function parseModelOutput(raw: string): ParseResult {
  const trimmed = raw.trim();
  const hadFences = /^```/.test(trimmed) || /```$/.test(trimmed);
  const cleaned = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const v: unknown = JSON.parse(cleaned);
    if (!v || typeof v !== "object" || Array.isArray(v))
      return { ok: false, error: "Parsed, but the top level is not a JSON object.", hadFences };
    return { ok: true, value: v as Record<string, unknown>, hadFences };
  } catch (e) {
    return { ok: false, error: `JSON.parse failed: ${(e as Error).message}`, hadFences };
  }
}

// ---------- generic helpers ----------

type Json = unknown;

const isObj = (v: Json): v is Record<string, Json> => !!v && typeof v === "object" && !Array.isArray(v);
const strs = (v: Json): string[] =>
  typeof v === "string" ? [v] : Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/** Case-insensitive own-key lookup. */
function get(o: Record<string, Json>, key: string): Json {
  const k = Object.keys(o).find((x) => x.toLowerCase() === key.toLowerCase());
  return k === undefined ? undefined : o[k];
}
function has(o: Record<string, Json>, key: string) {
  return Object.keys(o).some((x) => x.toLowerCase() === key.toLowerCase());
}

/** Every value stored under `key` (case-insensitive), at any depth. */
function deepValues(v: Json, key: string, out: Json[] = []): Json[] {
  if (Array.isArray(v)) v.forEach((x) => deepValues(x, key, out));
  else if (isObj(v))
    for (const [k, val] of Object.entries(v)) {
      if (k.toLowerCase() === key.toLowerCase()) out.push(val);
      deepValues(val, key, out);
    }
  return out;
}

/** Every object at any depth that satisfies `pred`. */
function deepObjects(v: Json, pred: (o: Record<string, Json>) => boolean, out: Record<string, Json>[] = []) {
  if (Array.isArray(v)) v.forEach((x) => deepObjects(x, pred, out));
  else if (isObj(v)) {
    if (pred(v)) out.push(v);
    Object.values(v).forEach((x) => deepObjects(x, pred, out));
  }
  return out;
}

const serialize = (v: Json) => (v === undefined || v === null ? null : typeof v === "string" ? v : JSON.stringify(v));

// ---------- GCP predefined roles ----------
// Only the roles these cases are likely to produce. Unknown roles are reported, not guessed,
// except the generic "<service>.admin" convention which grants "<service>.*".
export const GCP_ROLES: Record<string, string[]> = {
  "roles/owner": ["*"],
  "roles/editor": ["*"],
  "roles/viewer": ["*.get", "*.list"],
  "roles/storage.admin": ["storage.*"],
  "roles/storage.objectAdmin": ["storage.objects.*"],
  "roles/storage.objectCreator": ["storage.objects.create", "storage.multipartUploads.*"],
  "roles/storage.objectViewer": ["storage.objects.get", "storage.objects.list"],
  "roles/storage.objectUser": ["storage.objects.*"],
  "roles/bigquery.admin": ["bigquery.*"],
  "roles/bigquery.dataOwner": ["bigquery.datasets.*", "bigquery.tables.*", "bigquery.routines.*", "bigquery.models.*"],
  "roles/bigquery.dataEditor": ["bigquery.datasets.get", "bigquery.tables.*", "bigquery.routines.*", "bigquery.models.*"],
  "roles/bigquery.dataViewer": [
    "bigquery.datasets.get",
    "bigquery.tables.get",
    "bigquery.tables.getData",
    "bigquery.tables.list",
  ],
  "roles/bigquery.user": ["bigquery.jobs.create", "bigquery.datasets.get", "bigquery.tables.list"],
  "roles/bigquery.jobUser": ["bigquery.jobs.create"],
};

function expandGcpRole(role: string, unknown: string[]): string[] {
  const known = GCP_ROLES[role];
  if (known) return known;
  const admin = /^roles\/([a-z0-9]+)\.admin$/i.exec(role);
  if (admin) return [`${admin[1].toLowerCase()}.*`];
  unknown.push(role);
  return [role]; // kept so service-scope still sees the "roles/<service>.x" prefix
}

// ---------- per-cloud normalizers ----------

function normalizeAws(doc: Json): Grant[] {
  const statements = deepValues(doc, "Statement").flatMap((s) => (Array.isArray(s) ? s : [s])).filter(isObj);
  return statements.map((s) => {
    const effect = String(get(s, "Effect") ?? "Allow").toLowerCase() === "deny" ? "deny" : "allow";
    const actions = strs(get(s, "Action"));
    // Allow + NotAction grants every action except the listed ones: treat as "*".
    if (effect === "allow" && has(s, "NotAction")) actions.push("*");
    const resources = strs(get(s, "Resource"));
    if (effect === "allow" && has(s, "NotResource")) resources.push("*");
    return { effect, actions, notActions: [], resources, condition: serialize(get(s, "Condition")) };
  });
}

function normalizeAzure(doc: Json): Grant[] {
  const permSets = deepObjects(doc, (o) => ["Actions", "DataActions", "NotActions", "NotDataActions"].some((k) => has(o, k)));
  const scopes = [...deepValues(doc, "AssignableScopes"), ...deepValues(doc, "scope")].flatMap(strs);
  const conditions = deepValues(doc, "condition").map(serialize).filter((x): x is string => !!x);
  return permSets.map((p) => ({
    effect: "allow" as const,
    actions: [...strs(get(p, "Actions")), ...strs(get(p, "DataActions"))],
    notActions: [...strs(get(p, "NotActions")), ...strs(get(p, "NotDataActions"))],
    resources: scopes,
    condition: conditions.length ? conditions.join(" && ") : null,
  }));
}

function normalizeGcp(doc: Json, unknownRoles: string[]): Grant[] {
  const resources = [
    ...deepValues(doc, "resource"),
    ...deepValues(doc, "resources"),
    ...deepValues(doc, "scope"),
  ].flatMap(strs);
  const bindings = deepValues(doc, "bindings").flatMap((b) => (Array.isArray(b) ? b : [b])).filter(isObj);
  const grants: Grant[] = bindings.map((b) => {
    const roles = strs(get(b, "role"));
    const cond = get(b, "condition");
    const expr = isObj(cond) ? serialize(get(cond, "expression")) : serialize(cond);
    return {
      effect: "allow" as const,
      actions: roles.filter((r) => r.startsWith("roles/")).flatMap((r) => expandGcpRole(r, unknownRoles)),
      notActions: [],
      resources: [...resources, ...strs(get(b, "resource"))],
      condition: expr,
    };
  });
  // Custom role definitions / raw permission lists.
  const perms = [...deepValues(doc, "includedPermissions"), ...deepValues(doc, "permissions")].flatMap(strs);
  // Bare top-level "role" outside of bindings.
  const looseRoles = isObj(doc) ? strs(get(doc, "role")).filter((r) => r.startsWith("roles/")) : [];
  if (perms.length || looseRoles.length) {
    const exprs = deepValues(doc, "expression").map(serialize).filter((x): x is string => !!x);
    grants.push({
      effect: "allow",
      actions: [...perms, ...looseRoles.flatMap((r) => expandGcpRole(r, unknownRoles))],
      notActions: [],
      resources,
      condition: exprs.length ? exprs.join(" && ") : null,
    });
  }
  return grants;
}

export function detectCloud(doc: Record<string, unknown>): Cloud | "unknown" {
  if (deepValues(doc, "Statement").length) return "aws";
  if (
    deepObjects(doc, (o) => ["Actions", "DataActions", "NotActions", "AssignableScopes"].some((k) => has(o, k))).length
  )
    return "azure";
  if (["bindings", "includedPermissions", "permissions", "role"].some((k) => deepValues(doc, k).length)) return "gcp";
  return "unknown";
}

export function normalize(doc: Record<string, unknown>): Normalized {
  const unknownRoles: string[] = [];
  if (get(doc, "refused") === true || get(doc, "needs_clarification") === true) {
    return { cloud: "unknown", grants: [], refusal: { reason: String(get(doc, "reason") ?? "") }, unknownRoles };
  }
  const cloud = detectCloud(doc);
  const grants =
    cloud === "aws" ? normalizeAws(doc) : cloud === "azure" ? normalizeAzure(doc) : cloud === "gcp" ? normalizeGcp(doc, unknownRoles) : [];
  return { cloud, grants, refusal: null, unknownRoles };
}

// ---------- action matching ----------

/** Does glob `pattern` ('*' = any run, '?' = one char) match literal `s`? Case-insensitive. */
export function globMatch(pattern: string, s: string): boolean {
  const re = new RegExp(
    "^" + pattern.toLowerCase().replace(/[.+^${}()|[\]\\/]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
  );
  return re.test(s.toLowerCase());
}

/** Can some string match BOTH globs? Used for "does s3:* overlap s3:Put*". */
export function globsIntersect(a: string, b: string): boolean {
  const A = a.toLowerCase();
  const B = b.toLowerCase();
  const memo = new Map<string, boolean>();
  const f = (i: number, j: number): boolean => {
    const key = `${i},${j}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let r: boolean;
    if (i === A.length && j === B.length) r = true;
    else if (i < A.length && A[i] === "*") r = f(i + 1, j) || (j < B.length && f(i, j + 1));
    else if (j < B.length && B[j] === "*") r = f(i, j + 1) || (i < A.length && f(i + 1, j));
    else if (i < A.length && j < B.length && (A[i] === B[j] || A[i] === "?" || B[j] === "?")) r = f(i + 1, j + 1);
    else r = false;
    memo.set(key, r);
    return r;
  };
  return f(0, 0);
}

/**
 * Is `target` (a literal or a glob) granted by the policy? Granted means: some Allow
 * pattern overlaps it, that grant's NotActions don't cover it, and no Deny covers it.
 * "Covers" is approximated by matching the deny pattern against the target text.
 * Deny resource scope is ignored (a Deny on any resource counts), which errs strict.
 */
export function isGranted(grants: Grant[], target: string): { granted: boolean; by: string[] } {
  const denied = grants.some((g) => g.effect === "deny" && g.actions.some((d) => globMatch(d, target)));
  if (denied) return { granted: false, by: [] };
  const by: string[] = [];
  for (const g of grants) {
    if (g.effect !== "allow") continue;
    if (g.notActions.some((n) => globMatch(n, target))) continue;
    for (const a of g.actions) if (globsIntersect(a, target)) by.push(a);
  }
  return { granted: by.length > 0, by: Array.from(new Set(by)) };
}

// ---------- per-cloud vocab ----------

export function isWildcardAction(cloud: Cloud | "unknown", a: string): boolean {
  if (a.trim() === "*") return true;
  if (cloud === "aws") return /^[^:]+:\*$/.test(a);
  if (cloud === "gcp") return /^[a-z0-9]+\.\*$/i.test(a);
  if (cloud === "azure") return /^[^/]+\/\*$/.test(a);
  return false;
}

export function serviceOf(cloud: Cloud | "unknown", a: string): string {
  if (a.trim() === "*") return "*";
  if (cloud === "aws") return a.split(":")[0].toLowerCase();
  if (cloud === "gcp") return a.replace(/^roles\//, "").split(".")[0].toLowerCase();
  if (cloud === "azure") return a.split("/")[0].toLowerCase();
  return a.toLowerCase();
}

export function isWildcardResource(cloud: Cloud | "unknown", r: string): boolean {
  const s = r.trim();
  if (s === "*" || s === "/" || s === "") return true;
  if (cloud === "aws" && s.startsWith("arn:")) {
    const parts = s.split(":");
    const service = parts[2] ?? "";
    const id = parts.slice(5).join(":");
    if (id === "" || id.startsWith("*")) return true; // arn:aws:s3:::*  or ...:*
    // "<type>/*" means every resource of that type (table/*, key/*, repository/*).
    // S3 has no type prefix, so "bucket/*" names a bucket and is fine.
    if (service !== "s3" && /^[^/]+\/\*$/.test(id)) return true;
    return false;
  }
  // GCP resource paths and Azure scopes: ending in "/*" means "everything under here".
  return s.endsWith("/*");
}
