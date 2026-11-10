"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { demos } from "@/content/gallery";
import { lobby } from "@/content/city-scroll";
import { Badge, SectionHeading } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { HOLD } from "@/lib/city-scroll-engine";

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const variant = (src: string, ext: string) => src.replace(/\.jpg$/, `.${ext}`);

function LobbyPicture({ eager = false }: { eager?: boolean }) {
  return (
    <picture>
      <source media="(max-width: 767px)" type="image/avif" srcSet={variant(lobby.stillMobile, "avif")} />
      <source media="(max-width: 767px)" type="image/webp" srcSet={variant(lobby.stillMobile, "webp")} />
      <source media="(max-width: 767px)" srcSet={lobby.stillMobile} />
      <source type="image/avif" srcSet={variant(lobby.still, "avif")} />
      <source type="image/webp" srcSet={variant(lobby.still, "webp")} />
      <img src={lobby.still} alt="" width={1920} height={1080} loading={eager ? "eager" : "lazy"} decoding="async" />
    </picture>
  );
}

/* Projects, set in the tower lobby the film flies into. In film mode the section tucks under the
   pinned hero's last 100svh and its background sticks to the viewport, so the final film frame and
   the lobby image line up exactly; the scrim and a gentle push-in only start after the hand-off. */
export function Gallery() {
  const wrap = useRef<HTMLElement>(null);
  const img = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  // The lobby image renders after hydration: in the server's static layout it sits right under the
  // hero and would be fetched during first load, competing with the poster. No-JS gets <noscript>.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrap.current;
      if (!el || !img.current || !scrim.current) return;
      const hero = document.querySelector<HTMLElement>("#city-scroll");
      const stage = hero?.querySelector<HTMLElement>(".cs-stage");
      if (hero?.dataset.mode !== "film") {
        scrim.current.style.opacity = "";
        img.current.style.transform = "";
        hero?.removeAttribute("data-handoff");
        if (stage) { stage.style.opacity = ""; stage.style.pointerEvents = ""; }
        return;
      }
      const r = el.getBoundingClientRect();
      const past = -r.top; // px scrolled past the hand-off point
      const fade = (stage?.clientHeight || innerHeight) * HOLD; // matches the engine's pinned hold
      const s = clamp(past / fade);
      // The exiting film frame and the lobby below it are the same picture: cross-fading the frame out
      // while the scrim comes in changes the whole viewport evenly, so no edge shows as it slides away.
      scrim.current.style.opacity = String(s);
      hero.toggleAttribute("data-handoff", past > 0);
      if (stage) {
        stage.style.opacity = past > 0 ? String(1 - s) : "";
        stage.style.pointerEvents = s > 0.5 ? "none" : "";
      }
      const q = clamp((past - fade) / Math.max(r.height - innerHeight - fade, 1)); // drift starts after the cross-fade
      img.current.style.transform = reduce.matches ? "" : `translate3d(0, ${-2 * q}%, 0) scale(${1 + 0.04 * q})`;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    reduce.addEventListener("change", kick);
    const mo = new MutationObserver(kick); // hero switches static <-> film after hydration
    const hero = document.querySelector("#city-scroll");
    if (hero) mo.observe(hero, { attributes: true, attributeFilter: ["data-mode"] });
    kick();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", kick);
      removeEventListener("resize", kick);
      reduce.removeEventListener("change", kick);
      mo.disconnect();
    };
  }, []);

  return (
    <section ref={wrap} className="lobby" data-testid="lobby">
      <div className="lobby-track" aria-hidden>
        <div className="lobby-bg">
          <div ref={img} className="lobby-img">
            {/* Eager once hydrated (after first paint): it must be decoded before the film hands off to it. */}
            {ready ? <LobbyPicture eager /> : <noscript><LobbyPicture /></noscript>}
          </div>
          <div ref={scrim} className="lobby-scrim" />
        </div>
      </div>

      <div className="container-x relative pb-20 md:pb-28">
        <div id="gallery" className="scroll-mt-4 pt-16 md:pt-20">
          <SectionHeading
            eyebrow="Projects"
            title="Working AI tools you can use right now."
            sub="Live projects, not screenshots. Two are standalone Gemini apps. The four hosted here run on Claude Haiku, are free to try and rate-limited, and if you hit a limit you get a saved example instead of an error."
          />
          <MotionConfig reducedMotion="user">
            <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {demos.map((d) => (
                <StaggerItem key={d.id} id={d.id} className="h-full scroll-mt-6">
                  <article className="lobby-card group" data-testid={`card-${d.id}`}>
                    <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-wider">
                      <Badge tone={d.model === "Gemini" ? "edge" : "accent"}>{d.model}</Badge>
                      <span className="text-[color:var(--cs-steel)]">{d.external ? "External app ↗" : "Live"}</span>
                    </div>
                    <h3 className="font-display text-xl leading-tight text-[color:var(--cs-text)]">{d.name}</h3>
                    <p className="text-[15px] leading-[1.55] text-[color:var(--cs-silver)]">{d.value}</p>
                    <div className="mt-auto pt-2">
                      <Link
                        href={d.href ?? `/tools/${d.id}`}
                        className="lobby-try"
                        data-testid={`try-${d.id}`}
                        {...(d.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        Try it {d.external ? <ExternalLink className="h-3.5 w-3.5" aria-hidden /> : <span aria-hidden>→</span>}
                        {d.external && <span className="sr-only">(opens in a new tab)</span>}
                      </Link>
                    </div>
                  </article>
                </StaggerItem>
              ))}
            </Stagger>
          </MotionConfig>
          <p className="mt-10">
            <a href="#contact" className="cs-link" data-testid="lobby-talk">
              Let&apos;s talk <span aria-hidden>↓</span>
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
