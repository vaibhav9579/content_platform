import { test, expect } from "@playwright/test";

test.describe("newsletter subscription", () => {
  test("submitting a valid email shows the subscribed confirmation", async ({ page }) => {
    await page.goto("/");

    const uniqueEmail = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const emailInput = page.getByLabel("Email address").first();
    await emailInput.fill(uniqueEmail);
    await page.getByRole("button", { name: "Subscribe" }).first().click();

    await expect(page.getByText("Thanks for subscribing.")).toBeVisible();
  });

  test("the honeypot field is present but unreachable by real users", async ({ page }) => {
    await page.goto("/");
    const honeypot = page.locator('input[name="website"]').first();
    await expect(honeypot).toBeAttached();
    await expect(honeypot).toHaveAttribute("tabindex", "-1");
    await expect(honeypot.locator("xpath=..")).toHaveAttribute("aria-hidden", "true");
  });
});
