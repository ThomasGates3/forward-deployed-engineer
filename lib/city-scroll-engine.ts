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
};

export type ScrubPath = "canvas" | "video";

const FADE = 0.06;
const LERP = 0.2;
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
  const measure = () => {
    const r = section.getBoundingClientRect();
    const span = r.height - innerHeight;
    target = span > 0 ? clamp(-r.top / span) : 0;
  };

  const applyOverlays = (p: number) => {
    fades.forEach((el, i) => {
      const [a, b] = ranges[i];
      const vin = a <= 0 ? 1 : clamp((p - a) / FADE);
      const vout = b >= 1 ? 1 : clamp((b - p) / FADE);
      const v = Math.min(vin, vout);
      el.style.opacity = String(v);
      el.style.transform = `translate3d(0, ${(1 - v) * 12}px, 0)`;
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
    drawn = -1;
  };

  const nearestLoaded = (i: number) => {
    for (let d = 0; d < o.frameCount; d++) {
      if (imgs[i - d]) return i - d;
      if (imgs[i + d]) return i + d;
    }
    return -1;
  };

  const drawFrame = (p: number) => {
    if (!ctx) return;
    const i = nearestLoaded(Math.round(p * (o.frameCount - 1)));
    if (i < 0 || i === drawn) return; // never clear to a blank frame
    const img = imgs[i]!;
    const { width: cw, height: ch } = canvas;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    if (drawn < 0 && canvas.style.opacity !== "1") revealMedia(canvas);
    drawn = i;
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
  function tick() {
    raf = 0;
    const settled = Math.abs(target - cur) < 1e-4;
    cur = cur < 0 || settled ? target : cur + (target - cur) * LERP;
    applyOverlays(cur);
    if (path === "canvas") drawFrame(cur);
    else seekVideo(cur);
    if (cur !== target) kick();
  }

  const onScroll = () => { measure(); kick(); };
  const onResize = () => { if (path === "canvas") sizeCanvas(); onScroll(); };
  const onVisible = () => { if (!document.hidden) pump(); };

  addEventListener("scroll", onScroll, { passive: true });
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
    const p = i === 0 ? 0 : i === o.stageStarts.length - 1 ? 1 : s + FADE;
    const top = section.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + p * (section.offsetHeight - innerHeight), behavior: "smooth" });
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
