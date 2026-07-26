"use client";
import Link from "next/link";
import { caseStudies } from "@/content/case-studies";
import { SectionHeading, Card, Badge } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";

export function CaseStudies() {
  return (
    <section id="work" className="container-x py-20 md:py-28">
      <SectionHeading eyebrow="Case studies" title="Three deep dives into shipped work." sub="Problem → what I built → architecture → outcome. Grounded in real engagements." />
      <Stagger className="grid gap-5 md:grid-cols-2">
        {caseStudies.map((c) => (
          <StaggerItem key={c.slug}>
            <Link href={`/case-studies/${c.slug}`}>
              <Card className="group flex h-full flex-col p-6 transition hover:border-ember/50">
                <h3 className="font-display text-xl text-cream group-hover:text-ember">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{c.tagline}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.stack.slice(0, 3).map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
                <span className="mt-4 font-mono text-xs text-ember">Read case study →</span>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
