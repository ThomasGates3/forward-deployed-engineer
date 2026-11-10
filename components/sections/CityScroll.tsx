"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Button } from "@/components/ui";
import { FRAME_COUNT, frameSrc, media, stages, type Stage } from "@/content/city-scroll";
import { startCityScroll } from "@/lib/city-scroll-engine";

const navItems = [
  { label: "Projects", href: "#gallery" },
  { label: "How I work", href: "#how" },
  { label: "Resume", href: "/resume" },
  { label: "Contact", href: "#contact" },
];

const tag = (s: Stage) => `[${s.n} ${s.label.toUpperCase()}]`;

function StageCard({ s, children }: { s: Stage; children?: React.ReactNode }) {
  return (
    <div className="cs-card" data-testid={`cs-stage-${s.n}`}>
      {/* Keyframe still: only shown in the static (reduced-motion / no-JS) list. */}
      <img className="cs-still" src={s.still} alt={s.stillAlt} loading="lazy" width={640} height={360} />
      <div>
        <p className="cs-tag">{tag(s)}</p>
        {s.title && <h2 className="cs-title">{s.title}</h2>}
        {s.body && <p className="cs-body">{s.body}</p>}
        {s.href && (
          <a href={s.href} className="cs-link" data-testid={`cs-link-${s.n}`}>
            See it live <span aria-hidden>→</span>
          </a>
        )}
        {children}
      </div>
    </div>
  );
}

export function CityScroll() {
  const [mode, setMode] = useState<"static" | "film">("static");
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLPictureElement>(null);
  const engine = useRef<ReturnType<typeof startCityScroll>>();

  // Server markup is the static view (poster + list). Upgrade to the film unless motion is reduced.
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMode(mq.matches ? "static" : "film");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (mode !== "film" || !section) return;
    engine.current = startCityScroll(
      {
        section,
        canvas: canvasRef.current!,
        video: videoRef.current!,
        poster: posterRef.current!,
        fades: Array.from(section.querySelectorAll<HTMLElement>("[data-range]")),
        dots: Array.from(section.querySelectorAll<HTMLElement>(".cs-dot")),
      },
      {
        frameCount: FRAME_COUNT,
        frameSrc,
        video: media.video,
        videoMobile: media.videoMobile,
        stageStarts: stages.map((s) => s.start),
      },
    );
    return () => { engine.current?.stop(); engine.current = undefined; };
  }, [mode]);

  const [rooftop, ...rest] = stages;

  return (
    <section
      id="city-scroll"
      ref={sectionRef}
      aria-label="Scroll through the city"
      className="cs"
      data-mode={mode}
      data-testid="city-scroll"
    >
      <div className="cs-stage">
       <div className="cs-frame">
        <picture ref={posterRef} className="cs-poster">
          <source media="(max-width: 767px)" srcSet={media.posterMobile} width={720} height={1280} />
          <img
            src={media.poster}
            alt="Thomas Gates III on a rooftop above a futuristic city at dusk, laptop open, a cyan data orb beside him"
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <canvas ref={canvasRef} className="cs-media" aria-hidden />
        <video ref={videoRef} className="cs-media" muted playsInline preload="auto" aria-hidden tabIndex={-1} />

        <div className="cs-shade" aria-hidden />
        <div className="cs-vignette" aria-hidden />

        <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2" aria-label="Primary">
          <div className="flex items-center gap-2.5 rounded-b-2xl bg-black/90 px-3 py-2.5 backdrop-blur-sm sm:gap-7 sm:px-5 md:gap-11 md:rounded-b-3xl md:px-9">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="whitespace-nowrap font-mono text-[9px] uppercase tracking-wider text-cream/70 transition-colors hover:text-accent sm:text-[10px] md:text-xs"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Stage 01: the existing hero, the page's only h1. */}
        <div className="cs-hero" data-range={`${rooftop.start},${rooftop.end}`} data-testid="cs-stage-01">
          <div className="grid grid-cols-12 items-end gap-6">
            <div className="col-span-12 lg:col-span-8">
              <p className="cs-tag mb-3 pl-1">{tag(rooftop)}</p>
              <h1 className="cs-rise whitespace-nowrap font-display font-medium leading-[0.85] tracking-[-0.05em] text-cream text-[9.5vw] sm:text-[11vw] md:text-[9.5vw] lg:text-[7.5vw]">
                Thomas Gates III
              </h1>
              <p className="cs-rise mt-1.5 pl-1 font-display text-lg font-bold uppercase tracking-wide text-white [animation-delay:120ms] sm:mt-3 sm:text-xl md:pl-2 md:text-2xl">
                Forward Deployed Engineer
              </p>
            </div>
            <div className="col-span-12 flex flex-col gap-4 sm:items-end sm:pb-16 lg:col-span-4 lg:pb-24">
              <p className="cs-rise max-w-xs text-xs leading-snug text-cream/80 [animation-delay:200ms] sm:ml-auto sm:text-right sm:text-sm md:text-base">
                I build AI systems that collapse hours of busywork into seconds. Not demos,
                production. Everything below runs live.
              </p>
              <div className="cs-rise z-20 [animation-delay:280ms]">
                <LiquidButton href="#gallery" size="xxl" className="group gap-3 pl-8 pr-2.5 text-base sm:gap-5 sm:pl-12 sm:text-2xl" data-testid="hero-cta">
                  View projects
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent transition-transform duration-150 ease-[var(--ease-out)] group-hover:scale-110 sm:h-[3.75rem] sm:w-[3.75rem]">
                    <ArrowRight className="h-5 w-5 text-ink sm:h-7 sm:w-7" />
                  </span>
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>

        <nav className="cs-rail" aria-label="City scroll stages">
          {stages.map((s, i) => (
            <button
              key={s.n}
              type="button"
              className="cs-dot"
              aria-label={`Go to ${s.n} ${s.label}`}
              aria-current={i === 0 ? "true" : undefined}
              data-testid={`cs-dot-${s.n}`}
              onClick={() => engine.current?.scrollToStage(i)}
            />
          ))}
        </nav>
       </div>

      {/* Stages 02 to 05: glass HUD cards over the film, or a stacked list in the static view. */}
      <div className="cs-cards">
        {rest.map((s) =>
          s.items ? (
            <div key={s.n} className="cs-group" data-testid={`cs-stage-${s.n}`}>
              <p className="cs-tag cs-static-only">{tag(s)}</p>
              <img className="cs-still" src={s.still} alt={s.stillAlt} loading="lazy" width={640} height={360} />
              {s.items.map((it, j) => (
                <div key={it.title} className={`cs-card cs-item cs-item-${j}`} data-range={`${it.start},${s.end}`}>
                  <p className="cs-tag cs-film-only">{tag(s)}</p>
                  <h2 className="cs-title">{it.title}</h2>
                  <p className="cs-body">{it.body}</p>
                  {it.href && (
                    <a href={it.href} className="cs-link" data-testid={`cs-link-${s.n}-${j + 1}`}>
                      See it live <span aria-hidden>→</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div key={s.n} className="cs-slot" data-range={`${s.start},${s.end}`}>
              <StageCard s={s}>
                {s.n === "05" && (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <a href="mailto:thomasthethird3@gmail.com" data-testid="cs-email"><Button>Email me →</Button></a>
                    <a href="/resume" data-testid="cs-resume"><Button variant="outline">View résumé</Button></a>
                    <a href="#gallery" className="cs-link mt-0" data-testid="cs-projects">See the projects ↓</a>
                  </div>
                )}
              </StageCard>
            </div>
          ),
        )}
      </div>
      </div>
    </section>
  );
}
