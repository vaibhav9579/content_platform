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
import { sectionForField } from "@/lib/content/post-error-section";
import { sendNewPostNotification } from "@/features/newsletter/actions";
import { pingIndexNow } from "@/lib/seo/indexnow";
import { buildPrefixTsQuery } from "@/lib/search/full-text-query";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; section?: "seo" | "geo" };

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
    const issue = parsed.error.issues[0];
    return {
      success: false,
      error: issue?.message ?? "Invalid post data",
      section: issue ? sectionForField(issue.path) : undefined,
    };
  }
  const input = parsed.data;

  if (input.status === PostStatus.PUBLISHED && !canPublish(user.role)) {
    return { success: false, error: "Only editors and admins can publish posts." };
  }

  try {
    const html = input.contentHtml ?? "";
    const htmlWithIds = addHeadingIds(html);
    const readingStats = computeReadingStats(htmlWithIds);
    const excerpt = input.excerpt?.trim() || computeExcerpt(htmlWithIds);
    const metaDescription = input.metaDescription?.trim() || computeMetaDescription(htmlWithIds);

    const rawSlug = await ensureUniqueSlug(
      input.slug || input.title,
      async (candidate) => {
        const existing = await prisma.post.findUnique({ where: { slug: candidate } });
        return !!existing && existing.id !== input.id;
      },
      input.id ? input.slug : undefined,
    );
    // A title made entirely of characters slugify can't transliterate
    // (e.g. non-Latin scripts, emoji-only) collapses to an empty string —
    // fall back to a short random slug instead of saving an unusable one.
    const slug = rawSlug || `post-${Math.random().toString(36).slice(2, 8)}`;

    const shouldSetPublishedAt = input.status === PostStatus.PUBLISHED;

    // The Tiptap document arrives from the client as a Server Action
    // argument; round-tripping it through JSON strips any non-plain
    // reference it might carry across that boundary (Next's RSC layer can
    // wrap client-originated object graphs in ways Prisma's own argument
    // inspection then trips over — see the incident notes for savePost).
    // A Json column can only ever hold plain JSON anyway, so this is lossless.
    const sanitizedContentJson =
      input.contentJson == null ? input.contentJson : JSON.parse(JSON.stringify(input.contentJson));

    const data = {
      title: input.title,
      subtitle: input.subtitle || null,
      slug,
      contentJson: sanitizedContentJson,
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
      await sendNewPostNotification({
        title: post.title,
        excerpt,
        slug: post.slug,
        coverImageUrl: post.coverImageUrl,
      });
      await pingIndexNow(`/blog/${post.slug}`);
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
    return { success: false, error: describeSaveError(err) };
  }
}

/**
 * Maps common failure modes to an actionable message instead of the old
 * one-size-fits-all "Could not save post" — the editor's author/category/tag
 * dropdowns are populated once on page load, so a stale selection (the row
 * was deleted/renamed elsewhere after that) is the most common real cause,
 * and previously surfaced identically to an actual server outage.
 */
function describeSaveError(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2003") {
      const field = (err.meta?.field_name as string | undefined) ?? "";
      if (field.includes("author")) return "The selected author no longer exists — pick another author and save again.";
      if (field.includes("category")) return "The selected category no longer exists — pick another category and save again.";
      return "Could not save post: a related author/category no longer exists. Refresh the page and try again.";
    }
    if (err.code === "P2025") {
      return "One or more selected tags no longer exist — update the tags field and save again.";
    }
    if (err.code === "P2002") {
      return "That URL slug is already in use by another post — choose a different slug.";
    }
  }
  return "Could not save post. Please try again.";
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

export async function listTrashedPostsForAdmin(page?: number) {
  const user = await requireStaff();
  if (!user) return { posts: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 1 };
  return getTrashedPosts(page);
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

  const existing = await prisma.post.findUnique({ where: { id }, select: { publishedAt: true } });
  const isFirstPublish = status === PostStatus.PUBLISHED && !existing?.publishedAt;

  const post = await prisma.post.update({
    where: { id },
    data: {
      status,
      scheduledAt: status === PostStatus.SCHEDULED ? scheduledAt : null,
      publishedAt: isFirstPublish ? new Date() : undefined,
    },
  });

  if (isFirstPublish) {
    await sendNewPostNotification({
      title: post.title,
      excerpt: post.excerpt,
      slug: post.slug,
      coverImageUrl: post.coverImageUrl,
    });
    await pingIndexNow(`/blog/${post.slug}`);
  }

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
    select: { id: true, slug: true, title: true, excerpt: true, coverImageUrl: true, publishedAt: true },
  });

  if (due.length === 0) return { published: 0 };

  await prisma.post.updateMany({
    where: { id: { in: due.map((p) => p.id) } },
    data: { status: PostStatus.PUBLISHED, publishedAt: new Date(), scheduledAt: null },
  });

  for (const p of due) {
    revalidatePublicPost(p.slug);
    // Skip re-notifying if this post was previously published, scheduled
    // back, and is now going live again — only ever notify once.
    if (!p.publishedAt) {
      await sendNewPostNotification({
        title: p.title,
        excerpt: p.excerpt,
        slug: p.slug,
        coverImageUrl: p.coverImageUrl,
      });
      await pingIndexNow(`/blog/${p.slug}`);
    }
  }

  return { published: due.length };
}

export async function listPostsForAdmin(status?: PostStatus, search?: string, page?: number) {
  const user = await requireStaff();
  if (!user) return { posts: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 1 };
  return getAdminPosts({ status, search, page });
}

/** Exact, case-insensitive title match — a lightweight nudge, not a hard block, before publishing. */
export async function findPostWithSameTitle(title: string, excludeId?: string) {
  const user = await requireStaff();
  if (!user) return null;

  const trimmed = title.trim();
  if (!trimmed) return null;

  const match = await prisma.post.findFirst({
    where: {
      deletedAt: null,
      title: { equals: trimmed, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, title: true, slug: true, status: true },
  });
  return match;
}

/**
 * Powers the "internal links you could add" panel in the editor sidebar —
 * a full-text search against already-published posts, keyed off whatever
 * title the author is currently writing.
 */
export async function findLinkableRelatedPosts(query: string, excludePostId?: string) {
  const user = await requireStaff();
  if (!user) return [];

  const tsQuery = buildPrefixTsQuery(query);
  if (!tsQuery) return [];

  return prisma.$queryRaw<{ id: string; title: string; slug: string }[]>`
    SELECT p.id, p.title, p.slug
    FROM "posts" p
    WHERE p."deletedAt" IS NULL
      AND p."status" = ${PostStatus.PUBLISHED}::"PostStatus"
      ${excludePostId ? Prisma.sql`AND p.id != ${excludePostId}` : Prisma.empty}
      AND p."searchVector" @@ to_tsquery('english', ${tsQuery})
    ORDER BY ts_rank(p."searchVector", to_tsquery('english', ${tsQuery})) DESC
    LIMIT 5
  `;
}
