"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { demos } from "@/content/gallery";
import { demoComponents } from "@/components/demos/registry";
import { Card, Badge, SectionHeading, Button } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";

export function Gallery() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section id="gallery" className="container-x py-20 md:py-28">
      <SectionHeading
        eyebrow="Live gallery"
        title="Five working AI tools. Click any of them."
        sub="Each one calls Claude on the server, rate-limited and free to try. Hit a limit and it gracefully shows a saved example — never a broken state."
      />
      <Stagger className="grid gap-5 md:grid-cols-2">
        {demos.map((d) => {
          const Demo = demoComponents[d.id];
          const isOpen = open === d.id;
          return (
            <StaggerItem key={d.id} className={isOpen ? "md:col-span-2" : ""}>
              <Card className="h-full p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-display text-xl text-cream">{d.name}</h3>
                      {d.flagship && <Badge tone="ember">Flagship</Badge>}
                    </div>
                    <p className="max-w-lg text-sm leading-relaxed text-muted">{d.value}</p>
                  </div>
                  <Button variant={isOpen ? "ghost" : "outline"} onClick={() => setOpen(isOpen ? null : d.id)}>
                    {isOpen ? "Close" : "Try it →"}
                  </Button>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 border-t border-edge pt-6">
                        <Demo />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
