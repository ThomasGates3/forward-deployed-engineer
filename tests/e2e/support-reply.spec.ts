import { test, expect } from "@playwright/test";

test.describe("Support Reply tool", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/tools/support-reply");
    await expect(page.getByTestId("generate-reply")).toBeVisible();
    await expect(page.getByTestId("custom-message")).toBeVisible();
    await expect(page.getByTestId("back-to-portfolio")).toBeVisible();
  });

  test("preset scenario generates a reply", async ({ page }) => {
    await page.goto("/tools/support-reply");
    await page.getByTestId("scenario-refund-delay").click();
    await page.getByTestId("generate-reply").click();
    await page.getByTestId("result").waitFor({ state: "visible", timeout: 30000 });
    await expect(page.getByTestId("reply-bubble")).toBeVisible();
    await expect(page.getByTestId("notes")).toBeVisible();
  });

  test("custom message generates a reply", async ({ page }) => {
    await page.goto("/tools/support-reply");
    await page
      .getByTestId("custom-message")
      .fill("I was double charged this month and need it fixed.");
    await page.getByTestId("generate-reply").click();
    await page.getByTestId("result").waitFor({ state: "visible", timeout: 30000 });
    await expect(page.getByTestId("reply-bubble")).toBeVisible();
    await expect(page.getByTestId("copy-reply")).toBeVisible();
  });

  test("back link returns home", async ({ page }) => {
    await page.goto("/tools/support-reply");
    await page.getByTestId("back-to-portfolio").click();
    await expect(page).toHaveURL(/\/$/);
  });
});
