import "server-only";

import { PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getPublicTags() {
  return prisma.tag.findMany({
    include: { _count: { select: { posts: { where: { status: PostStatus.PUBLISHED } } } } },
    orderBy: { name: "asc" },
  });
}

export async function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({ where: { slug } });
}
