"use server";

import { revalidatePath } from "next/cache";
import DOMPurify from "isomorphic-dompurify";
import { CommentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentDbUser, requireStaff } from "@/lib/auth";
import { commentInputSchema, type CommentInput } from "@/lib/validations";
import { commentRateLimit, getRequestIdentifier } from "@/lib/rate-limit";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export async function submitComment(raw: CommentInput): Promise<ActionResult<{ id: string }>> {
  const parsed = commentInputSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid comment" };
  const input = parsed.data;

  // Honeypot tripped — pretend success so the bot doesn't learn to adjust,
  // but never touch the database.
  if (input.website) {
    return { success: true, data: { id: "discarded" } };
  }

  const user = await getCurrentDbUser();
  const identifier = user?.id ?? (await getRequestIdentifier());
  const { success: withinLimit } = await commentRateLimit.check(identifier);
  if (!withinLimit) {
    return { success: false, error: "You're commenting too quickly — please wait a moment and try again." };
  }

  const post = await prisma.post.findUnique({
    where: { id: input.postId, deletedAt: null },
    select: { id: true, slug: true, allowComments: true },
  });
  if (!post || !post.allowComments) {
    return { success: false, error: "Comments are closed for this post." };
  }

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

/** Moves a comment to trash — recoverable via `restoreComment`. */
export async function deleteComment(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const comment = await prisma.comment.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: { post: { select: { slug: true } } },
  });
  revalidatePath(`/blog/${comment.post.slug}`);
  revalidatePath("/admin/comments");
  return { success: true, data: undefined };
}

export async function restoreComment(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const comment = await prisma.comment.update({
    where: { id },
    data: { deletedAt: null },
    include: { post: { select: { slug: true } } },
  });
  revalidatePath(`/blog/${comment.post.slug}`);
  revalidatePath("/admin/comments");
  return { success: true, data: undefined };
}

/** Irreversibly removes a trashed comment. Only callable on already-trashed comments. */
export async function permanentlyDeleteComment(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const comment = await prisma.comment.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!comment?.deletedAt) {
    return { success: false, error: "Move the comment to trash before deleting it permanently." };
  }

  await prisma.comment.delete({ where: { id } });
  revalidatePath("/admin/comments");
  return { success: true, data: undefined };
}

export async function getAllComments(opts: { status?: CommentStatus; trashed?: boolean } = {}) {
  const user = await requireStaff();
  if (!user) return [];

  return prisma.comment.findMany({
    where: {
      deletedAt: opts.trashed ? { not: null } : null,
      ...(opts.status ? { status: opts.status } : {}),
    },
    include: {
      user: { select: { name: true, email: true, imageUrl: true } },
      post: { select: { title: true, slug: true } },
    },
    orderBy: opts.trashed ? { deletedAt: "desc" } : { createdAt: "desc" },
    take: 200,
  });
}

export async function getApprovedComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, status: CommentStatus.APPROVED, parentId: null, deletedAt: null },
    include: {
      user: { select: { name: true, imageUrl: true } },
      replies: {
        where: { status: CommentStatus.APPROVED, deletedAt: null },
        include: { user: { select: { name: true, imageUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
