import "server-only";

import { PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getPublicAuthors() {
  return prisma.author.findMany({
    include: { _count: { select: { posts: { where: { status: PostStatus.PUBLISHED } } } } },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });
}

export async function getPublicAuthorBySlug(slug: string) {
  return prisma.author.findUnique({ where: { slug } });
}
