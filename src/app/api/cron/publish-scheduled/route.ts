import { NextResponse } from "next/server";

import { publishDuePosts } from "@/features/posts/actions/post-actions";

export const runtime = "nodejs";

/**
 * Triggered on a schedule (see vercel.json) to flip SCHEDULED posts whose
 * `scheduledAt` has passed over to PUBLISHED. Protected by CRON_SECRET —
 * Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on cron
 * requests when that env var is set, so no extra wiring is needed there.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await publishDuePosts();
  return NextResponse.json(result);
}
