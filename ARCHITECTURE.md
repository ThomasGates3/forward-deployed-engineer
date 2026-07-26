# ARCHITECTURE.md — FDE Portfolio

This is the single source of truth every agent/contributor follows. Read it fully before writing code. Conventions here override personal defaults.

## 0. What this site is

A portfolio for **Forward Deployed Engineer** roles. Its job is to prove, simultaneously:
1. **UI/UX range** — a crafted, coherent, distinctive site (not a template).
2. **Real shipping ability** — most "projects" are *live, working AI tools* a visitor can click and get real value from, safely and cheaply.

Everything below serves those two goals. No dead links, no "coming soon."

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14 App Router** + TypeScript | Server components by default; demos are client islands |
| Styling | **Tailwind CSS** | Custom design tokens (see §4). No shadcn default look. |
| Motion | **Framer Motion** | Sparingly, with intent. Reusable primitives only (§4.4). |
| Hosting | **Vercel** | |
| Rate-limit store | **Upstash Redis** | ⚠️ Vercel KV is discontinued — provision Upstash via Vercel Marketplace. `@upstash/redis` (REST, edge-safe). |
| LLM | **Claude Haiku** (`claude-haiku-4-5`) | Server routes ONLY. `max_tokens` 300–500. Anthropic SDK (`@anthropic-ai/sdk`). |
| Email | **Resend** | One demo (Speed to Lead) sends a real email. |

### Env vars (server-only unless prefixed `NEXT_PUBLIC_`)
```
ANTHROPIC_API_KEY=          # server only — NEVER NEXT_PUBLIC
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
LEAD_FROM_EMAIL=            # verified Resend sender, e.g. "Portfolio <hi@domain.com>"
```
`.env.example` ships with dummy values. Real keys live in `.env.local` (gitignored) and Vercel env. No key ever reaches the client.

## 2. Folder structure

```
app/
  layout.tsx                 # fonts, theme, <body> shell
  page.tsx                   # single-page composition: Hero → Gallery → Range → HowIWork → Contact
  globals.css                # Tailwind + design tokens as CSS vars
  case-studies/
    speed-to-lead/page.tsx
    ntw-markets/page.tsx
    optimistic-os/page.tsx
  api/ai/
    agent-designer/route.ts
    speed-to-lead/route.ts
    support-reply/route.ts
    extract/route.ts
    automation-architect/route.ts
components/
  ui/                        # Button, Card, Badge, SectionHeading, CodeBlock, CopyButton…
  motion/                    # FadeIn, Stagger, Reveal (Framer primitives)
  sections/                  # Hero, Gallery, RangeStrip, HowIWork, Contact
  demos/                     # one client component per live tool (see §6)
lib/
  ai-rate-limit.ts           # THE shared contract — every route imports this (§5)
  anthropic.ts               # single Claude client + callHaiku() helper
  redis.ts                   # Upstash client singleton
  visitor.ts                 # visitor id (IP hash / cookie)
  exports/                   # skill-folder & n8n-json generators for Agent Designer
content/
  case-studies.ts            # real copy (§7), typed
  gallery.ts                 # demo card metadata
  fallbacks.ts               # canned example responses per demo (§5)
ARCHITECTURE.md
```

## 3. Design language (shared across whole site)

Read `/mnt/skills/public/frontend-design/SKILL.md` (or the `frontend-design` skill) before building UI. Direction:

- **Dark-mode-first**, developer-credible but warm — a builder's workshop, not cold SaaS.
- **Accent: not indigo/violet.** Proposed: warm signal — `--accent: #FF6A3D` (ember/orange) against near-black `#0B0C0E` with a paper-cream text `#ECE7DF`. One accent, used decisively.
- **Type:** editorial pairing — a grotesk display (e.g. Space Grotesk / General Sans) for headings + a mono (JetBrains Mono / Geist Mono) for labels, code, and "system" microcopy that signals engineering. Body in a clean sans.
- **Type scale:** deliberate, large hero step-up (e.g. clamp 2.5→5rem), generous whitespace.
- **Motion:** entrance reveals + one signature interaction (the "run" state on demos — a live "thinking" shimmer). Never decorative-only.
- Every demo card, case study, and range item reuses the same `Card`, `SectionHeading`, `Badge`, and motion primitives so the site reads as ONE portfolio.

## 4. Shared component contract
- `components/ui/*` are the only place raw Tailwind primitives get styled. Sections/demos compose these — no re-styling buttons ad hoc.
- Motion lives only in `components/motion/*`. Demos import `<FadeIn>`, `<Reveal>`; they don't call `motion.*` directly.

## 5. Shared backend contract — BUILD THIS FIRST (`lib/ai-rate-limit.ts`)

Every `/api/ai/*` route is a thin wrapper. It must NOT call Claude directly — it calls `guardedClaude()`.

```ts
// signature every route uses
type DemoResult<T> =
  | { ok: true; source: "live"; data: T }
  | { ok: true; source: "fallback"; data: T; reason: "per-visitor-cap" | "global-cap" }

guardedClaude<T>(opts: {
  req: Request
  tool: string                 // e.g. "agent-designer" — keys the counters
  buildMessages: () => Anthropic.MessageParam[]
  parse: (raw: string) => T     // validate/shape model output
  fallback: T                   // pre-saved example (content/fallbacks.ts)
  maxTokens?: number            // default 400
}): Promise<DemoResult<T>>
```

Order of operations inside `guardedClaude`:
1. Resolve visitor id via `lib/visitor.ts` (SHA-256 of IP + salt, or a set-once `httpOnly` cookie).
2. **Per-visitor counter**: `ai:{tool}:{visitorId}:{YYYY-MM-DD}` — cap **3/day**. Atomic `INCR` + `EXPIRE` (24h).
3. **Global counter**: `ai:global:{YYYY-MM-DD}` — cap **200/day** site-wide.
4. If either cap exceeded → return `{ ok:true, source:"fallback", data: fallback, reason }`. **The tool never looks broken** — the UI renders the canned example with a clearly labeled "Example response (daily limit reached)" badge.
5. Otherwise call Claude Haiku with `max_tokens`, run `parse()`, return `source:"live"`. On parse/model error → also fall back gracefully (never 500 to the visitor).

**Rules:**
- API key only ever read server-side inside `lib/anthropic.ts`.
- Counters increment only on a *real* Claude call (fallbacks are free).
- Friendly message + labeled example is mandatory on every cap hit. No raw error states.
- Input limits enforced server-side: max input length per tool (e.g. 2–4k chars), reject/truncate oversized input before spending tokens.

## 6. The live demos (priority order)

| # | Demo | Route | Live output |
|---|---|---|---|
| 1 | **AI Agent Designer** (flagship) | `agent-designer` | System prompt + suggested tools. 3 exports: copy prompt, download Claude Code **skill folder** (SKILL.md + structure, zipped), download **n8n workflow JSON** with a Claude HTTP node pre-filled. Validates the whole pattern first. |
| 2 | **Speed to Lead** | `speed-to-lead` | Visitor submits own name+email as a fake lead. Claude qualifies live (shows reasoning, not just verdict). Real **Resend** email of the AI-drafted follow-up sent to them. SMS side = simulated phone mockup with live-generated text, labeled "simulated delivery" — no fake real send. |
| 3 | **Brokerage Support Reply** | `support-reply` | Preset scenario (deposit delay / KYC / spread-rollover) or pasted message → compliant on-brand reply. Case-study copy frames it as modeled on real forex/crypto brokerage work. |
| 4 | **Messy Doc → Structured Data** | `extract` | Paste/upload messy text → clean JSON rendered as a formatted table. The clearest "integration wall" demo. |
| 5 | **Automation Architect** | `automation-architect` | One-sentence process → trigger→steps→logic rendered as a legible box-and-arrow flow (not real n8n canvas). Copy-to-clipboard. |

Each demo = one client component in `components/demos/` + one route in `app/api/ai/`. Cards live inline in the Gallery; "Try it" expands the tool in place.

## 7. Site sections
1. **Hero** — positioning line: *I embed with businesses and ship AI into production.* Sub-line points at gallery.
2. **Live Gallery** — the centerpiece; the 5 demos above.
3. **Case Studies** (3 deep dives): Speed to Lead, NTW Markets suite, Optimistic OS. Format each: Problem → What I built → Architecture → Outcome → Live demo/walkthrough.
4. **Range strip** — lighter grid: DCA/ETF simulator (embed live if repo accessible, else polished screenshot + link), real-estate PM dashboard, n8n workflow diagrams.
5. **How I work** — discovery → build → deploy → measure.
6. **Contact / resume download.**

### Case study copy = real, grounded, no invented metrics
- **Speed to Lead**: n8n + Twilio + SendGrid + Claude API + Next.js dashboard.
- **NTW Markets**: SOP system w/ transformer.js semantic search; CRM call-logging analytics (Next.js 14 / Neon / Drizzle / Recharts); IB earnings calculator.
- **Optimistic OS**: six-agent pipeline — trend research → image gen → Etsy listing → Pinterest scheduling.
Where a real number isn't known, describe the qualitative outcome honestly. Never fabricate a stat.

## 8. Build order
1. **ARCHITECTURE.md** (this file) — done, pending your approval.
2. Scaffold + design system (tokens, type, motion primitives) + empty routes for all sections.
3. Shared `lib/ai-rate-limit.ts` + `anthropic.ts` + `redis.ts` + `visitor.ts`.
4. AI Agent Designer end-to-end (validates the pattern).
5. Remaining 4 demos, reusing the pattern.
6. Case study pages with real copy.
7. Range strip (+ live DCA/ETF embed if reachable).
8. Final pass: click **every** interactive element — zero dead states — before "done."

## 9. Security / conventions
- Secrets: `.env.local` gitignored; `.env.example` with dummies; Vercel env for prod. Follow repo security checklist.
- No `NEXT_PUBLIC_` on any secret. Client never sees keys or calls Claude directly.
- Validate/sanitize all visitor input server-side (length + type). Render model output safely (no raw HTML injection).
- `npm audit` before commits; commit messages 1–3 lines.
