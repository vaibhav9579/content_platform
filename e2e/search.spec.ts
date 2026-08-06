import { test, expect } from "@playwright/test";

test.describe("command palette search", () => {
  test("opens via the search button and finds a seeded post", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Search" }).click();
    const input = page.getByPlaceholder("Search articles, categories, tags, authors…");
    await expect(input).toBeVisible();

    await input.fill("server components");
    const result = page.getByRole("option", { name: /server components/i }).first();
    await expect(result).toBeVisible();

    await result.click();
    await expect(page).toHaveURL(/\/blog\//);
  });

  test("shows an empty state for queries with no matches", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).click();
    await page.getByPlaceholder("Search articles, categories, tags, authors…").fill("zzzznonexistentqueryzzzz");
    await expect(page.getByText("No results found.")).toBeVisible();
  });

  test("opens with the Ctrl/Cmd+K shortcut", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByPlaceholder("Search articles, categories, tags, authors…")).toBeVisible();
  });
});

test.describe("search API", () => {
  test("returns matching posts for a known seeded title", async ({ request }) => {
    const response = await request.get("/api/search?q=server+components");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.posts)).toBe(true);
    expect(body.posts.length).toBeGreaterThan(0);
  });
});
