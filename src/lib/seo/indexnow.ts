import "server-only";

import { siteConfig } from "@/config/site";

/**
 * Tells IndexNow-participating search engines (Bing, Yandex, and others —
 * notably not Google, which doesn't consume this protocol) that a URL
 * changed, instead of waiting for their crawler to notice on its own.
 * Best-effort: never throws, so a network hiccup can't block a publish.
 */
export async function pingIndexNow(path: string) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return;

  try {
    const host = new URL(siteConfig.url).host;
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${siteConfig.url}/${key}.txt`,
        urlList: [`${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`],
      }),
    });
  } catch (err) {
    console.error("pingIndexNow failed", err);
  }
}
