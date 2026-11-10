import { test, expect, type Page } from "@playwright/test";

// Guards for the City Scroll hero + lobby briefs: one h1, unchanged head tags, working stage links,
// a drawn frame at every scroll step (606-frame film), solid overlays when paused, the lobby
// hand-off, accurate project cards, and the reduced-motion / Save-Data fallbacks.

const scrollToProgress = async (page: Page, p: number) => {
  await page.evaluate((p) => {
    const s = document.getElementById("city-scroll")!;
    const top = s.getBoundingClientRect().top + scrollY;
    const stageH = s.querySelector<HTMLElement>(".cs-stage")!.clientHeight;
    scrollTo({ top: top + p * (s.offsetHeight - stageH * 1.6), behavior: "instant" }); // 1 + HOLD (engine)
  }, p);
  await page.waitForTimeout(250);
};

test("head tags and the single h1 are intact", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Thomas Gates III");
  await expect(page).toHaveTitle("Thomas Gates III | Forward Deployed Engineer");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://portfolio.gatestech.solutions");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /live, working AI tools/);
});

test("no em dashes in visible copy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.locator("body").innerText()).not.toContain("—");
});

test("film stops carry no number/name labels", async ({ page }) => {
  await page.goto("/");
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\[0\d\s+[A-Z]+\]/);
  for (const t of ["01 ROOFTOP", "02 SIGNAL", "03 AGENTS", "04 EVALS", "05 CONTACT"]) expect(text).not.toContain(t);
});

test("copy stays accurate: no 'not demos' claim, no every-tool-is-Claude claim, no empty booking button", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const text = await page.locator("body").innerText();
  expect(text).not.toContain("Not demos, production");
  expect(text).not.toMatch(/Each is a server-side Claude call|every demo is live and rate-limited/i);
  await expect(page.getByText("Book a short intro")).toHaveCount(0);
});

test("project cards: six glass cards with the right model and real Try it links", async ({ page }) => {
  await page.goto("/");
  const expected: Record<string, string> = {
    "iam-policy-generator": "Gemini", "product-contextualizer": "Gemini", "speed-to-lead": "Claude Haiku",
    "doc-qa": "Claude Haiku", "ops-copilot": "Claude Haiku", evals: "Claude Haiku",
  };
  await expect(page.locator(".lobby-card")).toHaveCount(6);
  for (const [id, model] of Object.entries(expected)) {
    await expect(page.getByTestId(`card-${id}`)).toContainText(model);
    const a = page.getByTestId(`try-${id}`);
    const href = (await a.getAttribute("href"))!;
    if (href.startsWith("http")) await expect(a).toHaveAttribute("target", "_blank");
    else expect(href).toBe(`/tools/${id}`);
  }
  for (const id of ["doc-qa", "ops-copilot", "evals"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
});

test("400x800: readable nav, Try it under the copy", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto("/");
  for (const a of await page.locator('nav[aria-label="Primary"] a').all()) {
    const { size, h } = await a.evaluate((e) => ({ size: parseFloat(getComputedStyle(e).fontSize), h: e.getBoundingClientRect().height }));
    expect(size).toBeGreaterThanOrEqual(14);
    expect(h).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  const card = page.getByTestId("card-speed-to-lead");
  const textBottom = await card.locator("p").last().evaluate((e) => e.getBoundingClientRect().bottom);
  const tryTop = await page.getByTestId("try-speed-to-lead").evaluate((e) => e.getBoundingClientRect().top);
  expect(tryTop).toBeGreaterThan(textBottom);
});

test("paused mid-film, the current card is fully opaque", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator("#city-scroll")).toHaveAttribute("data-mode", "film");
  for (const [p, testid] of [[0.2, "cs-stage-02"], [0.62, "cs-stage-04"], [0.73, "cs-stage-05"], [0.76, "cs-stage-05"], [0.785, "cs-stage-05"]] as const) {
    await scrollToProgress(page, p);
    await page.waitForTimeout(600);
    const op = await page.getByTestId(testid).evaluate((e) => parseFloat(getComputedStyle(e.closest("[data-range]")!).opacity));
    expect(op, `${testid} at p=${p}`).toBeGreaterThan(0.95);
  }
});

test("film hands off to the lobby with no seam: no rule, clean last frame, scrim off", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("#city-scroll + .lobby")).toHaveCount(1);
  await scrollToProgress(page, 1);
  await page.waitForTimeout(800);
  const s = await page.evaluate(() => ({
    shade: getComputedStyle(document.querySelector(".cs-vignette")!).opacity,
    scrim: getComputedStyle(document.querySelector(".lobby-scrim")!).opacity,
    bgTop: document.querySelector(".lobby-bg")!.getBoundingClientRect().top,
  }));
  expect(Number(s.shade)).toBeLessThan(0.05);
  expect(Number(s.scrim)).toBeLessThan(0.05);
  expect(Math.abs(s.bgTop)).toBeLessThan(2);
});

test("stage links point at real project cards", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page.locator("#city-scroll a[href^='#']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const h of hrefs) await expect(page.locator(h)).toHaveCount(1);
});

test("desktop: canvas draws a frame at every step and overlays run 01 to 06", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("#city-scroll")).toHaveAttribute("data-path", "canvas");
  await page.waitForFunction(() => getComputedStyle(document.querySelector("#city-scroll canvas")!).opacity === "1");
  const order: string[] = [];
  for (let i = 0; i <= 20; i++) {
    await scrollToProgress(page, i / 20);
    const lit = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>("#city-scroll canvas")!;
      const d = c.getContext("2d")!.getImageData(c.width / 2, c.height / 2, 1, 1).data;
      return d[3] > 0;
    });
    expect(lit, `frame drawn at step ${i}`).toBe(true);
    const active = await page.locator(".cs-dot[aria-current]").getAttribute("data-testid");
    if (order.at(-1) !== active) order.push(active!);
  }
  expect(order).toEqual(["cs-dot-01", "cs-dot-02", "cs-dot-03", "cs-dot-04", "cs-dot-05", "cs-dot-06"]);
  expect(errors).toEqual([]);
});

test("reduced motion: static poster and list, no sticky stage, no media requests", async ({ page }) => {
  const heavy: string[] = [];
  page.on("request", (r) => /\/hero\/(frames|.*\.mp4)/.test(r.url()) && heavy.push(r.url()));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(2500);
  await expect(page.locator("#city-scroll")).toHaveAttribute("data-mode", "static");
  expect(await page.locator(".cs-stage").evaluate((e) => getComputedStyle(e).position)).not.toBe("sticky");
  await expect(page.getByTestId("cs-stage-05")).toBeVisible();
  expect(heavy).toEqual([]);
});

test("Save-Data: video path, no frame requests", async ({ page }) => {
  const frames: string[] = [];
  page.on("request", (r) => r.url().includes("/hero/frames/") && frames.push(r.url()));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", { value: { saveData: true, effectiveType: "3g" } });
    try { sessionStorage.clear(); } catch {}
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("#city-scroll")).toHaveAttribute("data-path", "video");
  await expect(page.locator(".cs-poster img")).toBeVisible();
  await page.waitForFunction(() => document.querySelector<HTMLVideoElement>("#city-scroll video")!.readyState >= 2);
  expect(frames).toEqual([]);
});
