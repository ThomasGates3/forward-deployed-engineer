import { test, expect } from "@playwright/test";

const ROUTE = "/tools/automation-architect";

test("page loads", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.getByTestId("process-input")).toBeVisible();
  await expect(page.getByTestId("design-btn")).toBeVisible();
  await expect(page.getByTestId("back-link")).toBeVisible();
});

test("designs a workflow from typed input", async ({ page }) => {
  await page.goto(ROUTE);
  await page
    .getByTestId("process-input")
    .fill("When a customer signs up, send a welcome email and add them to the CRM");
  await page.getByTestId("design-btn").click();
  await expect(page.getByTestId("workflow-result")).toBeVisible({ timeout: 30000 });
});

test("example chip prefills and runs", async ({ page }) => {
  await page.goto(ROUTE);
  const chip = page.getByTestId("example-chip").first();
  await expect(chip).toBeVisible();
  await chip.click();

  const input = page.getByTestId("process-input");
  await expect(input).not.toHaveValue("");

  const result = page.getByTestId("workflow-result");
  if (!(await result.isVisible().catch(() => false))) {
    await page.getByTestId("design-btn").click();
  }
  await expect(result).toBeVisible({ timeout: 30000 });
});

test("copy button present after result", async ({ page }) => {
  await page.goto(ROUTE);
  await page
    .getByTestId("process-input")
    .fill("When a customer signs up, send a welcome email and add them to the CRM");
  await page.getByTestId("design-btn").click();
  await expect(page.getByTestId("workflow-result")).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId("copy-btn")).toBeVisible();
});

test("back link returns home", async ({ page }) => {
  await page.goto(ROUTE);
  await page.getByTestId("back-link").click();
  await expect(page).toHaveURL(/\/$/);
});
