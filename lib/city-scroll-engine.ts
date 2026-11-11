// Scroll-scrub engine for the City Scroll hero.
// Path A: canvas frames (desktop). Path B: video scrub (mobile, Save-Data, slow links, or frame failure).
// The scroll handler only stores the target; all drawing happens in one rAF.

type Els = {
  section: HTMLElement;
  canvas: HTMLCanvasElement;
  video: HTMLVideoElement;
  poster: HTMLElement;
  fades: HTMLElement[]; // elements with data-range="start,end"
  dots: HTMLElement[];
};

type Opts = {
  frameCount: number;
  frameSrc: (i: number) => string;
  video: string;
  videoMobile: string;
  stageStarts: number[];
  // Absolute scrollY of the Projects heading: the last snap stop after the door flight.
  endStop?: () => number | null;
};

export type ScrubPath = "canvas" | "video";

// Overlays sit fully opaque for most of their range: a short fade at each edge, inset by a small
// gap so the outgoing card is gone before the incoming one starts (no half-faded pair mid-screen).
const FADE = 0.03;
const GAP = 0.006;
// After the last frame the stage stays pinned for HOLD x its height while the Projects lobby
// cross-fades in underneath (see Gallery.tsx and .cs + .lobby in globals.css).
export const HOLD = 0.6;
const SMOOTH_MS = 110; // time constant for easing toward the scroll target (frame-rate independent)
const CONCURRENCY = 6;
const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function choosePath(): ScrubPath {
  try {
    if (sessionStorage.getItem("cs-path") === "video") return "video";
  } catch {}
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const slow = !!conn?.saveData || /2g|3g/.test(conn?.effectiveType ?? "");
  return slow || !matchMedia("(min-width: 768px)").matches ? "video" : "canvas";
}

export function startCityScroll(els: Els, o: Opts) {
  const { section, canvas, video, poster, fades, dots } = els;
  const mobile = !matchMedia("(min-width: 768px)").matches;
  let path = choosePath();
  section.dataset.path = path;

  const ranges = fades.map((el) => (el.dataset.range ?? "0,1").split(",").map(Number));
  let target = 0;
  let cur = -1;
  let raf = 0;
  let stopped = false;
  let activeDot = -1;

  // ---------- progress + overlays ----------
  // Scroll distance over which p runs 0..1: section height minus the pinned stage and the hold.
  const filmSpan = () => {
    const stageH = (section.querySelector(".cs-stage") as HTMLElement | null)?.clientHeight || innerHeight;
    return section.offsetHeight - stageH * (1 + HOLD);
  };
  const measure = () => {
    const r = section.getBoundingClientRect();
    const span = filmSpan();
    target = span > 0 ? clamp(-r.top / span) : 0;
  };

  const applyOverlays = (p: number) => {
    fades.forEach((el, i) => {
      const [a, b] = ranges[i];
      const vin = a <= 0 ? 1 : clamp((p - a - GAP) / FADE);
      const vout = b >= 1 ? 1 : clamp((b - GAP - p) / FADE);
      const v = Math.min(vin, vout);
      el.style.opacity = String(v);
      if (!("fadeOnly" in el.dataset)) el.style.transform = `translate3d(0, ${(1 - v) * 12}px, 0)`;
      el.style.visibility = v < 0.01 ? "hidden" : "visible";
    });
    let active = 0;
    o.stageStarts.forEach((s, i) => { if (p >= s) active = i; });
    if (active !== activeDot) {
      dots.forEach((d, i) => d.toggleAttribute("aria-current", i === active));
      activeDot = active;
    }
  };

  const kick = () => { if (!raf && !stopped) raf = requestAnimationFrame(tick); };
  const revealMedia = (el: HTMLElement) => {
    el.style.opacity = "1";
    poster.style.opacity = "0";
  };

  // ---------- path A: canvas frames ----------
  const imgs: (HTMLImageElement | undefined)[] = new Array(o.frameCount);
  const ctx = canvas.getContext("2d");
  let drawn = -1;
  let loaded = 0;
  let failed = 0;
  let inflight = 0;
  let queue: number[] = [];
  let fillBuilt = false;
  let loadTimer = 0;

  const sizeCanvas = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    if (ctx) ctx.imageSmoothingQuality = "high";
    drawn = -1;
    drawnKey = "";
  };

  const loadedBelow = (i: number) => { for (let j = Math.floor(i); j >= 0; j--) if (imgs[j]) return j; return -1; };
  const loadedAbove = (i: number) => { for (let j = Math.ceil(i); j < o.frameCount; j++) if (imgs[j]) return j; return -1; };

  const cover = (img: HTMLImageElement, alpha: number) => {
    const { width: cw, height: ch } = canvas;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    ctx!.globalAlpha = alpha;
    ctx!.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  };

  // Draws the exact sub-frame position by cross-fading the two nearest loaded frames,
  // so motion stays continuous between frames (and across gaps while frames are still loading).
  let drawnKey = "";
  // At rest (crisp) it shows the single nearest frame instead of a blend, so a paused frame is sharp.
  const drawFrame = (p: number, crisp = false) => {
    if (!ctx) return;
    const x = p * (o.frameCount - 1);
    let a = loadedBelow(x);
    let b = loadedAbove(x);
    if (a < 0) a = b;
    if (b < 0) b = a;
    if (a < 0) return; // nothing loaded yet: the poster stays up, never a blank frame
    let t = a === b ? 0 : Math.round(((x - a) / (b - a)) * 24) / 24;
    if (crisp && t > 0) { if (t >= 0.5) a = b; t = 0; }
    const key = `${a}|${b}|${t}`;
    if (key === drawnKey) return;
    cover(imgs[a]!, 1);
    if (t > 0) cover(imgs[b]!, t);
    ctx.globalAlpha = 1;
    if (drawn < 0 && canvas.style.opacity !== "1") revealMedia(canvas);
    drawn = a;
    drawnKey = key;
  };

  const pump = () => {
    if (stopped || path !== "canvas" || document.hidden) return;
    if (!queue.length && !fillBuilt) {
      // Pass 2: fill the rest, outward from the frame nearest the current scroll position.
      fillBuilt = true;
      const at = Math.round(Math.max(cur, 0) * (o.frameCount - 1));
      queue = Array.from({ length: o.frameCount }, (_, i) => i)
        .filter((i) => !imgs[i])
        .sort((a, b) => Math.abs(a - at) - Math.abs(b - at));
    }
    while (inflight < CONCURRENCY && queue.length) {
      const i = queue.shift()!;
      if (imgs[i]) continue;
      inflight++;
      const img = new Image();
      img.decoding = "async";
      img.src = o.frameSrc(i);
      img.decode()
        .then(() => {
          if (stopped) return;
          imgs[i] = img;
          loaded++;
          kick();
        })
        .catch(() => { if (++failed >= 3) toVideo(); })
        .finally(() => { inflight--; pump(); });
    }
  };

  const startFrames = () => {
    sizeCanvas();
    // Pass 1: every 8th frame plus the last, so scrubbing works across the whole film fast.
    for (let i = 0; i < o.frameCount; i += 8) queue.push(i);
    queue.push(o.frameCount - 1);
    pump();
    const check = () => {
      if (stopped || path !== "canvas") return;
      if (document.hidden) { loadTimer = window.setTimeout(check, 2000); return; }
      if (loaded < o.frameCount * 0.2) toVideo();
    };
    loadTimer = window.setTimeout(check, 8000);
  };

  // ---------- path B: video scrub ----------
  let videoReady = false;
  const startVideo = () => {
    video.addEventListener("loadeddata", () => { videoReady = true; revealMedia(video); kick(); }, { once: true });
    video.addEventListener("seeked", kick);
    video.src = mobile ? o.videoMobile : o.video;
    video.load(); // never play(); currentTime is driven by scroll
  };
  const seekVideo = (p: number) => {
    if (!videoReady || video.seeking || !video.duration) return;
    const t = p * (video.duration - 0.05);
    if (Math.abs(video.currentTime - t) > 1 / 48) video.currentTime = t;
  };

  function toVideo() {
    if (path === "video" || stopped) return;
    path = "video";
    section.dataset.path = "video";
    queue = [];
    clearTimeout(loadTimer);
    try { sessionStorage.setItem("cs-path", "video"); } catch {}
    if (drawn < 0) canvas.style.opacity = "0";
    startVideo();
  }

  // ---------- loop ----------
  let last = 0;
  function tick(now: number) {
    raf = 0;
    const dt = last ? Math.min(now - last, 64) : 16;
    last = now;
    const settled = Math.abs(target - cur) < 1e-4;
    cur = cur < 0 || settled ? target : cur + (target - cur) * (1 - Math.exp(-dt / SMOOTH_MS));
    applyOverlays(cur);
    if (path === "canvas") drawFrame(cur, cur === target);
    else seekVideo(cur);
    if (cur !== target) kick();
    else last = 0;
  }

  // ---------- snap to the nearest card when a visitor stops between stops ----------
  // Every card's fully-opaque hold, in p. Stopping inside one is left alone; stopping in the
  // transit between two glides (smooth scroll) to the next card in the direction of travel.
  const holds = fades
    .map((el, i) => ({ el, r: ranges[i] }))
    .filter(({ el }) => !("fadeOnly" in el.dataset) && !("noSnap" in el.dataset))
    .map(({ r: [a, b] }) => [a <= 0 ? 0 : a + GAP + FADE, b >= 1 ? 1 : b - GAP - FADE] as const)
    .filter(([a, b]) => b > a);
  let lastY = scrollY;
  let dir = 1;
  let snapTimer = 0;
  let touching = false;
  const trySnap = () => {
    if (stopped || touching) return;
    const top = section.getBoundingClientRect().top + scrollY;
    const span = filmSpan();
    const y = scrollY;
    const end = o.endStop?.() ?? top + span;
    if (y <= top + 1 || y >= end - 1) return; // above the film or already at the Projects heading
    const p = (y - top) / span;
    if (holds.some(([a, b]) => p >= a - 0.002 && p <= b + 0.002)) return; // a card is fully visible
    const stops = [...holds.map(([a, b]) => top + (a <= 0 ? 0 : (a + b) / 2) * span), end].sort((m, n) => m - n);
    const next = stops.find((s) => s > y) ?? end;
    const prev = [...stops].reverse().find((s) => s < y) ?? top;
    const frac = (y - prev) / Math.max(next - prev, 1);
    const to = dir > 0 ? (frac > 0.15 ? next : prev) : frac < 0.85 ? prev : next;
    scrollTo({ top: to, behavior: "smooth" });
  };
  const armSnap = () => { clearTimeout(snapTimer); snapTimer = window.setTimeout(trySnap, 180); };
  const onTouchStart = () => { touching = true; clearTimeout(snapTimer); };
  const onTouchEnd = () => { touching = false; armSnap(); };

  const onScroll = () => {
    measure();
    kick();
    if (scrollY !== lastY) dir = scrollY > lastY ? 1 : -1;
    lastY = scrollY;
    armSnap();
  };
  const onResize = () => { if (path === "canvas") sizeCanvas(); onScroll(); };
  const onVisible = () => { if (!document.hidden) pump(); };

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("touchstart", onTouchStart, { passive: true });
  addEventListener("touchend", onTouchEnd, { passive: true });
  addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisible);
  onScroll();

  // Start heavy loading only after the poster (LCP) has painted and the page is idle.
  let idleId = 0;
  const begin = () => {
    const go = () => { if (!stopped) (path === "canvas" ? startFrames : startVideo)(); };
    if (typeof requestIdleCallback === "function") idleId = requestIdleCallback(go, { timeout: 1500 });
    else idleId = setTimeout(go, 200) as unknown as number;
  };
  if (document.readyState === "complete") begin();
  else addEventListener("load", begin, { once: true });

  const scrollToStage = (i: number) => {
    const s = o.stageStarts[i];
    const p = i === 0 ? 0 : s + GAP + FADE + 0.01; // lands inside the fully opaque hold
    const top = section.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + p * filmSpan(), behavior: "smooth" });
  };

  return {
    scrollToStage,
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      clearTimeout(loadTimer);
      if (typeof cancelIdleCallback === "function") cancelIdleCallback(idleId);
      clearTimeout(idleId);
      removeEventListener("scroll", onScroll);
      removeEventListener("touchstart", onTouchStart);
      removeEventListener("touchend", onTouchEnd);
      clearTimeout(snapTimer);
      removeEventListener("resize", onResize);
      removeEventListener("load", begin);
      document.removeEventListener("visibilitychange", onVisible);
      video.removeEventListener("seeked", kick);
      video.removeAttribute("src");
      video.load();
      fades.forEach((el) => { el.style.opacity = ""; el.style.transform = ""; el.style.visibility = ""; });
    },
  };
}
