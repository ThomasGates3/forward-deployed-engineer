"use client";
import { SectionHeading, Card, Badge } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";

const range = [
  { name: "DCA / ETF Simulator", note: "Interactive dollar-cost-averaging backtester — live tool.", tags: ["React", "Charts"] },
  { name: "Real Estate PM Dashboard", note: "Property-management ops dashboard for units, tenants, and cashflow.", tags: ["Next.js", "Dashboard"] },
  { name: "n8n Workflow Library", note: "Reusable automation workflows — triggers, branching, integrations.", tags: ["n8n", "Automation"] },
];

export function RangeStrip() {
  return (
    <section className="container-x py-20 md:py-28">
      <SectionHeading eyebrow="Range" title="Breadth, not just flagships." sub="Smaller builds that show the span — data tools, dashboards, automation." />
      <Stagger className="grid gap-4 sm:grid-cols-3">
        {range.map((r) => (
          <StaggerItem key={r.name}>
            <Card className="h-full p-5">
              <h3 className="font-display text-lg text-cream">{r.name}</h3>
              <p className="mt-2 text-sm text-muted">{r.note}</p>
              <div className="mt-3 flex gap-1.5">
                {r.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
