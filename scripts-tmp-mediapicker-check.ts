import "dotenv/config";
import { chromium } from "@playwright/test";
import { PrismaClient, Role } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();
const BASE = "http://localhost:3000";

async function main() {
  const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN }, orderBy: { createdAt: "desc" } });
  if (!adminUser) throw new Error("no admin user found");
  const client = await clerkClient();
  const ticket = await client.signInTokens.createSignInToken({ userId: adminUser.clerkId, expiresInSeconds: 600 });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 250)); });

  await page.goto(`${BASE}/sign-in?__clerk_ticket=${ticket.token}`, { waitUntil: "domcontentloaded" });
  await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 20000 }).catch(() => {});

  await page.goto(`${BASE}/admin/posts/new`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  // 1) Cover image field -> click opens picker
  const coverBox = page.getByText("Click to choose, or drag an image to upload");
  await coverBox.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "scripts-tmp-mp-1-cover-picker.png" });
  const dialogVisible = await page.getByRole("heading", { name: "Choose an image" }).count();
  console.log("cover picker dialog visible:", dialogVisible);

  const gridImages = await page.locator('[role="dialog"] button img').count();
  console.log("existing media items shown:", gridImages);

  if (gridImages > 0) {
    await page.locator('[role="dialog"] button').filter({ has: page.locator("img") }).first().click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: "scripts-tmp-mp-2-cover-set.png" });

  // 2) Editor body slash-command image -> picker
  await page.locator('textarea[placeholder="Post title…"]').fill(`Media Picker Test ${Date.now()}`);
  const editorBody = page.locator(".ProseMirror").first();
  await editorBody.click();
  await page.keyboard.type("/image");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "scripts-tmp-mp-3-slash-menu.png" });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  const dialogInEditor = await page.getByRole("heading", { name: "Choose an image" }).count();
  console.log("editor image picker dialog visible:", dialogInEditor);
  await page.screenshot({ path: "scripts-tmp-mp-4-editor-picker.png" });

  const gridImages2 = await page.locator('[role="dialog"] button img').count();
  console.log("existing media items shown (editor):", gridImages2);
  if (gridImages2 > 0) {
    await page.locator('[role="dialog"] button').filter({ has: page.locator("img") }).first().click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: "scripts-tmp-mp-5-image-in-body.png" });

  console.log("errors:", errors.length);
  errors.forEach((e) => console.log("  " + e));

  await browser.close();
}

main()
  .catch((e) => console.error("SCRIPT ERROR", e))
  .finally(() => prisma.$disconnect());
