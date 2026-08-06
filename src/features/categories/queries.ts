import "server-only";

import { PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getPublicCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { posts: { where: { status: PostStatus.PUBLISHED } } } } },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug }, include: { parent: true, children: true } });
}
