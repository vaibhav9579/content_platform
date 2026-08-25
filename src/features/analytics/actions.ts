"use server";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { scopeAuthorId } from "@/lib/content/post-authorization";
import { PostStatus, type Prisma } from "@prisma/client";

const SHARE_NETWORKS = new Set(["x", "linkedin", "facebook", "copy"]);

export async function recordShare(postId: string, network: string) {
  if (!SHARE_NETWORKS.has(network)) return { success: false };
  await prisma.$transaction([
    prisma.post.update({ where: { id: postId }, data: { shareCount: { increment: 1 } } }),
    prisma.shareEvent.create({ data: { postId, network } }),
  ]);
  return { success: true };
}

export async function getShareBreakdown() {
  const user = await requireStaff();
  if (!user) return [];

  const authorId = scopeAuthorId(user);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const events = await prisma.shareEvent.groupBy({
    by: ["network"],
    where: { createdAt: { gte: since }, ...(authorId ? { post: { authorId } } : {}) },
    _count: { _all: true },
  });

  const labels: Record<string, string> = { x: "X", linkedin: "LinkedIn", facebook: "Facebook", copy: "Copied link" };
  return events
    .map((e) => ({ network: labels[e.network] ?? e.network, count: e._count._all }))
    .sort((a, b) => b.count - a.count);
}

export async function getDashboardStats() {
  const user = await requireStaff();
  if (!user) return null;

  // Authors/contributors only ever see figures for their own byline —
  // undefined (ADMIN/EDITOR) leaves every query site-wide.
  const authorId = scopeAuthorId(user);
  const scoped = authorId ? { authorId } : {};
  const scopedByPost = authorId ? { post: { authorId } } : {};

  const [totalPosts, published, drafts, scheduled, inReview, totalViews, totalComments, pendingComments, subscribers, topPosts] =
    await Promise.all([
      prisma.post.count({ where: { deletedAt: null, ...scoped } }),
      prisma.post.count({ where: { status: PostStatus.PUBLISHED, deletedAt: null, ...scoped } }),
      prisma.post.count({ where: { status: PostStatus.DRAFT, deletedAt: null, ...scoped } }),
      prisma.post.count({ where: { status: PostStatus.SCHEDULED, deletedAt: null, ...scoped } }),
      prisma.post.count({ where: { status: PostStatus.IN_REVIEW, deletedAt: null, ...scoped } }),
      prisma.post.aggregate({ where: { deletedAt: null, ...scoped }, _sum: { viewCount: true } }),
      prisma.comment.count({ where: { deletedAt: null, ...scopedByPost } }),
      prisma.comment.count({ where: { status: "PENDING", deletedAt: null, ...scopedByPost } }),
      // Subscribers are a site-wide metric, not attributable to one author —
      // the dashboard only renders this card for ADMIN/EDITOR.
      authorId ? Promise.resolve(0) : prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
      prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED, deletedAt: null, ...scoped },
        orderBy: { viewCount: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, viewCount: true, likeCount: true, publishedAt: true },
      }),
    ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [recentViews, last24hViews, priorViews, publishedPrior30d, publishedLast30d, subscribersPrior30d, subscribersLast30d] =
    await Promise.all([
      // Excludes bot traffic — these are the numbers shown to humans, not
      // crawler-activity logs (those stay queryable in the `views` table
      // directly via isBot=true for anyone auditing SEO crawl coverage).
      prisma.view.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, isBot: false, ...scopedByPost },
        select: { createdAt: true, visitorId: true },
      }),
      prisma.view.findMany({
        where: { createdAt: { gte: oneDayAgo }, isBot: false, ...scopedByPost },
        select: { visitorId: true },
      }),
      // The preceding 30-day window, used only to compute the "vs previous
      // period" deltas shown on the dashboard stat cards.
      prisma.view.findMany({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, isBot: false, ...scopedByPost },
        select: { visitorId: true },
      }),
      prisma.post.count({
        where: {
          status: PostStatus.PUBLISHED,
          deletedAt: null,
          publishedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          ...scoped,
        },
      }),
      prisma.post.count({
        where: { status: PostStatus.PUBLISHED, deletedAt: null, publishedAt: { gte: thirtyDaysAgo }, ...scoped },
      }),
      authorId
        ? Promise.resolve(0)
        : prisma.newsletterSubscriber.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      authorId
        ? Promise.resolve(0)
        : prisma.newsletterSubscriber.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

  const deltaPct = (current: number, prior: number) => {
    if (prior === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prior) / prior) * 100);
  };

  const byDay = new Map<string, { pageViews: number; visitors: Set<string> }>();
  for (const v of recentViews) {
    const day = v.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(day) ?? { pageViews: 0, visitors: new Set<string>() };
    bucket.pageViews += 1;
    bucket.visitors.add(v.visitorId);
    byDay.set(day, bucket);
  }
  const trafficTimeline = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    return { date: key, pageViews: bucket?.pageViews ?? 0, uniqueVisitors: bucket?.visitors.size ?? 0 };
  });

  const uniqueVisitors30d = new Set(recentViews.map((v) => v.visitorId)).size;
  const uniqueVisitorsPrior30d = new Set(priorViews.map((v) => v.visitorId)).size;

  return {
    totalPosts,
    published,
    drafts,
    scheduled,
    inReview,
    totalViews: totalViews._sum.viewCount ?? 0,
    totalComments,
    pendingComments,
    subscribers,
    topPosts,
    trafficTimeline,
    pageViews30d: recentViews.length,
    uniqueVisitors30d,
    uniqueVisitors24h: new Set(last24hViews.map((v) => v.visitorId)).size,
    periodLabel: `${thirtyDaysAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    trends: {
      pageViews: deltaPct(recentViews.length, priorViews.length),
      uniqueVisitors: deltaPct(uniqueVisitors30d, uniqueVisitorsPrior30d),
      published: deltaPct(publishedLast30d, publishedPrior30d),
      subscribers: deltaPct(subscribersLast30d, subscribersPrior30d),
    },
  };
}

export type AnalyticsSort = "viewCount" | "likeCount" | "clapCount" | "shareCount" | "bookmarkCount";

export async function getTopPostsBy(sort: AnalyticsSort, take = 10) {
  const user = await requireStaff();
  if (!user) return [];

  const authorId = scopeAuthorId(user);
  const orderBy: Prisma.PostOrderByWithRelationInput = { [sort]: "desc" };

  return prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED, deletedAt: null, ...(authorId ? { authorId } : {}) },
    orderBy,
    take,
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      likeCount: true,
      clapCount: true,
      shareCount: true,
      bookmarkCount: true,
      publishedAt: true,
      category: { select: { name: true } },
    },
  });
}

export async function getReferrerBreakdown() {
  const user = await requireStaff();
  if (!user) return [];

  const authorId = scopeAuthorId(user);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const views = await prisma.view.findMany({
    where: { createdAt: { gte: since }, isBot: false, ...(authorId ? { post: { authorId } } : {}) },
    select: { referrer: true },
  });

  const counts = new Map<string, number>();
  for (const v of views) {
    let source = "Direct";
    if (v.referrer) {
      try {
        source = new URL(v.referrer).hostname.replace(/^www\./, "");
      } catch {
        source = "Other";
      }
    }
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}
