import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { viewsRateLimit, getRequestIdentifier } from "@/lib/rate-limit";
import { isBotUserAgent } from "@/lib/analytics/bot-detection";

export const runtime = "nodejs";

const VISITOR_COOKIE = "cp_vid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months — the GA4-style cap on first-party id cookies
const DEDUPE_WINDOW_MS = 30 * 60 * 1000; // repeat views of the same page by the same visitor within this window don't recount

const bodySchema = z.object({
  path: z.string().min(1).max(500),
  postId: z.string().cuid().optional(),
  referrer: z.string().max(2048).optional(),
});

/**
 * Records one page-view event. Fired by the client on every navigation
 * (see SiteViewTracker / ViewTracker) rather than as a server action, so a
 * durable httpOnly visitor-id cookie can be minted here on the first hit.
 */
export async function POST(req: Request) {
  const identifier = await getRequestIdentifier();
  const { success: withinLimit } = await viewsRateLimit.check(identifier);
  if (!withinLimit) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { path, postId, referrer } = parsed.data;

  const cookieStore = await cookies();
  const existingVisitorId = cookieStore.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || crypto.randomUUID();

  const userAgent = (await headers()).get("user-agent");
  const isBot = isBotUserAgent(userAgent);

  try {
    const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
    const recent = await prisma.view.findFirst({
      where: { visitorId, path, createdAt: { gte: since } },
      select: { id: true },
    });

    if (!recent) {
      await prisma.$transaction([
        prisma.view.create({
          data: { visitorId, path, postId, referrer, userAgent, isBot },
        }),
        ...(postId && !isBot
          ? [prisma.post.update({ where: { id: postId }, data: { viewCount: { increment: 1 } } })]
          : []),
      ]);
    }
  } catch {
    // Best-effort telemetry — a bad/stale postId or a transient DB hiccup
    // should never surface as a user-visible error.
  }

  const res = NextResponse.json({ ok: true });
  if (!existingVisitorId) {
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: VISITOR_COOKIE_MAX_AGE,
      path: "/",
    });
  }
  return res;
}
