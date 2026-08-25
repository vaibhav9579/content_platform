import "server-only";

import { prisma } from "@/lib/prisma";

export async function getPostForAdmin(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { tags: true, category: true, author: true },
  });
}

/**
 * `restrictToAuthorId` locks the author dropdown to a single option — used
 * for AUTHOR/CONTRIBUTOR writers, who can only ever post under their own
 * byline. ADMIN/EDITOR get the full author list to attribute posts freely.
 */
export async function getEditorFormData(restrictToAuthorId?: string) {
  const [authors, categories, tags] = await Promise.all([
    prisma.author.findMany({
      select: { id: true, name: true, avatarUrl: true },
      where: restrictToAuthorId ? { id: restrictToAuthorId } : undefined,
      orderBy: { name: "asc" },
    }),
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
