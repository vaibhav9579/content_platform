"use server";

import { revalidatePath } from "next/cache";
import { Prisma, PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStaff, canPublish, canManageSettings } from "@/lib/auth";
import { getAdminPosts, getTrashedPosts } from "@/features/posts/queries/get-admin-posts";
import { postInputSchema, type PostInput } from "@/lib/validations";
import { ensureUniqueSlug } from "@/lib/content/slug";
import { computeExcerpt, computeMetaDescription, computeReadingStats } from "@/lib/content/reading-time";
import { addHeadingIds } from "@/lib/content/toc";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

function revalidatePublicPost(slug: string) {
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/");
  revalidatePath("/blog");
}

export async function savePost(rawInput: PostInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "You do not have permission to manage posts." };

  const parsed = postInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid post data" };
  }
  const input = parsed.data;

  if (input.status === PostStatus.PUBLISHED && !canPublish(user.role)) {
    return { success: false, error: "Only editors and admins can publish posts." };
  }

  const html = input.contentHtml ?? "";
  const htmlWithIds = addHeadingIds(html);
  const readingStats = computeReadingStats(htmlWithIds);
  const excerpt = input.excerpt?.trim() || computeExcerpt(htmlWithIds);
  const metaDescription = input.metaDescription?.trim() || computeMetaDescription(htmlWithIds);

  const slug = await ensureUniqueSlug(
    input.slug || input.title,
    async (candidate) => {
      const existing = await prisma.post.findUnique({ where: { slug: candidate } });
      return !!existing && existing.id !== input.id;
    },
    input.id ? input.slug : undefined,
  );

  const shouldSetPublishedAt = input.status === PostStatus.PUBLISHED;

  const data = {
    title: input.title,
    subtitle: input.subtitle || null,
    slug,
    contentJson: input.contentJson,
    contentHtml: htmlWithIds,
    contentMdx: input.contentMdx || null,
    excerpt,
    metaTitle: input.metaTitle || input.title,
    metaDescription,
    canonicalUrl: input.canonicalUrl || null,
    metaRobots: input.metaRobots,
    coverImageUrl: input.coverImageUrl || null,
    coverImageAlt: input.coverImageAlt || null,
    ogImageUrl: input.ogImageUrl || input.coverImageUrl || null,
    galleryUrls: input.galleryUrls,
    status: input.status,
    scheduledAt: input.status === PostStatus.SCHEDULED ? input.scheduledAt : null,
    readingTimeMinutes: readingStats.minutes,
    wordCount: readingStats.words,
    difficulty: input.difficulty ?? undefined,
    summary: input.summary || null,
    keyTakeaways: input.keyTakeaways,
    faq: input.faq,
    sources: input.sources,
    isFeatured: input.isFeatured,
    isPinned: input.isPinned,
    allowComments: input.allowComments,
    authorId: input.authorId,
    categoryId: input.categoryId || null,
  };

  const tagIds = input.tagIds.map((id) => ({ id }));

  try {
    const post = input.id
      ? await prisma.post.update({
          where: { id: input.id },
          data: { ...data, tags: { set: tagIds } },
        })
      : await prisma.post.create({
          data: { ...data, tags: { connect: tagIds } },
        });

    // Set publishedAt exactly once, the first time a post goes live.
    if (shouldSetPublishedAt && !post.publishedAt) {
      await prisma.post.update({ where: { id: post.id }, data: { publishedAt: new Date() } });
    }

    if (input.id) {
      await prisma.postRevision.create({
        data: {
          postId: post.id,
          authorId: user.id,
          title: post.title,
          contentJson: post.contentJson ?? {},
        },
      });
    }

    revalidatePublicPost(post.slug);
    revalidatePath("/admin/posts");

    return { success: true, data: { id: post.id, slug: post.slug } };
  } catch (err) {
    console.error("savePost failed", err);
    return { success: false, error: "Could not save post. Please try again." };
  }
}

export async function autosavePost(id: string, contentJson: unknown, contentHtml: string) {
  const user = await requireStaff();
  if (!user) return { success: false as const, error: "Unauthorized" };

  try {
    const readingStats = computeReadingStats(contentHtml);
    await prisma.post.update({
      where: { id },
      data: {
        contentJson: contentJson as never,
        contentHtml,
        readingTimeMinutes: readingStats.minutes,
        wordCount: readingStats.words,
      },
    });
    return { success: true as const, savedAt: new Date().toISOString() };
  } catch (err) {
    console.error("autosavePost failed", err);
    return { success: false as const, error: "Autosave failed" };
  }
}

/** Moves a post to trash — recoverable via `restorePost`. */
export async function deletePost(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const post = await prisma.post.findUnique({ where: { id }, select: { slug: true } });
  if (!post) return { success: false, error: "Post not found" };

  await prisma.$transaction([
    prisma.post.update({ where: { id }, data: { deletedAt: new Date() } }),
    // A trashed post shouldn't keep surfacing in "related articles" — drop
    // both directions of any curated relation involving it.
    prisma.postRelation.deleteMany({ where: { OR: [{ postId: id }, { relatedPostId: id }] } }),
  ]);

  revalidatePublicPost(post.slug);
  revalidatePath("/admin/posts");
  return { success: true, data: undefined };
}

export async function restorePost(id: string): Promise<ActionResult<{ slug: string }>> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const post = await prisma.post.update({ where: { id }, data: { deletedAt: null } });
  revalidatePublicPost(post.slug);
  revalidatePath("/admin/posts");
  return { success: true, data: { slug: post.slug } };
}

/** Irreversibly deletes a trashed post. Only callable on already-trashed posts, and admin-only. */
export async function permanentlyDeletePost(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!canManageSettings(user.role)) return { success: false, error: "Only admins can permanently delete posts." };

  const post = await prisma.post.findUnique({ where: { id }, select: { slug: true, deletedAt: true } });
  if (!post) return { success: false, error: "Post not found" };
  if (!post.deletedAt) return { success: false, error: "Move the post to trash before deleting it permanently." };

  await prisma.post.delete({ where: { id } });
  revalidatePublicPost(post.slug);
  revalidatePath("/admin/posts");
  return { success: true, data: undefined };
}

export async function listTrashedPostsForAdmin() {
  const user = await requireStaff();
  if (!user) return [];
  return getTrashedPosts();
}

export async function duplicatePost(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const original = await prisma.post.findUnique({ where: { id }, include: { tags: true } });
  if (!original) return { success: false, error: "Post not found" };

  const slug = await ensureUniqueSlug(`${original.slug}-copy`, async (candidate) => {
    const existing = await prisma.post.findUnique({ where: { slug: candidate } });
    return !!existing;
  });

  const copy = await prisma.post.create({
    data: {
      title: `${original.title} (Copy)`,
      subtitle: original.subtitle,
      slug,
      contentJson: original.contentJson ?? {},
      contentHtml: original.contentHtml,
      excerpt: original.excerpt,
      metaTitle: original.metaTitle,
      metaDescription: original.metaDescription,
      coverImageUrl: original.coverImageUrl,
      coverImageAlt: original.coverImageAlt,
      status: PostStatus.DRAFT,
      authorId: original.authorId,
      categoryId: original.categoryId,
      difficulty: original.difficulty,
      readingTimeMinutes: original.readingTimeMinutes,
      wordCount: original.wordCount,
      summary: original.summary,
      keyTakeaways: original.keyTakeaways,
      faq: original.faq ?? undefined,
      sources: original.sources ?? undefined,
      tags: { connect: original.tags.map((t) => ({ id: t.id })) },
    },
  });

  revalidatePath("/admin/posts");
  return { success: true, data: { id: copy.id } };
}

export async function updatePostStatus(
  id: string,
  status: PostStatus,
  scheduledAt?: Date,
): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };
  if ((status === PostStatus.PUBLISHED || status === PostStatus.SCHEDULED) && !canPublish(user.role)) {
    return { success: false, error: "Only editors and admins can publish posts." };
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      status,
      scheduledAt: status === PostStatus.SCHEDULED ? scheduledAt : null,
      publishedAt: status === PostStatus.PUBLISHED ? new Date() : undefined,
    },
  });

  revalidatePublicPost(post.slug);
  revalidatePath("/admin/posts");
  return { success: true, data: undefined };
}

export async function restoreRevision(revisionId: string): Promise<ActionResult<{ slug: string }>> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const revision = await prisma.postRevision.findUnique({ where: { id: revisionId }, include: { post: true } });
  if (!revision) return { success: false, error: "Revision not found" };

  const post = await prisma.post.update({
    where: { id: revision.postId },
    data: { title: revision.title, contentJson: revision.contentJson as Prisma.InputJsonValue },
  });

  revalidatePublicPost(post.slug);
  return { success: true, data: { slug: post.slug } };
}

/** Publishes any posts whose `scheduledAt` has passed. Intended for a cron/route handler. */
export async function publishDuePosts() {
  const due = await prisma.post.findMany({
    where: { status: PostStatus.SCHEDULED, scheduledAt: { lte: new Date() } },
    select: { id: true, slug: true },
  });

  if (due.length === 0) return { published: 0 };

  await prisma.post.updateMany({
    where: { id: { in: due.map((p) => p.id) } },
    data: { status: PostStatus.PUBLISHED, publishedAt: new Date(), scheduledAt: null },
  });

  due.forEach((p) => revalidatePublicPost(p.slug));
  return { published: due.length };
}

export async function listPostsForAdmin(status?: PostStatus, search?: string) {
  const user = await requireStaff();
  if (!user) return [];
  return getAdminPosts({ status, search });
}
