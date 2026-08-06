"use server";

import { revalidatePath } from "next/cache";
import { ReactionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export async function toggleBookmark(postId: string): Promise<ActionResult<{ bookmarked: boolean }>> {
  const user = await getCurrentDbUser();
  if (!user) return { success: false, error: "Sign in to bookmark articles." };

  const existing = await prisma.bookmark.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.bookmark.delete({ where: { id: existing.id } }),
      prisma.post.update({ where: { id: postId }, data: { bookmarkCount: { decrement: 1 } } }),
    ]);
    return { success: true, data: { bookmarked: false } };
  }

  await prisma.$transaction([
    prisma.bookmark.create({ data: { postId, userId: user.id } }),
    prisma.post.update({ where: { id: postId }, data: { bookmarkCount: { increment: 1 } } }),
  ]);
  return { success: true, data: { bookmarked: true } };
}

export async function getUserBookmarks() {
  const user = await getCurrentDbUser();
  if (!user) return [];

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    include: {
      post: {
        select: {
          id: true,
          slug: true,
          title: true,
          coverImageUrl: true,
          excerpt: true,
          readingTimeMinutes: true,
          publishedAt: true,
          author: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return bookmarks.map((b) => b.post);
}

export async function toggleReaction(
  postId: string,
  type: ReactionType,
): Promise<ActionResult<{ active: boolean }>> {
  const user = await getCurrentDbUser();
  if (!user) return { success: false, error: "Sign in to react to articles." };

  const countField = type === ReactionType.CLAP ? "clapCount" : "likeCount";

  const existing = await prisma.reaction.findUnique({
    where: { postId_userId_type: { postId, userId: user.id, type } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.reaction.delete({ where: { id: existing.id } }),
      prisma.post.update({ where: { id: postId }, data: { [countField]: { decrement: 1 } } }),
    ]);
    revalidatePath(`/blog`);
    return { success: true, data: { active: false } };
  }

  await prisma.$transaction([
    prisma.reaction.create({ data: { postId, userId: user.id, type } }),
    prisma.post.update({ where: { id: postId }, data: { [countField]: { increment: 1 } } }),
  ]);
  return { success: true, data: { active: true } };
}
