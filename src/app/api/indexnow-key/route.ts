import { NextResponse } from "next/server";

/**
 * Served (via a next.config.ts rewrite) at the literal path IndexNow
 * requires — /{INDEXNOW_KEY}.txt — to prove ownership of the site before
 * search engines will accept submissions signed with this key.
 */
export async function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(key, { headers: { "Content-Type": "text/plain" } });
}
