import "server-only";

import { PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type SeoIssue =
  | "missing-meta-description"
  | "meta-description-too-long"
  | "missing-cover-image"
  | "missing-cover-alt"
  | "title-too-long"
  | "title-too-short"
  | "missing-category"
  | "no-tags"
  | "missing-faq";

export async function getSeoHealthReport() {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED, deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      metaTitle: true,
      metaDescription: true,
      coverImageUrl: true,
      coverImageAlt: true,
      categoryId: true,
      faq: true,
      tags: { select: { id: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  const report = posts.map((post) => {
    const issues: SeoIssue[] = [];
    const titleLen = (post.metaTitle ?? post.title).length;

    if (!post.metaDescription) issues.push("missing-meta-description");
    else if (post.metaDescription.length > 160) issues.push("meta-description-too-long");

    if (!post.coverImageUrl) issues.push("missing-cover-image");
    else if (!post.coverImageAlt) issues.push("missing-cover-alt");

    if (titleLen > 70) issues.push("title-too-long");
    if (titleLen < 15) issues.push("title-too-short");
    if (!post.categoryId) issues.push("missing-category");
    if (post.tags.length === 0) issues.push("no-tags");
    if (!post.faq || (Array.isArray(post.faq) && post.faq.length === 0)) issues.push("missing-faq");

    return { id: post.id, slug: post.slug, title: post.title, issues };
  });

  const totalIssues = report.reduce((sum, r) => sum + r.issues.length, 0);
  const healthyCount = report.filter((r) => r.issues.length === 0).length;

  return {
    posts: report.filter((r) => r.issues.length > 0).sort((a, b) => b.issues.length - a.issues.length),
    totalPosts: posts.length,
    healthyCount,
    totalIssues,
  };
}
