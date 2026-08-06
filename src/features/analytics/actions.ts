"use server";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { PostStatus, type Prisma } from "@prisma/client";

export async function recordShare(postId: string) {
  await prisma.post.update({ where: { id: postId }, data: { shareCount: { increment: 1 } } });
  return { success: true };
}

export async function getDashboardStats() {
  const user = await requireStaff();
  if (!user) return null;

  const [totalPosts, published, drafts, scheduled, totalViews, totalComments, pendingComments, subscribers, topPosts] =
    await Promise.all([
      prisma.post.count({ where: { deletedAt: null } }),
      prisma.post.count({ where: { status: PostStatus.PUBLISHED, deletedAt: null } }),
      prisma.post.count({ where: { status: PostStatus.DRAFT, deletedAt: null } }),
      prisma.post.count({ where: { status: PostStatus.SCHEDULED, deletedAt: null } }),
      prisma.post.aggregate({ where: { deletedAt: null }, _sum: { viewCount: true } }),
      prisma.comment.count({ where: { deletedAt: null } }),
      prisma.comment.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
      prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED, deletedAt: null },
        orderBy: { viewCount: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, viewCount: true, likeCount: true, publishedAt: true },
      }),
    ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [recentViews, last24hViews] = await Promise.all([
    // Excludes bot traffic — these are the numbers shown to humans, not
    // crawler-activity logs (those stay queryable in the `views` table
    // directly via isBot=true for anyone auditing SEO crawl coverage).
    prisma.view.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, isBot: false },
      select: { createdAt: true, visitorId: true },
    }),
    prisma.view.findMany({
      where: { createdAt: { gte: oneDayAgo }, isBot: false },
      select: { visitorId: true },
    }),
  ]);

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

  return {
    totalPosts,
    published,
    drafts,
    scheduled,
    totalViews: totalViews._sum.viewCount ?? 0,
    totalComments,
    pendingComments,
    subscribers,
    topPosts,
    trafficTimeline,
    pageViews30d: recentViews.length,
    uniqueVisitors30d: new Set(recentViews.map((v) => v.visitorId)).size,
    uniqueVisitors24h: new Set(last24hViews.map((v) => v.visitorId)).size,
  };
}

export type AnalyticsSort = "viewCount" | "likeCount" | "clapCount" | "shareCount" | "bookmarkCount";

export async function getTopPostsBy(sort: AnalyticsSort, take = 10) {
  const user = await requireStaff();
  if (!user) return [];

  const orderBy: Prisma.PostOrderByWithRelationInput = { [sort]: "desc" };

  return prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED, deletedAt: null },
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

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const views = await prisma.view.findMany({
    where: { createdAt: { gte: since }, isBot: false },
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
