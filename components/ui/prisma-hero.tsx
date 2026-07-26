"use client";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: React.CSSProperties;
}

export const WordsPullUpMultiStyle = ({ segments, className = "", style }: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------------- Hero ----------------
   Customized from the Prisma template: FDE nav, real name/scene, working CTA. */
const navItems: { label: string; href: string; download?: boolean }[] = [
  { label: "Projects", href: "#gallery" },
  { label: "How I work", href: "#how" },
  { label: "Resume", href: "/resume" },
  { label: "Contact", href: "#contact" },
];

const PrismaHero = () => {
  return (
    <section className="w-full">
      <div className="relative h-[100svh] min-h-[600px] w-full overflow-hidden">
        {/* Background scene — plays /fde-hero.mp4, falling back to the poster still. */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-poster.jpg"
          aria-label="A 26-year-old African-American forward deployed engineer with black locs, sitting atop a tower typing on his laptop in a futuristic city at golden hour"
          className="absolute inset-0 h-full w-full object-cover object-center"
        >
          <source src="/fde-hero.mp4" type="video/mp4" />
        </video>

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-overlay" />

        {/* Gradient overlays: top for nav legibility, heavy bottom for headline */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />

        {/* Navbar — real FDE links */}
        <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-b-2xl bg-black/90 px-5 py-2.5 backdrop-blur-sm sm:gap-7 md:gap-11 md:rounded-b-3xl md:px-9">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                {...(item.download ? { download: true } : {})}
                className="font-mono text-[10px] uppercase tracking-wider text-cream/70 transition-colors hover:text-accent sm:text-xs"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Hero content — bottom anchored */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-7 sm:px-8 md:px-12 md:pb-12">
          <div className="grid grid-cols-12 items-end gap-6">
            <div className="col-span-12 lg:col-span-8">
              <h1 className="font-display font-medium leading-[0.85] tracking-[-0.05em] text-cream text-[13vw] sm:text-[11vw] md:text-[9.5vw] lg:text-[7.5vw]">
                <WordsPullUp text="Thomas Gates III" />
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-3 pl-1 font-display text-lg font-bold uppercase tracking-wide text-white sm:text-xl md:pl-2 md:text-2xl"
              >
                Forward Deployed Engineer
              </motion.p>
            </div>

            <div className="col-span-12 flex flex-col gap-5 pb-20 lg:col-span-4 lg:pb-24">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-sm text-sm leading-snug text-cream/80 md:text-base"
              >
                Forward deployed engineer embedding with teams to ship AI into production. Everything
                below is a live, working tool — not a screenshot. Try one.
              </motion.p>
            </div>
          </div>
        </div>

        {/* CTA anchored to the bottom-right corner — covers the video watermark */}
        <motion.a
          href="#gallery"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="group absolute bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-full bg-cream py-1 pl-5 pr-1 text-sm font-medium text-ink shadow-lg transition-all hover:gap-3 sm:bottom-6 sm:right-6"
        >
          View projects
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
            <ArrowRight className="h-4 w-4 text-ink" />
          </span>
        </motion.a>
      </div>
    </section>
  );
};

export { PrismaHero };
