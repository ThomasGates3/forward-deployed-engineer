import { test, expect, type Page } from "@playwright/test";

// Guards for the City Scroll hero brief: one h1, unchanged head tags, working stage links,
// a drawn frame at every scroll step, and the reduced-motion / Save-Data fallbacks.

const scrollToProgress = async (page: Page, p: number) => {
  await page.evaluate((p) => {
    const s = document.getElementById("city-scroll")!;
    const top = s.getBoundingClientRect().top + scrollY;
    scrollTo(0, top + p * (s.offsetHeight - innerHeight));
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

test("stage links point at real project cards", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page.locator("#city-scroll a[href^='#']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const h of hrefs) await expect(page.locator(h)).toHaveCount(1);
});

test("desktop: canvas draws a frame at every step and overlays run 01 to 05", async ({ page }) => {
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
  expect(order).toEqual(["cs-dot-01", "cs-dot-02", "cs-dot-03", "cs-dot-04", "cs-dot-05"]);
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
