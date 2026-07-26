import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies, caseStudyBySlug } from "@/content/case-studies";
import { Badge, Button } from "@/components/ui";
import { SpeedToLeadPipeline } from "@/components/demos/SpeedToLeadPipeline";
import { OptimisticOS } from "@/components/demos/OptimisticOS";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-edge py-8">
      <p className="eyebrow mb-4">{title}</p>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((i, k) => (
        <li key={k} className="flex gap-3 text-cream/90">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span className="leading-relaxed">{i}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const c = caseStudyBySlug[params.slug];
  if (!c) notFound();
  return (
    <main className="container-x py-20 md:py-28">
      <Link href="/#work" className="font-mono text-xs text-muted hover:text-accent">← All case studies</Link>
      <h1 className="mt-6 font-display text-hero text-cream">{c.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{c.tagline}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {c.stack.map((s) => (
          <Badge key={s} tone="accent">{s}</Badge>
        ))}
      </div>

      <div className="mt-10 max-w-2xl">
        <Block title="Problem"><p className="leading-relaxed text-cream/90">{c.problem}</p></Block>
        <Block title="What I built"><List items={c.build} /></Block>
        <Block title="Architecture"><List items={c.architecture} /></Block>
        <Block title="Outcome"><p className="leading-relaxed text-cream/90">{c.outcome}</p></Block>
        {c.demo && (
          <div className="border-t border-edge pt-8">
            <Link href={c.demo.href}><Button>{c.demo.label} →</Button></Link>
          </div>
        )}
      </div>

      {c.liveDemo && (
        <div className="mt-12 border-t border-edge pt-10">
          <p className="eyebrow mb-4">Live demo</p>
          {c.liveDemo === "speed-to-lead" && <SpeedToLeadPipeline />}
          {c.liveDemo === "optimistic-os" && <OptimisticOS />}
        </div>
      )}
    </main>
  );
}
