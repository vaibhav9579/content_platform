"use server";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { PostStatus } from "@prisma/client";

export async function recordView(postId: string, visitorId: string, referrer?: string, userAgent?: string) {
  const since = new Date(Date.now() - 30 * 60 * 1000); // 30-minute dedupe window per visitor
  const recent = await prisma.view.findFirst({
    where: { postId, visitorId, createdAt: { gte: since } },
    select: { id: true },
  });
  if (recent) return { counted: false };

  await prisma.$transaction([
    prisma.view.create({ data: { postId, visitorId, referrer, userAgent } }),
    prisma.post.update({ where: { id: postId }, data: { viewCount: { increment: 1 } } }),
  ]);
  return { counted: true };
}

export async function recordShare(postId: string) {
  await prisma.post.update({ where: { id: postId }, data: { shareCount: { increment: 1 } } });
  return { success: true };
}

export async function getDashboardStats() {
  const user = await requireStaff();
  if (!user) return null;

  const [totalPosts, published, drafts, scheduled, totalViews, totalComments, pendingComments, subscribers, topPosts] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      prisma.post.count({ where: { status: PostStatus.DRAFT } }),
      prisma.post.count({ where: { status: PostStatus.SCHEDULED } }),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
      prisma.comment.count(),
      prisma.comment.count({ where: { status: "PENDING" } }),
      prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
      prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        orderBy: { viewCount: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, viewCount: true, likeCount: true, publishedAt: true },
      }),
    ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentViews = await prisma.view.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });

  const viewsByDay = new Map<string, number>();
  for (const v of recentViews) {
    const day = v.createdAt.toISOString().slice(0, 10);
    viewsByDay.set(day, (viewsByDay.get(day) ?? 0) + 1);
  }
  const viewsTimeline = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    return { date: key, views: viewsByDay.get(key) ?? 0 };
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
    viewsTimeline,
  };
}
