import { test, expect } from "@playwright/test";

test.describe("AI Agent Designer", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/tools/agent-designer");
    await expect(page.getByTestId("description-input")).toBeVisible();
    await expect(page.getByTestId("generate-btn")).toBeVisible();
    await expect(page.getByTestId("back-link")).toBeVisible();
  });

  test("generates a result", async ({ page }) => {
    await page.goto("/tools/agent-designer");
    await page
      .getByTestId("description-input")
      .fill("an agent that triages support tickets and drafts replies");
    await page.getByTestId("generate-btn").click();
    await expect(page.getByTestId("result")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("system-prompt")).toBeVisible();
    await expect(page.getByTestId("tools-list")).toBeVisible();
  });

  test("copy button present after result", async ({ page }) => {
    await page.goto("/tools/agent-designer");
    await page
      .getByTestId("description-input")
      .fill("an agent that triages support tickets and drafts replies");
    await page.getByTestId("generate-btn").click();
    await expect(page.getByTestId("result")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("copy-btn")).toBeVisible();
  });

  test("back link returns home", async ({ page }) => {
    await page.goto("/tools/agent-designer");
    await page.getByTestId("back-link").click();
    await expect(page).toHaveURL(/\/$/);
  });
});
