"use client";
import Link from "next/link";
import { demos } from "@/content/gallery";
import { Card, Badge, SectionHeading, Button } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";

export function Gallery() {
  return (
    <section id="gallery" className="container-x py-20 md:py-28">
      <SectionHeading
        eyebrow="Live gallery"
        title="Five working AI tools. Each in its own world."
        sub="Every tool is a real server-side Claude call, rate-limited and free to try — and each opens as its own fully-themed experience. Hit a limit and it gracefully shows a saved example, never a broken state."
      />
      <Stagger className="grid gap-5 md:grid-cols-2">
        {demos.map((d) => (
          <StaggerItem key={d.id}>
            <Link href={`/tools/${d.id}`} className="block h-full">
              <Card className="group h-full p-6 transition hover:border-accent/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-display text-xl text-cream group-hover:text-accent">{d.name}</h3>
                      {d.flagship && <Badge tone="accent">Flagship</Badge>}
                    </div>
                    <p className="max-w-lg text-sm leading-relaxed text-muted">{d.value}</p>
                  </div>
                  <Button variant="outline" className="pointer-events-none shrink-0">Try it →</Button>
                </div>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
