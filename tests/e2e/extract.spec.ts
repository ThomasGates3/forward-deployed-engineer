import { test, expect } from "@playwright/test";

test.describe("Messy Doc → Structured Data (/tools/extract)", () => {
  test("page loads with prefilled input", async ({ page }) => {
    await page.goto("/tools/extract");
    const input = page.getByTestId("input-text");
    await expect(input).toBeVisible();
    expect(await input.inputValue()).not.toBe("");
    await expect(page.getByTestId("extract-btn")).toBeVisible();
  });

  test("extracts structured data into a table", async ({ page }) => {
    await page.goto("/tools/extract");
    await page.getByTestId("extract-btn").click();
    const table = page.getByTestId("result-table");
    await table.waitFor({ state: "visible", timeout: 30000 });
    await expect(table).toBeVisible();
    await expect(table).toContainText(/\w/);
  });

  test("copy button present after extraction", async ({ page }) => {
    await page.goto("/tools/extract");
    await page.getByTestId("extract-btn").click();
    await page.getByTestId("result-table").waitFor({ state: "visible", timeout: 30000 });
    await expect(page.getByTestId("copy-btn")).toBeVisible();
  });

  test("custom text extraction", async ({ page }) => {
    await page.goto("/tools/extract");
    const input = page.getByTestId("input-text");
    await input.fill("Invoice 8842 from Acme Co, total 240.50 USD, due 2026-09-01");
    await page.getByTestId("extract-btn").click();
    const table = page.getByTestId("result-table");
    await table.waitFor({ state: "visible", timeout: 30000 });
    await expect(table).toBeVisible();
  });

  test("back link returns home", async ({ page }) => {
    await page.goto("/tools/extract");
    await page.getByTestId("back-link").click();
    await expect(page).toHaveURL(/\/$/);
  });
});
