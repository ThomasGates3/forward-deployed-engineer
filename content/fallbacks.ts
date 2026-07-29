// Pre-saved example responses. Served (clearly labeled) when a daily cap is hit,
// the API key is unset, or a call errors — so no demo ever looks broken.
// Shapes here MUST match each route's parsed output type.

export const fallbacks = {
  "agent-designer": {
    systemPrompt:
      "You are a Support Triage Agent for a B2B SaaS company. Your job is to read inbound customer messages and (1) classify urgency (low/normal/high), (2) identify the product area, and (3) draft a concise, empathetic first response.\n\nAlways: cite the relevant help-doc when one applies, never promise refunds or timelines you can't verify, and escalate billing disputes to a human by tagging @billing. Keep replies under 120 words. Match the customer's language and tone.",
    tools: [
      "Knowledge base search (semantic) over help docs",
      "CRM lookup — pull customer plan + account status",
      "Escalation webhook — route billing/legal to a human queue",
      "Email/Slack send for the drafted reply",
    ],
  },
  "speed-to-lead": {
    verdict: "Qualified: High intent",
    score: 82,
    reasoning:
      "Named a specific use case and a timeframe ('this quarter'), which signals budget and urgency. Company-domain email raises fit confidence. No blocking objections. Recommend routing to a human within 5 minutes and booking a call.",
    followupEmail:
      "Hi Alex, thanks for reaching out! It sounds like you're trying to cut response time on inbound leads before end of quarter. That's exactly what we help teams do. I've got two slots open tomorrow, would 11am or 2pm work for a quick 15-minute call to map it to your setup? Sam",
    sms: "Hi Alex, it's Sam, saw your note about speeding up lead response this quarter. Free for a quick call tomorrow at 11am or 2pm?",
  },
  "speed-to-lead-pipeline": {
    verdict: "Qualified — High intent",
    score: 82,
    reasoning:
      "Named a specific use case and a timeframe ('this quarter'), which signals budget and urgency. Company-domain email raises fit confidence. No blocking objections. Recommend routing to a human within 5 minutes and booking a call.",
    followupEmail:
      "Hi Alex — thanks for reaching out! It sounds like you're trying to cut response time on inbound leads before end of quarter. That's exactly what we help teams do. I've got two slots open tomorrow — would 11am or 2pm work for a quick 15-minute call to map it to your setup? — Sam",
    sms: "Hi Alex, it's Sam — saw your note about speeding up lead response this quarter. Free for a quick call tomorrow at 11am or 2pm?",
    branch: "high-intent",
    enrichment: {
      company: "Northwind Retail (guessed from email domain)",
      size: "50–200 employees",
      signals: [
        "Company-domain email — not a free inbox",
        "Explicit timeframe ('this quarter') signals active budget",
        "Named a concrete use case, not a tire-kicker query",
      ],
    },
  },
  "support-reply": {
    reply:
      "Hi James, thanks for reaching out and sorry for the delay. I can see your refund was approved on our side — refunds typically land back on the original card within 5–10 business days, though the exact timing depends on your bank. You can confirm the refund status anytime under Billing → History. If it hasn't appeared after 10 business days, reply here with the last 4 digits of the card and the approval date, and I'll escalate it to our billing team right away. Thanks for your patience.",
    notes: ["No guaranteed timeline — uses a range + bank caveat", "Directs to self-serve status first", "Clear escalation path with required info"],
  },
  extract: {
    fields: [
      { key: "invoice_number", value: "INV-2043" },
      { key: "vendor", value: "Northwind Supplies Ltd" },
      { key: "date", value: "2026-03-14" },
      { key: "subtotal", value: "1,240.00" },
      { key: "tax", value: "99.20" },
      { key: "total", value: "1,339.20" },
      { key: "currency", value: "USD" },
      { key: "due_date", value: "2026-04-13" },
    ],
  },
  "automation-architect": {
    trigger: "New row added to 'Inbound Leads' Google Sheet",
    steps: [
      { title: "Enrich", detail: "Look up company domain via Clearbit; append size + industry" },
      { title: "Qualify", detail: "Claude scores fit + intent from the message and enrichment" },
      { title: "Branch", detail: "If score ≥ 70 → notify sales in Slack; else → nurture sequence" },
      { title: "Log", detail: "Write outcome + score back to the sheet and CRM" },
    ],
  },
  "optimistic-os": {
    trend:
      "Cottagecore-inspired pressed-flower botanicals are surging into summer — searches for 'wildflower wall art' and 'boho botanical print' are up quarter-over-quarter, driven by neutral-palette home refreshes and gift-giving for weddings.",
    concept: {
      title: "Pressed Wildflower Botanical — Warm Neutral Print",
      description:
        "A minimalist pressed-flower composition of wildflowers on a warm cream ground, framed by generous negative space. Reads as calm, editorial, and giftable — sized for a gallery wall and easy to bundle as a set.",
    },
    imagePrompt:
      "Minimalist pressed wildflower botanical art print, delicate dried flowers arranged on a warm cream paper background, soft natural light, editorial flat-lay, muted neutral palette, high detail, negative space",
    etsy: {
      title: "Pressed Wildflower Botanical Print | Boho Neutral Wall Art | Printable Download",
      tags: [
        "botanical print",
        "wildflower art",
        "boho wall art",
        "neutral home decor",
        "pressed flowers",
        "printable download",
        "cottagecore",
      ],
      description:
        "Bring a calm, editorial touch to any room with this pressed wildflower botanical print. Warm neutral tones pair with any decor — perfect on its own or as part of a gallery wall. Instant digital download in multiple sizes; print at home or through your favorite lab.",
    },
    pinterest: {
      caption:
        "Warm-neutral pressed wildflower print for the cottagecore gallery wall of your dreams 🌾 Instant download, print any size. #botanicalart #bohodecor #wallart",
      schedule: "Queued for Tue & Thu 7:00 PM (peak home-decor browsing window)",
    },
  },
  "optimistic-image": {
    imageUrl:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80",
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
