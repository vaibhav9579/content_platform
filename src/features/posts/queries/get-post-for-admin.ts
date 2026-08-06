import "server-only";

import { prisma } from "@/lib/prisma";

export async function getPostForAdmin(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { tags: true, category: true, author: true },
  });
}

export async function getEditorFormData() {
  const [authors, categories, tags] = await Promise.all([
    prisma.author.findMany({ select: { id: true, name: true, avatarUrl: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { authors, categories, tags };
}

export async function getPostRevisions(postId: string) {
  return prisma.postRevision.findMany({
    where: { postId },
    include: { editor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}
