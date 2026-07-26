import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies, caseStudyBySlug } from "@/content/case-studies";
import { Badge, Button } from "@/components/ui";

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
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
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
      <Link href="/#work" className="font-mono text-xs text-muted hover:text-ember">← All case studies</Link>
      <h1 className="mt-6 font-display text-hero text-cream">{c.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{c.tagline}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {c.stack.map((s) => (
          <Badge key={s} tone="ember">{s}</Badge>
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
    </main>
  );
}
