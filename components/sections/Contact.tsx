"use client";
import { Button, SectionHeading } from "@/components/ui";

// Thomas: replace with your real booking link before this goes live. Empty = no button rendered.
export const BOOK_INTRO_HREF = "";
export const EMAIL_HREF = "mailto:thomasthethird3@gmail.com";

export function Contact() {
  return (
    <section id="contact" className="container-x py-20 md:py-32">
      <div className="rounded-3xl border border-edge bg-surface/60 p-10 shadow-card md:p-16">
        <SectionHeading
          eyebrow="Contact"
          title="Let's put AI into your production."
          sub="Hiring a Forward Deployed Engineer? I'd like to hear about the role. Have a workflow you want AI to take off your team's plate? Send me a note and we'll set up a short intro. The tools above are the fastest way to see how I work."
        />
        <div className="flex flex-wrap gap-3">
          <a href={EMAIL_HREF} data-testid="contact-email"><Button>Email me →</Button></a>
          <a href="/resume" data-testid="contact-resume"><Button variant="outline">View résumé</Button></a>
          {BOOK_INTRO_HREF && (
            <a href={BOOK_INTRO_HREF} data-testid="contact-book"><Button variant="outline">Book a short intro</Button></a>
          )}
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-2xl text-center font-mono text-xs leading-relaxed text-muted">
        Built with Next.js. The tools hosted here run on Claude Haiku and are rate-limited. The IAM Policy
        Generator and Product Contextualizer are standalone Gemini apps.
      </p>
    </section>
  );
}
