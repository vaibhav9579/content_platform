import "server-only";

import { Prisma, PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getAdminPosts(opts: { status?: PostStatus; search?: string } = {}) {
  const where: Prisma.PostWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.search
      ? { title: { contains: opts.search, mode: "insensitive" as const } }
      : {}),
  };

  return prisma.post.findMany({
    where,
    orderBy: { updatedAtCms: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      scheduledAt: true,
      updatedAtCms: true,
      viewCount: true,
      coverImageUrl: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
    take: 100,
  });
}

export async function getPostStatusCounts() {
  const counts = await prisma.post.groupBy({ by: ["status"], _count: true });
  return Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<PostStatus, number>;
}
