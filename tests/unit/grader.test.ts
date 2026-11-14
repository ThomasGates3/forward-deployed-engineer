// Tests that evaluate the evaluator. For every rule: a known-good policy that must
// pass and a deliberately bad one that must fail. If the grader drifts, these catch it
// before a model output is ever scored.
import { describe, it, expect } from "vitest";
import { gradePolicy, type GradeResult } from "@/lib/evals/grader";
import { getCase, type EvalCase } from "@/lib/evals/cases";

const c = (id: string): EvalCase => {
  const tc = getCase(id);
  if (!tc) throw new Error(`missing case ${id}`);
  return tc;
};
const rule = (g: GradeResult, name: string) => {
  const r = g.rules.find((x) => x.name === name);
  if (!r) throw new Error(`rule ${name} not reported; got ${g.rules.map((x) => x.name).join(",")}`);
  return r;
};
const j = (o: unknown) => JSON.stringify(o);

// Known-good answers, one per standard case.
const GOOD = {
  s3: j({
    Version: "2012-10-17",
    Statement: [
      { Effect: "Allow", Action: ["s3:GetObject"], Resource: "arn:aws:s3:::reports-prod/*" },
      { Effect: "Allow", Action: "s3:ListBucket", Resource: "arn:aws:s3:::reports-prod" },
    ],
  }),
  cicd: j({
    Version: "2012-10-17",
    Statement: [
      { Effect: "Allow", Action: ["ecs:RegisterTaskDefinition", "ecr:GetAuthorizationToken"], Resource: "*" },
      {
        Effect: "Allow",
        Action: ["ecs:UpdateService", "ecs:DescribeServices"],
        Resource: "arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/web",
      },
      {
        Effect: "Allow",
        Action: ["ecr:PutImage", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload"],
        Resource: "arn:aws:ecr:us-east-1:123456789012:repository/web",
      },
      { Effect: "Allow", Action: "iam:PassRole", Resource: "arn:aws:iam::123456789012:role/web-task-role" },
    ],
  }),
  bq: j({
    bindings: [
      {
        role: "roles/bigquery.dataViewer",
        members: ["user:analyst@example.com"],
        resource: "projects/acme/datasets/sales_analytics",
      },
    ],
  }),
  gcs: j({
    bindings: [
      {
        role: "roles/storage.objectCreator",
        members: ["serviceAccount:backend@acme.iam.gserviceaccount.com"],
        condition: { title: "one bucket", expression: 'resource.name.startsWith("projects/_/buckets/uploads-prod")' },
      },
    ],
  }),
  azure: j({
    Name: "Invoices Blob Reader",
    IsCustom: true,
    Actions: ["Microsoft.Storage/storageAccounts/blobServices/containers/read"],
    NotActions: [],
    DataActions: ["Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read"],
    NotDataActions: [],
    AssignableScopes: [
      "/subscriptions/0000/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/acct/blobServices/default/containers/invoices",
    ],
  }),
  dynamo: j({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"],
        Resource: "arn:aws:dynamodb:us-east-1:123456789012:table/orders",
      },
    ],
  }),
  kms: j({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: "kms:Decrypt",
        Resource: "arn:aws:kms:us-east-1:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab",
      },
    ],
  }),
  breakGlass: j({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: "*",
        Resource: "*",
        Condition: { Bool: { "aws:MultiFactorAuthPresent": "true" } },
      },
    ],
  }),
};

describe("known-good answers pass every case", () => {
  const pairs: Array<[string, string]> = [
    ["s3-read-lambda", GOOD.s3],
    ["cicd-ecs-ecr", GOOD.cicd],
    ["bq-analyst-read", GOOD.bq],
    ["gcs-upload-service", GOOD.gcs],
    ["azure-blob-reader", GOOD.azure],
    ["dynamodb-order-service", GOOD.dynamo],
    ["kms-decrypt-only", GOOD.kms],
    ["admin-break-glass", GOOD.breakGlass],
  ];
  it.each(pairs)("%s", (id, policy) => {
    const g = gradePolicy(c(id), policy);
    expect(g.failedRules).toEqual([]);
    expect(g.passed).toBe(true);
    expect(g.warnings).toEqual([]);
  });
});

describe("valid_json", () => {
  it("passes parseable JSON", () => expect(rule(gradePolicy(c("s3-read-lambda"), GOOD.s3), "valid_json").passed).toBe(true));
  it("fails prose and skips the rest", () => {
    const g = gradePolicy(c("s3-read-lambda"), "Sure! Here is your policy: {Action: s3:GetObject");
    expect(rule(g, "valid_json").passed).toBe(false);
    expect(g.passed).toBe(false);
    expect(g.outcome).toBe("invalid");
  });
  it("fails a JSON array or scalar (not a policy document)", () => {
    expect(gradePolicy(c("s3-read-lambda"), "[1,2]").passed).toBe(false);
    expect(gradePolicy(c("s3-read-lambda"), '"ok"').passed).toBe(false);
  });
  it("tolerates markdown fences but warns", () => {
    const g = gradePolicy(c("s3-read-lambda"), "```json\n" + GOOD.s3 + "\n```");
    expect(g.passed).toBe(true);
    expect(g.warnings).toContain("no_markdown_fences");
  });
});

describe("no_wildcard_action", () => {
  it("passes scoped actions", () =>
    expect(rule(gradePolicy(c("s3-read-lambda"), GOOD.s3), "no_wildcard_action").passed).toBe(true));
  it('fails bare "*"', () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: "*", Resource: "arn:aws:s3:::reports-prod/*" }] });
    expect(rule(gradePolicy(c("s3-read-lambda"), p), "no_wildcard_action").passed).toBe(false);
  });
  it('fails service-level "s3:*"', () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: ["s3:GetObject", "s3:*"], Resource: "arn:aws:s3:::reports-prod/*" }] });
    const g = gradePolicy(c("s3-read-lambda"), p);
    expect(rule(g, "no_wildcard_action").passed).toBe(false);
    expect(rule(g, "no_wildcard_action").detail).toContain("s3:*");
  });
  it("fails Allow + NotAction (grants everything except the listed actions)", () => {
    const p = j({ Statement: [{ Effect: "Allow", NotAction: "iam:*", Resource: "arn:aws:s3:::reports-prod/*" }] });
    expect(rule(gradePolicy(c("s3-read-lambda"), p), "no_wildcard_action").passed).toBe(false);
  });
  it('fails Azure "actions":["*"] (lowercase ARM keys)', () => {
    const p = j({
      properties: {
        roleName: "x",
        permissions: [{ actions: ["*"], notActions: [], dataActions: [] }],
        assignableScopes: ["/subscriptions/0/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/a/blobServices/default/containers/invoices"],
      },
    });
    expect(rule(gradePolicy(c("azure-blob-reader"), p), "no_wildcard_action").passed).toBe(false);
  });
  it('fails Azure provider-level "Microsoft.Storage/*"', () => {
    const p = j({ Actions: ["Microsoft.Storage/*"], AssignableScopes: ["/subscriptions/0/x/containers/invoices"] });
    expect(rule(gradePolicy(c("azure-blob-reader"), p), "no_wildcard_action").passed).toBe(false);
  });
  it("fails a GCP owner role", () => {
    const p = j({ bindings: [{ role: "roles/owner", members: ["user:a@x.com"], resource: "projects/acme/datasets/sales_analytics" }] });
    expect(rule(gradePolicy(c("bq-analyst-read"), p), "no_wildcard_action").passed).toBe(false);
  });
  it("fails a GCP service admin role (roles/storage.admin => storage.*)", () => {
    const p = j({ bindings: [{ role: "roles/storage.admin", members: ["user:a@x.com"], resource: "projects/_/buckets/b" }] });
    expect(rule(gradePolicy(c("gcs-upload-service"), p), "no_wildcard_action").passed).toBe(false);
  });
  it("is skipped (not failed) for the break-glass case", () => {
    const r = rule(gradePolicy(c("admin-break-glass"), GOOD.breakGlass), "no_wildcard_action");
    expect(r.passed).toBe(true);
    expect(r.skipped).toBe(true);
  });
});

describe("no_wildcard_resource", () => {
  it("passes named ARNs, including bucket/* object ARNs", () =>
    expect(rule(gradePolicy(c("s3-read-lambda"), GOOD.s3), "no_wildcard_resource").passed).toBe(true));
  it('fails Resource "*"', () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: "s3:GetObject", Resource: "*" }] });
    expect(rule(gradePolicy(c("s3-read-lambda"), p), "no_wildcard_resource").passed).toBe(false);
  });
  it('fails a "*" hidden inside a list of ARNs', () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: "s3:GetObject", Resource: ["arn:aws:s3:::reports-prod/*", "*"] }] });
    expect(rule(gradePolicy(c("s3-read-lambda"), p), "no_wildcard_resource").passed).toBe(false);
  });
  it("fails an all-buckets ARN (arn:aws:s3:::*)", () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: "s3:GetObject", Resource: "arn:aws:s3:::*" }] });
    expect(rule(gradePolicy(c("s3-read-lambda"), p), "no_wildcard_resource").passed).toBe(false);
  });
  it("fails an all-tables ARN (table/*)", () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: ["dynamodb:GetItem", "dynamodb:PutItem"], Resource: "arn:aws:dynamodb:*:*:table/*" }] });
    expect(rule(gradePolicy(c("dynamodb-order-service"), p), "no_wildcard_resource").passed).toBe(false);
  });
  it("fails Allow + NotResource", () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: "s3:GetObject", NotResource: "arn:aws:s3:::other" }] });
    expect(rule(gradePolicy(c("s3-read-lambda"), p), "no_wildcard_resource").passed).toBe(false);
  });
  it('allows "*" only for actions AWS gives no resource-level permissions', () => {
    expect(rule(gradePolicy(c("cicd-ecs-ecr"), GOOD.cicd), "no_wildcard_resource").passed).toBe(true);
    const p = j({ Statement: [{ Effect: "Allow", Action: ["ecr:GetAuthorizationToken", "ecr:PutImage"], Resource: "*" }] });
    expect(rule(gradePolicy(c("cicd-ecs-ecr"), p), "no_wildcard_resource").passed).toBe(false);
  });
  it("fails an Azure root or wildcard scope", () => {
    const p = j({ DataActions: ["Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read"], AssignableScopes: ["/"] });
    expect(rule(gradePolicy(c("azure-blob-reader"), p), "no_wildcard_resource").passed).toBe(false);
  });
  it("fails a GCP bucket wildcard", () => {
    const p = j({ bindings: [{ role: "roles/storage.objectCreator", members: ["x"], resource: "projects/_/buckets/*" }] });
    expect(rule(gradePolicy(c("gcs-upload-service"), p), "no_wildcard_resource").passed).toBe(false);
  });
});

describe("named_resource_present", () => {
  it("passes when the named resource is in a resource field", () =>
    expect(rule(gradePolicy(c("dynamodb-order-service"), GOOD.dynamo), "named_resource_present").passed).toBe(true));
  it("passes when the named resource is in a GCP condition expression", () => {
    const p = j({
      bindings: [{ role: "roles/bigquery.dataViewer", members: ["x"], condition: { expression: 'resource.name.endsWith("datasets/sales_analytics")' } }],
    });
    expect(rule(gradePolicy(c("bq-analyst-read"), p), "named_resource_present").passed).toBe(true);
  });
  it("fails when the wrong resource is named", () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: "s3:GetObject", Resource: "arn:aws:s3:::example-bucket/*" }] });
    expect(rule(gradePolicy(c("s3-read-lambda"), p), "named_resource_present").passed).toBe(false);
  });
  it("does not count the name appearing only outside scope fields (e.g. a Sid)", () => {
    const p = j({ Statement: [{ Sid: "orders", Effect: "Allow", Action: "dynamodb:GetItem", Resource: "arn:aws:dynamodb:us-east-1:1:table/customers" }] });
    expect(rule(gradePolicy(c("dynamodb-order-service"), p), "named_resource_present").passed).toBe(false);
  });
  it("requireScope: fails a GCP binding with no resource or condition at all", () => {
    const p = j({ bindings: [{ role: "roles/storage.objectCreator", members: ["x"] }] });
    expect(rule(gradePolicy(c("gcs-upload-service"), p), "named_resource_present").passed).toBe(false);
  });
});

describe("required_actions_present", () => {
  it("passes when the action is granted directly", () =>
    expect(rule(gradePolicy(c("kms-decrypt-only"), GOOD.kms), "required_actions_present").passed).toBe(true));
  it("passes when a known GCP role implies the permission", () =>
    expect(rule(gradePolicy(c("bq-analyst-read"), GOOD.bq), "required_actions_present").passed).toBe(true));
  it("fails when the core action is missing", () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: "s3:ListBucket", Resource: "arn:aws:s3:::reports-prod" }] });
    const r = rule(gradePolicy(c("s3-read-lambda"), p), "required_actions_present");
    expect(r.passed).toBe(false);
    expect(r.detail).toContain("s3:GetObject");
  });
  it("fails Azure control-plane read without the blob read data action", () => {
    const p = j({
      Actions: ["Microsoft.Storage/storageAccounts/blobServices/containers/read"],
      AssignableScopes: ["/subscriptions/0/x/containers/invoices"],
    });
    expect(rule(gradePolicy(c("azure-blob-reader"), p), "required_actions_present").passed).toBe(false);
  });
  it("does not count an action that a Deny statement removes", () => {
    const p = j({
      Statement: [
        { Effect: "Allow", Action: "kms:Decrypt", Resource: "arn:aws:kms:us-east-1:1:key/k" },
        { Effect: "Deny", Action: "kms:*", Resource: "*" },
      ],
    });
    expect(rule(gradePolicy(c("kms-decrypt-only"), p), "required_actions_present").passed).toBe(false);
  });
});

describe("forbidden_actions_absent", () => {
  it("passes a read-only S3 policy", () =>
    expect(rule(gradePolicy(c("s3-read-lambda"), GOOD.s3), "forbidden_actions_absent").passed).toBe(true));
  it("fails s3:DeleteObject on a read-only request", () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: ["s3:GetObject", "s3:DeleteObject"], Resource: "arn:aws:s3:::reports-prod/*" }] });
    const r = rule(gradePolicy(c("s3-read-lambda"), p), "forbidden_actions_absent");
    expect(r.passed).toBe(false);
    expect(r.detail).toContain("s3:Delete*");
  });
  it('fails "s3:*" because it overlaps s3:Put*', () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: "s3:*", Resource: "arn:aws:s3:::reports-prod/*" }] });
    expect(rule(gradePolicy(c("s3-read-lambda"), p), "forbidden_actions_absent").passed).toBe(false);
  });
  it("fails a GCS role that includes delete (objectAdmin)", () => {
    const p = j({ bindings: [{ role: "roles/storage.objectAdmin", members: ["x"], resource: "projects/_/buckets/b" }] });
    expect(rule(gradePolicy(c("gcs-upload-service"), p), "forbidden_actions_absent").passed).toBe(false);
  });
  it("fails a raw GCP storage.objects.list permission", () => {
    const p = j({ includedPermissions: ["storage.objects.create", "storage.objects.list"], resource: "projects/_/buckets/b" });
    expect(rule(gradePolicy(c("gcs-upload-service"), p), "forbidden_actions_absent").passed).toBe(false);
  });
  it("fails kms:ScheduleKeyDeletion and kms:PutKeyPolicy", () => {
    const p = j({
      Statement: [{ Effect: "Allow", Action: ["kms:Decrypt", "kms:ScheduleKeyDeletion", "kms:PutKeyPolicy"], Resource: "arn:aws:kms:us-east-1:1:key/k" }],
    });
    const r = rule(gradePolicy(c("kms-decrypt-only"), p), "forbidden_actions_absent");
    expect(r.passed).toBe(false);
    expect(r.detail).toContain("kms:ScheduleKeyDeletion");
    expect(r.detail).toContain("kms:PutKeyPolicy");
  });
  it("passes kms:* when an explicit Deny covers the forbidden actions (no_wildcard_action still fails)", () => {
    const p = j({
      Statement: [
        { Effect: "Allow", Action: "kms:*", Resource: "arn:aws:kms:us-east-1:1:key/k" },
        { Effect: "Deny", Action: ["kms:ScheduleKeyDeletion", "kms:DeleteImportedKeyMaterial", "kms:PutKeyPolicy"], Resource: "*" },
      ],
    });
    const g = gradePolicy(c("kms-decrypt-only"), p);
    expect(rule(g, "forbidden_actions_absent").passed).toBe(true);
    expect(rule(g, "no_wildcard_action").passed).toBe(false);
  });
  it("fails Azure blob delete data action", () => {
    const p = j({
      DataActions: [
        "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read",
        "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/delete",
      ],
      AssignableScopes: ["/subscriptions/0/x/containers/invoices"],
    });
    expect(rule(gradePolicy(c("azure-blob-reader"), p), "forbidden_actions_absent").passed).toBe(false);
  });
});

describe("scoped_to_requested_service", () => {
  it("passes when every action is in an allowed service", () =>
    expect(rule(gradePolicy(c("cicd-ecs-ecr"), GOOD.cicd), "scoped_to_requested_service").passed).toBe(true));
  it("fails an extra service even if the expected one is present", () => {
    const p = j({
      Statement: [{ Effect: "Allow", Action: ["s3:GetObject", "logs:PutLogEvents"], Resource: "arn:aws:s3:::reports-prod/*" }],
    });
    const r = rule(gradePolicy(c("s3-read-lambda"), p), "scoped_to_requested_service");
    expect(r.passed).toBe(false);
    expect(r.detail).toContain("logs");
  });
  it("is not fooled by the service name appearing only in a resource string", () => {
    // Old substring grader passed this because "s3" appears in the ARN.
    const p = j({ Statement: [{ Effect: "Allow", Action: "ec2:DescribeInstances", Resource: "arn:aws:s3:::reports-prod" }] });
    expect(rule(gradePolicy(c("s3-read-lambda"), p), "scoped_to_requested_service").passed).toBe(false);
  });
  it("fails the wrong cloud format (AWS policy for a GCP request)", () => {
    const r = rule(gradePolicy(c("bq-analyst-read"), GOOD.s3), "scoped_to_requested_service");
    expect(r.passed).toBe(false);
    expect(r.detail).toMatch(/aws/i);
  });
  it("break-glass: passes any AWS action but fails a non-AWS document", () => {
    expect(rule(gradePolicy(c("admin-break-glass"), GOOD.breakGlass), "scoped_to_requested_service").passed).toBe(true);
    const gcpOwner = j({ bindings: [{ role: "roles/owner", members: ["group:oncall@x.com"] }] });
    const g = gradePolicy(c("admin-break-glass"), gcpOwner);
    expect(rule(g, "scoped_to_requested_service").passed).toBe(false);
    expect(g.passed).toBe(false);
  });
});

describe("condition_present (warn, break-glass only)", () => {
  it("passes with an MFA condition", () =>
    expect(rule(gradePolicy(c("admin-break-glass"), GOOD.breakGlass), "condition_present").passed).toBe(true));
  it("warns, but does not fail the case, when no Condition is set", () => {
    const p = j({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }] });
    const g = gradePolicy(c("admin-break-glass"), p);
    const r = rule(g, "condition_present");
    expect(r.passed).toBe(false);
    expect(r.severity).toBe("warn");
    expect(g.passed).toBe(true);
    expect(g.warnings).toContain("condition_present");
  });
  it("is not reported for ordinary cases", () =>
    expect(gradePolicy(c("s3-read-lambda"), GOOD.s3).rules.some((r) => r.name === "condition_present")).toBe(false));
});

describe("result shape", () => {
  it("lists exactly the failed fail-severity rules", () => {
    const p = j({ Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }] });
    const g = gradePolicy(c("s3-read-lambda"), p);
    expect(g.passed).toBe(false);
    expect(g.failedRules.sort()).toEqual(
      ["forbidden_actions_absent", "named_resource_present", "no_wildcard_action", "no_wildcard_resource", "scoped_to_requested_service"].sort(),
    );
    expect(g.rules.every((r) => typeof r.detail === "string" && r.detail.length > 0)).toBe(true);
  });
});
