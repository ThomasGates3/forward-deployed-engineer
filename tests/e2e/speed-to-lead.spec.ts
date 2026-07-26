import { test, expect } from "@playwright/test";

test.describe("Speed to Lead tool", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/tools/speed-to-lead");
    await expect(page.getByTestId("input-name")).toBeVisible();
    await expect(page.getByTestId("input-email")).toBeVisible();
    await expect(page.getByTestId("input-message")).toBeVisible();
    await expect(page.getByTestId("submit-btn")).toBeVisible();
  });

  test("invalid email blocks submit", async ({ page }) => {
    await page.goto("/tools/speed-to-lead");
    await page.getByTestId("input-name").fill("Alex");
    await page.getByTestId("input-email").fill("not-an-email");
    await page.getByTestId("input-message").fill("Testing invalid email handling.");
    await page.getByTestId("submit-btn").click();

    // No result should appear within 3s.
    await expect(page.getByTestId("result")).toHaveCount(0, { timeout: 3000 });

    // Accept either signal: inline email error visible OR submit disabled.
    const emailError = page.getByTestId("email-error");
    const submitBtn = page.getByTestId("submit-btn");
    const errorVisible = await emailError.isVisible().catch(() => false);
    const submitDisabled = await submitBtn.isDisabled().catch(() => false);
    expect(errorVisible || submitDisabled).toBeTruthy();
  });

  test("valid lead produces a qualification", async ({ page }) => {
    await page.goto("/tools/speed-to-lead");
    await page.getByTestId("input-name").fill("Alex");
    await page.getByTestId("input-email").fill("alex@acme.com");
    await page
      .getByTestId("input-message")
      .fill("We want to cut lead response time this quarter.");
    await page.getByTestId("submit-btn").click();

    await expect(page.getByTestId("result")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("verdict")).toBeVisible();
    await expect(page.getByTestId("reasoning")).toBeVisible();
    await expect(page.getByTestId("followup-email")).toBeVisible();
    await expect(page.getByTestId("sms-bubble")).toBeVisible();
  });

  test("back link returns home", async ({ page }) => {
    await page.goto("/tools/speed-to-lead");
    await page.getByTestId("back-link").click();
    await expect(page).toHaveURL(/\/$/);
  });
});
