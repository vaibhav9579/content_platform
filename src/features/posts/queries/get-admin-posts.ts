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

const PAGE_SIZE = 20;

export async function getAdminPosts(
  opts: { status?: PostStatus; search?: string; page?: number; authorId?: string } = {},
) {
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.PostWhereInput = {
    deletedAt: null,
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.authorId ? { authorId: opts.authorId } : {}),
    ...(opts.search
      ? { title: { contains: opts.search, mode: "insensitive" as const } }
      : {}),
  };

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { updatedAtCms: "desc" },
      select: adminListSelect,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.post.count({ where }),
  ]);
  return { posts, totalCount, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) };
}

export async function getTrashedPosts(page = 1, authorId?: string) {
  const currentPage = Math.max(1, page);
  const where: Prisma.PostWhereInput = {
    deletedAt: { not: null },
    ...(authorId ? { authorId } : {}),
  };
  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { deletedAt: "desc" },
      select: adminListSelect,
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.post.count({ where }),
  ]);
  return {
    posts,
    totalCount,
    page: currentPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  };
}

export async function getPostStatusCounts(
  authorId?: string,
): Promise<Partial<Record<PostStatus, number>> & { TRASH: number }> {
  const counts = await prisma.post.groupBy({
    by: ["status"],
    where: { deletedAt: null, ...(authorId ? { authorId } : {}) },
    _count: true,
  });
  const trashed = await prisma.post.count({
    where: { deletedAt: { not: null }, ...(authorId ? { authorId } : {}) },
  });
  return {
    ...(Object.fromEntries(counts.map((c) => [c.status, c._count])) as Partial<Record<PostStatus, number>>),
    TRASH: trashed,
  };
}
