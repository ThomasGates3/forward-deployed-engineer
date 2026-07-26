"use client";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui";

export function Hero() {
  return (
    <header className="relative overflow-hidden">
      <div className="container-x pt-28 pb-20 md:pt-40 md:pb-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <Badge tone="ember">Forward Deployed Engineer</Badge>
          <h1 className="mt-6 font-display text-hero text-cream">
            I embed with businesses<br />and ship AI into <span className="text-ember">production</span>.
          </h1>
          <p className="mt-6 max-w-xl font-mono text-sm leading-relaxed text-muted">
            Not slides — working tools. Everything below is a live Claude-powered feature you can
            click and get real value from. Scroll to try them.
          </p>
          <div className="mt-8 flex items-center gap-3 font-mono text-xs text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ember" />
            <a href="#gallery" className="hover:text-cream">↓ Live gallery</a>
            <span className="text-edge">/</span>
            <a href="#work" className="hover:text-cream">Case studies</a>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
