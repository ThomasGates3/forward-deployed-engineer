// Pre-saved example responses. Served (clearly labeled) when a daily cap is hit,
// the API key is unset, or a call errors — so no demo ever looks broken.
// Shapes here MUST match each route's parsed output type.

export const fallbacks = {
  "speed-to-lead": {
    verdict: "Qualified: High intent",
    score: 82,
    reasoning:
      "Named a specific use case and a timeframe ('this quarter'), which signals budget and urgency. Company-domain email raises fit confidence. No blocking objections. Recommend routing to a human within 5 minutes and booking a call.",
    followupEmail:
      "Hi Alex, thanks for reaching out! It sounds like you're trying to cut response time on inbound leads before end of quarter. That's exactly what we help teams do. I've got two slots open tomorrow, would 11am or 2pm work for a quick 15-minute call to map it to your setup? Sam",
    sms: "Hi Alex, it's Sam, saw your note about speeding up lead response this quarter. Free for a quick call tomorrow at 11am or 2pm?",
  },
  "doc-qa": {
    answer:
      "Employees accrue 15 PTO days per year during their first two years, rising to 20 days after two years of tenure [Source 1]. Unused PTO up to 5 days may roll over into the next calendar year, and any additional unused balance is paid out upon separation [Source 2].",
    relevant_chunk_indices: [1, 2],
    citations: [
      {
        chunk_index: 1,
        quote:
          "Full-time employees accrue 15 days of paid time off (PTO) per year during their first two years of employment, increasing to 20 days per year after two years of continuous service.",
      },
      {
        chunk_index: 2,
        quote:
          "Up to 5 unused PTO days may be carried over into the following calendar year. Any remaining unused PTO balance beyond that will be paid out at the employee's current base rate upon separation from the company.",
      },
    ],
  },
  "ops-copilot": {
    finalReply:
      "Order 1042 was delivered on 2026-07-20 to Dana Kim, one Wireless Earbuds Pro. Since it arrived damaged, I've proposed a full refund of $89.99 for review below.",
    toolCalls: [
      {
        tool: "lookup_order",
        input: { order_id: "1042" },
        result: {
          order_id: "1042",
          customer_name: "Dana Kim",
          status: "delivered",
          items: ["ELEC-4471 x1"],
          total: 89.99,
          eta: "2026-07-20",
        },
      },
      { tool: "issue_refund", input: { order_id: "1042", amount: 89.99, reason: "Item arrived damaged" } },
    ],
    transcript: [
      { role: "user", content: "Refund order #1042, the item arrived damaged" },
      { role: "assistant", content: "Let me pull up that order first." },
      {
        role: "tool_call",
        tool: "lookup_order",
        input: { order_id: "1042" },
        result: {
          order_id: "1042",
          customer_name: "Dana Kim",
          status: "delivered",
          items: ["ELEC-4471 x1"],
          total: 89.99,
          eta: "2026-07-20",
        },
      },
      {
        role: "assistant",
        content:
          "Found it: order 1042, Dana Kim, delivered 2026-07-20, one Wireless Earbuds Pro at $89.99. I'll propose a full refund for the damaged item; please confirm before it's issued.",
      },
      {
        role: "tool_call",
        tool: "issue_refund",
        input: { order_id: "1042", amount: 89.99, reason: "Item arrived damaged" },
        pending: true,
      },
    ],
  },
  "evals": {
    default:
      '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:GetObject"],"Resource":"arn:aws:s3:::example-bucket/*"}]}',
    "s3-read-lambda":
      '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:GetObject","s3:ListBucket"],"Resource":["arn:aws:s3:::reports-prod","arn:aws:s3:::reports-prod/*"]}]}',
    "cicd-ecs-ecr":
      '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["ecs:UpdateService","ecs:RegisterTaskDefinition"],"Resource":"arn:aws:ecs:*:*:service/*"},{"Effect":"Allow","Action":["ecr:PutImage","ecr:UploadLayerPart","ecr:InitiateLayerUpload","ecr:CompleteLayerUpload"],"Resource":"arn:aws:ecr:*:*:repository/*"}]}',
    "bq-analyst-read":
      '{"bindings":[{"role":"roles/bigquery.dataViewer","members":["user:analyst@example.com"],"condition":{"title":"sales_analytics only","expression":"resource.name == \\"projects/example/datasets/sales_analytics\\""}}]}',
    "gcs-upload-service":
      '{"bindings":[{"role":"roles/storage.objectCreator","members":["serviceAccount:backend@example.iam.gserviceaccount.com"],"condition":{"title":"single bucket","expression":"resource.name.startsWith(\\"projects/_/buckets/example-bucket\\")"}}]}',
    "azure-blob-reader":
      '{"Name":"Invoices Blob Reader","IsCustom":true,"Actions":["Microsoft.Storage/storageAccounts/blobServices/containers/read"],"NotActions":[],"AssignableScopes":["/subscriptions/example/resourceGroups/example-rg/providers/Microsoft.Storage/storageAccounts/example/blobServices/default/containers/invoices"]}',
    "dynamodb-order-service":
      '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:Query"],"Resource":"arn:aws:dynamodb:*:*:table/orders"}]}',
    "kms-decrypt-only":
      '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["kms:Decrypt"],"Resource":"arn:aws:kms:*:*:key/example-key-id"}]}',
    "admin-break-glass":
      '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}',
  },
} as const;

export type Fallbacks = typeof fallbacks;
