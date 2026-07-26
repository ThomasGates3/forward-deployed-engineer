"use client";
import { Button, SectionHeading } from "@/components/ui";

export function Contact() {
  return (
    <section id="contact" className="container-x py-20 md:py-32">
      <div className="rounded-3xl border border-edge bg-surface/60 p-10 shadow-card md:p-16">
        <SectionHeading eyebrow="Contact" title="Let's put AI into your production." sub="Open to Forward Deployed Engineer roles. The fastest way to see how I work is above — every tool on this page is live." />
        <div className="flex flex-wrap gap-3">
          <a href="mailto:thomasthethird3@gmail.com"><Button>Email me →</Button></a>
          <a href="/resume"><Button variant="outline">View résumé</Button></a>
        </div>
      </div>
      <p className="mt-10 text-center font-mono text-xs text-muted">Built with Next.js + Claude Haiku · every demo is live and rate-limited</p>
    </section>
  );
}
