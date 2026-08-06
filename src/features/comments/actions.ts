"use server";

import { revalidatePath } from "next/cache";
import DOMPurify from "isomorphic-dompurify";
import { CommentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentDbUser, requireStaff } from "@/lib/auth";
import { commentInputSchema, type CommentInput } from "@/lib/validations";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export async function submitComment(raw: CommentInput): Promise<ActionResult<{ id: string }>> {
  const parsed = commentInputSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid comment" };
  const input = parsed.data;

  const post = await prisma.post.findUnique({
    where: { id: input.postId },
    select: { id: true, slug: true, allowComments: true },
  });
  if (!post || !post.allowComments) {
    return { success: false, error: "Comments are closed for this post." };
  }

  const user = await getCurrentDbUser();
  if (!user && (!input.guestName || !input.guestEmail)) {
    return { success: false, error: "Sign in or provide your name and email to comment." };
  }

  const sanitizedBody = DOMPurify.sanitize(input.body, { ALLOWED_TAGS: [] }).trim();
  if (!sanitizedBody) return { success: false, error: "Comment cannot be empty." };

  const comment = await prisma.comment.create({
    data: {
      postId: input.postId,
      userId: user?.id,
      guestName: user ? null : input.guestName,
      guestEmail: user ? null : input.guestEmail,
      body: sanitizedBody,
      parentId: input.parentId || null,
      // Signed-in staff comments publish immediately; everyone else is queued for moderation.
      status: user ? CommentStatus.APPROVED : CommentStatus.PENDING,
    },
  });

  revalidatePath(`/blog/${post.slug}`);
  return { success: true, data: { id: comment.id } };
}

export async function moderateComment(
  id: string,
  status: CommentStatus,
): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const comment = await prisma.comment.update({
    where: { id },
    data: { status },
    include: { post: { select: { slug: true } } },
  });

  revalidatePath(`/blog/${comment.post.slug}`);
  revalidatePath("/admin/comments");
  return { success: true, data: undefined };
}

export async function deleteComment(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const comment = await prisma.comment.delete({ where: { id }, include: { post: { select: { slug: true } } } });
  revalidatePath(`/blog/${comment.post.slug}`);
  revalidatePath("/admin/comments");
  return { success: true, data: undefined };
}

export async function getAllComments(status?: CommentStatus) {
  const user = await requireStaff();
  if (!user) return [];

  return prisma.comment.findMany({
    where: status ? { status } : undefined,
    include: {
      user: { select: { name: true, email: true, imageUrl: true } },
      post: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getApprovedComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, status: CommentStatus.APPROVED, parentId: null },
    include: {
      user: { select: { name: true, imageUrl: true } },
      replies: {
        where: { status: CommentStatus.APPROVED },
        include: { user: { select: { name: true, imageUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
