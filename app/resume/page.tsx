import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "Thomas Gates III — Forward Deployed Engineer · Résumé",
  description: "Résumé of Thomas Gates III, Forward Deployed Engineer. Ships LLM and agentic AI systems into production.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-edge py-6 print:py-2.5">
      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-accent print:mb-1.5 print:text-[10px] print:text-black">{title}</h2>
      {children}
    </section>
  );
}

function Role({
  org, title, dates, bullets,
}: { org: string; title: string; dates: string; bullets: string[] }) {
  return (
    <div className="mb-6 last:mb-0 print:mb-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="font-display text-lg text-cream print:text-[13px] print:text-black">{org}</h3>
        <span className="font-mono text-xs text-muted print:text-[10px] print:text-neutral-600">{dates}</span>
      </div>
      <p className="mb-2 text-sm italic text-accent print:mb-1 print:text-[11px] print:text-neutral-700">{title}</p>
      <ul className="space-y-1.5 print:space-y-0.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-cream/90 print:text-[11px] print:leading-snug print:text-black">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent print:bg-black" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResumePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 print:max-w-none print:px-0 print:py-0 print:text-black">
      {/* Controls (hidden on print) */}
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link href="/" className="font-mono text-xs text-muted hover:text-accent">← Back to portfolio</Link>
        <PrintButton />
      </div>

      {/* Header */}
      <header className="border-b border-edge pb-6 print:pb-2.5">
        <h1 className="font-display text-4xl font-medium tracking-tight text-cream print:text-2xl print:text-black">Thomas Gates III</h1>
        <p className="mt-1 font-display text-lg text-accent print:text-sm print:text-neutral-700">Forward Deployed Engineer</p>
        <p className="mt-2 font-mono text-xs text-muted print:mt-1 print:text-[10px] print:text-neutral-600">
          Atlanta, GA (EST) · 404-786-2193 · thomasthethird3@gmail.com · github.com/ThomasGates3
        </p>
      </header>

      <Section title="Summary">
        <p className="text-sm leading-relaxed text-cream/90 print:text-black">
          Engineer who embeds with teams and ships AI into production. I build and deploy LLM-powered and
          multi-agent systems end to end. That means designing prompts and evals, reviewing tool calls and agent
          behavior, and building systems hands-on with Claude, Vertex AI, Google AI Studio, and other frontier
          tools, then wiring them into real infrastructure and APIs and hardening them with rate limiting, graceful
          fallbacks, and monitoring. Backed by 5+ years of customer-facing engineering, cloud (AWS and Azure), and
          automation across Python, TypeScript, Bash, and PowerShell. I move fast under ambiguity and translate
          fluidly between engineers and non-technical stakeholders.
        </p>
      </Section>

      <Section title="Skills">
        <dl className="grid gap-x-8 gap-y-2 text-sm print:gap-y-1 print:text-[11px] sm:grid-cols-[max-content_1fr]">
          {[
            ["AI / LLM", "LLM & agentic systems · prompt design · eval-driven development · tool-call review & debugging · RAG & semantic search · multi-agent orchestration · Claude · Vertex AI · Google AI Studio · Google Flow · rate limiting & fallbacks · MCP"],
            ["Languages", "Python · TypeScript / JavaScript · Bash · PowerShell · SQL"],
            ["Web / Product", "Next.js 14 · React · Node · Neon / Postgres · Drizzle · Vercel · Tailwind"],
            ["Cloud / Infra", "AWS · Azure · GCP · Vertex AI · IAM · CI/CD (GitHub Actions) · Docker"],
            ["Automation", "Event-driven pipelines · webhooks · Twilio · Resend · scheduled jobs"],
            ["Foundations", "Incident response · monitoring · NIST · ISO 27001 · SOC 2"],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-mono text-xs uppercase tracking-wider text-accent print:text-[10px] print:text-black">{k}</dt>
              <dd className="text-cream/90 print:text-[11px] print:text-black">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Professional Experience">
        <Role
          org="Universal Technical Services"
          title="Security Engineer / IT Compliance Auditor"
          dates="Jan 2021 – Feb 2026"
          bullets={[
            "Automated patch management, system hardening, and access-management workflows with Python, PowerShell, and Bash, improving operational efficiency roughly 35% and building the scripting-into-production habits central to deployment work.",
            "Secured AWS and Azure environments with CSPM tooling, cutting critical vulnerabilities roughly 30%, and enforced least-privilege IAM and MFA across 40+ enterprise systems.",
            "Documented configurations and controls against NIST, ISO 27001, and SOC 2, and reported risk-reduction status to technical and non-technical stakeholders.",
          ]}
        />
        <Role
          org="Spectrum"
          title="Technical Support Engineer"
          dates="Mar 2023 – May 2024"
          bullets={[
            "Customer-facing engineering for 500+ end users: administered Windows and Linux systems, drove patching to SLA, and resolved issues at an 89% first-call resolution rate.",
            "Stood up logging and monitoring integrated with SIEM, supporting incident detection and response, and automated routine ops with PowerShell and Bash.",
          ]}
        />
      </Section>

      <Section title="Certifications & Education">
        <ul className="space-y-1.5 text-sm text-cream/90 print:space-y-0.5 print:text-[11px] print:text-black">
          <li>AWS Certified Cloud Practitioner · CISA · OCI Foundations Associate</li>
          <li>B.S. Computer Science, East Carolina University, 2020</li>
        </ul>
      </Section>

      <Section title="Relevant Projects">
        <Role
          org="AI-Powered IAM Policy Generator"
          title="TypeScript · Gemini · Vercel"
          dates="2026"
          bullets={[
            "Deployed a production app that turns plain-English requests into least-privilege AWS, GCP, and Azure IAM policies, with the model key held server-side and usage rate-limited.",
          ]}
        />
        <Role
          org="Ops Copilot: Tool-Calling Agent"
          title="Claude tool-use API · Next.js"
          dates="2026"
          bullets={[
            "Built a multi-turn agent using Claude's real tool-calling API against a live dataset, rendering every tool call inline and gating sensitive actions behind human confirmation.",
          ]}
        />
      </Section>
    </main>
  );
}
