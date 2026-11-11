"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Button } from "@/components/ui";
import { BOOK_INTRO_HREF, EMAIL_HREF } from "@/components/sections/Contact";
import { FRAME_COUNT, PROJECTS_HREF, frameSrc, media, stages, type Stage } from "@/content/city-scroll";
import { startCityScroll } from "@/lib/city-scroll-engine";

const navItems = [
  { label: "Projects", href: PROJECTS_HREF },
  { label: "How I work", href: "#how" },
  { label: "Resume", href: "/resume" },
  { label: "Contact", href: "#contact" },
];

// Keyframe still for the static list. Only fetched when that list is actually shown (reduced motion
// after hydration, or no JS via <noscript>), so film-mode visitors never download ~1 MB of stills.
function Still({ s, show }: { s: Stage; show: boolean }) {
  const img = <img className="cs-still" src={s.still} alt={s.stillAlt} loading="lazy" width={1920} height={1080} />;
  return show ? img : <noscript>{img}</noscript>;
}

function StageCard({ s, stills, children }: { s: Stage; stills: boolean; children?: React.ReactNode }) {
  return (
    <div className="cs-card" data-testid={`cs-stage-${s.n}`}>
      <Still s={s} show={stills} />
      <div>
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
  const [stills, setStills] = useState(false); // true only once we know the static list is showing
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLPictureElement>(null);
  const engine = useRef<ReturnType<typeof startCityScroll>>();

  // Server markup is the static view (poster + list). Upgrade to the film unless motion is reduced.
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { setMode(mq.matches ? "static" : "film"); setStills(mq.matches); };
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
        endStop: () => {
          const g = document.querySelector<HTMLElement>(PROJECTS_HREF);
          return g ? g.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(g).scrollMarginTop) || 0) : null;
        },
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
          {/* AVIF/WebP copies of the same 1080p stills (33 KB / 91 KB AVIF vs 146 KB / 295 KB JPG). */}
          <source media="(max-width: 767px)" type="image/avif" srcSet={media.posterMobile.replace(".jpg", ".avif")} width={1080} height={1920} />
          <source media="(max-width: 767px)" type="image/webp" srcSet={media.posterMobile.replace(".jpg", ".webp")} width={1080} height={1920} />
          <source media="(max-width: 767px)" srcSet={media.posterMobile} width={1080} height={1920} />
          <source type="image/avif" srcSet={media.poster.replace(".jpg", ".avif")} width={1920} height={1080} />
          <source type="image/webp" srcSet={media.poster.replace(".jpg", ".webp")} width={1920} height={1080} />
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

        {/* Shade and vignette clear away at the very end so the last frame matches the lobby below. */}
        <div className="cs-shade" data-range="0,0.975" data-fade-only aria-hidden />
        <div className="cs-vignette" data-range="0,0.975" data-fade-only aria-hidden />

        <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2" aria-label="Primary">
          <div className="flex items-center gap-0.5 rounded-b-2xl bg-black/90 px-1.5 backdrop-blur-sm sm:gap-4 sm:px-4 md:gap-8 md:rounded-b-3xl md:px-7">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="inline-flex min-h-[44px] items-center whitespace-nowrap px-2 font-mono text-sm uppercase tracking-tight text-cream/80 transition-colors hover:text-accent sm:tracking-wider"
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
              <h1 className="cs-rise-y whitespace-nowrap font-display font-medium leading-[0.85] tracking-[-0.05em] text-cream text-[9.5vw] sm:text-[11vw] md:text-[9.5vw] lg:text-[7.5vw]">
                Thomas Gates III
              </h1>
              <p className="cs-rise mt-1.5 pl-1 font-display text-lg font-bold uppercase tracking-wide text-white [animation-delay:120ms] sm:mt-3 sm:text-xl md:pl-2 md:text-2xl">
                Forward Deployed Engineer
              </p>
            </div>
            <div className="col-span-12 flex flex-col gap-4 sm:items-end sm:pb-16 lg:col-span-4 lg:pb-24">
              {/* Hero copy option A (Thomas can switch to option B, see PR). Local scrim keeps it readable over bright facades. */}
              <p className="cs-rise max-w-sm rounded-xl bg-black/50 px-4 py-3 text-sm leading-snug text-cream/90 backdrop-blur-sm [animation-delay:200ms] sm:ml-auto sm:text-right sm:text-base">
                I build AI systems that collapse hours of busywork into seconds. Some of these are
                production apps; others are live demos you can try below.
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
              aria-label={`Go to ${s.label}`}
              aria-current={i === 0 ? "true" : undefined}
              data-testid={`cs-dot-${s.n}`}
              onClick={() =>
                i === stages.length - 1
                  ? document.querySelector(PROJECTS_HREF)?.scrollIntoView({ behavior: "smooth" })
                  : engine.current?.scrollToStage(i)
              }
            />
          ))}
        </nav>

        {/* Tells first-time visitors the hero scrolls. Gone as soon as they start. */}
        <button
          type="button"
          className="cs-scroll-cue"
          data-range="0,0.04"
          data-fade-only
          data-testid="cs-scroll-cue"
          onClick={() => engine.current?.scrollToStage(1)}
        >
          <span>Scroll</span>
          <svg viewBox="0 0 16 24" width="16" height="24" aria-hidden>
            <path d="M8 2v18M2 14l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <a href={PROJECTS_HREF} className="cs-cue cs-link" data-range="0.95,1" data-no-snap data-testid="cs-cue">
          Projects <span aria-hidden>↓</span>
        </a>
       </div>

      {/* Stages 02 to 05: glass HUD cards over the film, or a stacked list in the static view. */}
      <div className="cs-cards">
        {rest.filter((s) => s.title || s.items).map((s) =>
          s.items ? (
            <div key={s.n} className="cs-group" data-testid={`cs-stage-${s.n}`}>
              <Still s={s} show={stills} />
              {s.items.map((it, j) => (
                <div key={it.title} className={`cs-card cs-item cs-item-${j}`} data-range={`${it.start},${s.end}`}>
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
            <div key={s.n} className="cs-slot" data-range={`${s.fadeStart ?? s.start},${s.fadeEnd ?? s.end}`}>
              <StageCard s={s} stills={stills}>
                {s.n === "05" && (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <a href={EMAIL_HREF} data-testid="cs-email"><Button>Email me →</Button></a>
                    <a href="/resume" data-testid="cs-resume"><Button variant="outline">View résumé</Button></a>
                    {BOOK_INTRO_HREF && (
                      <a href={BOOK_INTRO_HREF} data-testid="cs-book"><Button variant="outline">Book a short intro</Button></a>
                    )}
                    <a href={PROJECTS_HREF} className="cs-link mt-0" data-testid="cs-projects">See the projects ↓</a>
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
