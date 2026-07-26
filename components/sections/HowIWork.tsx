"use client";
import { SectionHeading } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";

const steps = [
  { n: "01", t: "Discover", d: "Sit with the team, find where the hours actually go and where AI earns its keep." },
  { n: "02", t: "Build", d: "Ship a working slice fast — real data, real integration, in production quickly." },
  { n: "03", t: "Deploy", d: "Wire it into the stack safely: keys server-side, rate limits, graceful fallbacks." },
  { n: "04", t: "Measure", d: "Instrument it, watch the outcome, iterate on what the numbers say." },
];

export function HowIWork() {
  return (
    <section className="container-x py-20 md:py-28">
      <SectionHeading eyebrow="How I work" title="Discovery → build → deploy → measure." />
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <StaggerItem key={s.n}>
            <div className="rounded-xl border border-edge p-5">
              <span className="font-mono text-sm text-ember">{s.n}</span>
              <h3 className="mt-2 font-display text-lg text-cream">{s.t}</h3>
              <p className="mt-2 text-sm text-muted">{s.d}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
