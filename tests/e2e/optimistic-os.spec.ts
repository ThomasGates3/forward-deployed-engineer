import { test, expect } from "@playwright/test";

const PATH = "/case-studies/optimistic-os";
const PIPELINE_TIMEOUT = 40_000;

test.describe("Optimistic OS six-agent pipeline", () => {
  test("case study page loads", async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByTestId("oos-niche")).toBeVisible();
    await expect(page.getByTestId("oos-run")).toBeVisible();
    await expect(page.getByText(/Optimistic OS/i).first()).toBeVisible();
  });

  test("runs the six-agent pipeline", async ({ page }) => {
    await page.goto(PATH);
    await page.getByTestId("oos-niche").fill("vintage travel poster prints");
    await page.getByTestId("oos-run").click();

    // Trend research is the first revealed stage; Etsy listing appears in the results.
    await expect(page.getByText(/Trend/i).first()).toBeVisible({ timeout: PIPELINE_TIMEOUT });
    await expect(page.getByText(/Etsy/i).first()).toBeVisible({ timeout: PIPELINE_TIMEOUT });
  });

  test("publish stage is clearly labeled Simulated", async ({ page }) => {
    await page.goto(PATH);
    await page.getByTestId("oos-niche").fill("vintage travel poster prints");
    await page.getByTestId("oos-run").click();

    await expect(page.getByText(/Simulated/i).first()).toBeVisible({ timeout: PIPELINE_TIMEOUT });
  });

  test("an image is rendered", async ({ page }) => {
    await page.goto(PATH);
    await page.getByTestId("oos-niche").fill("vintage travel poster prints");
    await page.getByTestId("oos-run").click();

    // Wait for the pipeline to complete through the image stage, then assert an <img> is visible.
    await expect(page.getByText(/Simulated/i).first()).toBeVisible({ timeout: PIPELINE_TIMEOUT });
    const image = page.locator("img").last();
    await expect(image).toBeVisible({ timeout: PIPELINE_TIMEOUT });
  });
});
