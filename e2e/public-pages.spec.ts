import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("homepage renders with site branding and article links", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/The Publication/);
    await expect(page.locator('a[href^="/blog/"]').first()).toBeVisible();
  });

  test("clicking an article card navigates to the post page", async ({ page }) => {
    await page.goto("/");
    const firstLink = page.locator('a[href^="/blog/"]').first();
    const href = await firstLink.getAttribute("href");
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.locator("h1")).toBeVisible();
  });

  test("blog index page lists posts", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator('a[href^="/blog/"]').first()).toBeVisible();
  });

  test("unknown routes render a 404 page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});

test.describe("feeds and machine-readable endpoints", () => {
  test("rss.xml responds with valid XML", async ({ request }) => {
    const response = await request.get("/rss.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
    const body = await response.text();
    expect(body).toContain("<rss");
  });

  test("sitemap.xml responds with valid XML", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
  });

  test("robots.txt references the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body.toLowerCase()).toContain("sitemap");
  });
});
