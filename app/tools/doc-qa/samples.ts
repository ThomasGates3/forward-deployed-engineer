// Two realistic sample documents used to demo grounded retrieval without a blank-page dead end.

export const HANDBOOK = `Northbridge Analytics Employee Handbook

Welcome to Northbridge Analytics. This handbook outlines our policies on time off, remote work, expenses, and benefits. It applies to all full-time employees unless otherwise noted.

Paid Time Off (PTO)

Full-time employees accrue 15 days of paid time off (PTO) per year during their first two years of employment, increasing to 20 days per year after two years of continuous service. PTO accrues monthly and is visible in the HR portal under Time Off.

Up to 5 unused PTO days may be carried over into the following calendar year. Any remaining unused PTO balance beyond that will be paid out at the employee's current base rate upon separation from the company.

To request PTO, submit a request through the HR portal at least 5 business days in advance for planned absences. Sick leave does not require advance notice but should be reported to your manager as soon as reasonably possible, ideally before the start of your shift.

Northbridge also observes 10 paid public holidays per year, published annually in January on the company intranet.

Remote Work Policy

Employees in roles designated "remote-eligible" by their department head may work remotely up to 4 days per week, with at least 1 day per week spent in a Northbridge office or approved coworking space for team collaboration.

Fully remote roles (no in-office requirement) exist for select positions and are noted explicitly in the job description at time of hire. Employees relocating to a new state or country must notify HR at least 30 days in advance, as this may affect payroll tax withholding and benefits eligibility.

Remote employees are expected to maintain a reliable internet connection (minimum 25 Mbps download) and be reachable during their designated core hours, typically 10am–3pm in their local time zone, unless otherwise agreed with their manager.

Expense Reimbursement

Employees may submit expense reports for business-related purchases including travel, client meals, software subscriptions required for work, and conference registration fees. All expense reports must be submitted within 60 days of the purchase date through the Expensify system.

Receipts are required for any single expense over $25. Meals during business travel are reimbursed up to $75 per day; alcohol is not reimbursable except at company-approved client events. Airfare should be booked in economy class for flights under 6 hours; business class requires VP-level pre-approval for longer flights.

Reimbursements are typically processed within 10 business days of approval and are paid out via direct deposit alongside the next regular payroll cycle.

Health and Retirement Benefits

Northbridge offers medical, dental, and vision insurance to all full-time employees, effective on the first day of the month following 30 days of employment. The company covers 80% of the employee premium and 60% of dependent premiums for the standard PPO plan.

A 401(k) retirement plan is available to all employees starting on day one, with Northbridge matching 50% of employee contributions up to 6% of base salary. The employer match vests over 3 years on a graded schedule: 33% after year one, 66% after year two, and 100% after year three.

Employees are also eligible for up to $1,000 per year in professional development reimbursement, covering courses, certifications, and conference attendance relevant to their role, subject to manager approval.

Parental Leave

Northbridge provides 12 weeks of paid parental leave for the primary caregiver and 6 weeks for the secondary caregiver, following the birth, adoption, or fostering of a child. Leave must be taken within 12 months of the qualifying event and can be split into two blocks with manager approval.

Workplace Conduct

All employees are expected to treat colleagues, clients, and partners with respect. Harassment, discrimination, and retaliation of any kind are strictly prohibited and should be reported to HR immediately, either directly or through the anonymous ethics hotline listed on the intranet homepage.`;

export const SUPPORT_KB = `Lumen Cloud Product and API Support Knowledge Base

This knowledge base covers account setup, troubleshooting common errors, billing, and refund policy for the Lumen Cloud platform.

Getting Started

To create a Lumen Cloud account, sign up at lumencloud.io/signup with a valid work email. New accounts start on the Free tier, which includes 10,000 API requests per month and access to a single project workspace. To upgrade, go to Settings → Billing → Change Plan.

API keys are generated from the Developer Console under API Keys → Create New Key. Each key can be scoped to read-only or read-write access. We strongly recommend rotating API keys every 90 days and never committing them to source control. Keys are shown only once at creation time; if lost, you must revoke and generate a new one.

Rate Limits

The Free tier is limited to 10 requests per second per API key. The Pro tier raises this to 50 requests per second, and Enterprise plans have custom limits negotiated with your account manager. Exceeding your rate limit returns an HTTP 429 status code with a Retry-After header indicating how many seconds to wait before retrying.

Sustained rate-limit violations (more than 100 in a rolling hour) may result in a temporary automatic throttle of your account to protect platform stability; this typically lifts within 15 minutes.

Common Errors

A 401 Unauthorized response means your API key is missing, invalid, or has been revoked. Check the Authorization header is formatted as "Bearer <key>". A 403 Forbidden response means your key is valid but lacks permission for that endpoint; check the key's scope in the Developer Console.

A 500 Internal Server Error is on our end. These are rare; if you see one, check status.lumencloud.io first, and if there's no listed incident, contact support with the request ID from the response headers so we can investigate.

Timeouts on large batch uploads are usually caused by payload size. The API accepts a maximum of 10MB per request. For larger datasets, use the bulk import endpoint, which accepts pre-signed upload URLs and processes files asynchronously.

Billing

Lumen Cloud bills monthly on the anniversary of your signup date. The Pro plan is $49/month per workspace and includes 250,000 API requests; overage is billed at $0.20 per 1,000 additional requests. Enterprise pricing is custom and invoiced quarterly.

You can view your current usage and projected bill at any time under Settings → Billing → Usage. We send an email alert at 80% and 100% of your included quota each billing cycle.

Failed payments are retried automatically after 3 days and again after 7 days. If payment still fails after the second retry, the account is downgraded to the Free tier until a valid payment method is added; no data is deleted during this downgrade period.

Refund Policy

Monthly subscriptions are eligible for a full refund if requested within 14 days of the charge, provided the workspace has used less than 20% of its included request quota for that billing period. Refund requests are submitted via Settings → Billing → Request Refund or by emailing billing@lumencloud.io with your workspace ID.

Approved refunds are processed to the original payment method within 5–10 business days. Annual plans are refundable on a prorated basis only within the first 30 days of the annual term; after 30 days, annual plans are non-refundable but can be downgraded at the next renewal.

Usage-based overage charges are non-refundable, as they reflect API requests already served.

Cancellation does not require contacting support. You can cancel anytime from Settings → Billing → Cancel Plan. Cancellation takes effect at the end of the current billing period, and your workspace reverts to the Free tier with no data loss.`;
