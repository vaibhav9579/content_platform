import "server-only";

import { Prisma, PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const adminListSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  publishedAt: true,
  scheduledAt: true,
  updatedAtCms: true,
  deletedAt: true,
  viewCount: true,
  coverImageUrl: true,
  author: { select: { name: true } },
  category: { select: { name: true } },
} satisfies Prisma.PostSelect;

export async function getAdminPosts(opts: { status?: PostStatus; search?: string } = {}) {
  const where: Prisma.PostWhereInput = {
    deletedAt: null,
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.search
      ? { title: { contains: opts.search, mode: "insensitive" as const } }
      : {}),
  };

  return prisma.post.findMany({
    where,
    orderBy: { updatedAtCms: "desc" },
    select: adminListSelect,
    take: 100,
  });
}

export async function getTrashedPosts() {
  return prisma.post.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: adminListSelect,
    take: 200,
  });
}

export async function getPostStatusCounts(): Promise<Partial<Record<PostStatus, number>> & { TRASH: number }> {
  const counts = await prisma.post.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: true,
  });
  const trashed = await prisma.post.count({ where: { deletedAt: { not: null } } });
  return {
    ...(Object.fromEntries(counts.map((c) => [c.status, c._count])) as Partial<Record<PostStatus, number>>),
    TRASH: trashed,
  };
}
