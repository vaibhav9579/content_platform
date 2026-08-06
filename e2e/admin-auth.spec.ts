import { test, expect } from "@playwright/test";

test.describe("admin route protection", () => {
  test("unauthenticated visitors are redirected from /admin to /sign-in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/sign-in\?redirect_url=/);
  });

  test("the redirect_url param points back at the originally requested admin page", async ({ page }) => {
    await page.goto("/admin/posts");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/sign-in");
    expect(url.searchParams.get("redirect_url")).toContain("/admin/posts");
  });
});
