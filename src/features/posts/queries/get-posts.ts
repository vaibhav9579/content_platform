import "server-only";

import { Prisma, PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

export type PostListFilter = {
  status?: PostStatus | PostStatus[];
  categorySlug?: string;
  tagSlug?: string;
  authorSlug?: string;
  featured?: boolean;
  search?: string;
  sort?: "newest" | "oldest" | "trending" | "most-viewed" | "most-shared";
  page?: number;
  pageSize?: number;
};

const publicSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  excerpt: true,
  coverImageUrl: true,
  coverImageAlt: true,
  status: true,
  publishedAt: true,
  updatedAtCms: true,
  readingTimeMinutes: true,
  difficulty: true,
  isFeatured: true,
  isPinned: true,
  viewCount: true,
  likeCount: true,
  clapCount: true,
  shareCount: true,
  bookmarkCount: true,
  author: {
    select: { id: true, name: true, slug: true, avatarUrl: true, title: true },
  },
  category: { select: { id: true, name: true, slug: true, color: true } },
  tags: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.PostSelect;

function buildOrderBy(sort: PostListFilter["sort"]): Prisma.PostOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ publishedAt: "asc" }];
    case "most-viewed":
    case "trending":
      return [{ viewCount: "desc" }, { publishedAt: "desc" }];
    case "most-shared":
      return [{ shareCount: "desc" }, { publishedAt: "desc" }];
    case "newest":
    default:
      return [{ isPinned: "desc" }, { publishedAt: "desc" }];
  }
}

export async function getPosts(filter: PostListFilter = {}) {
  const {
    status = PostStatus.PUBLISHED,
    categorySlug,
    tagSlug,
    authorSlug,
    featured,
    search,
    sort = "newest",
    page = 1,
    pageSize = siteConfig.postsPerPage,
  } = filter;

  const where: Prisma.PostWhereInput = {
    status: Array.isArray(status) ? { in: status } : status,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
    ...(authorSlug ? { author: { slug: authorSlug } } : {}),
    ...(typeof featured === "boolean" ? { isFeatured: featured } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { excerpt: { contains: search, mode: "insensitive" } },
            { subtitle: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: publicSelect,
      orderBy: buildOrderBy(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPostBySlug(slug: string, opts: { includeDraft?: boolean } = {}) {
  return prisma.post.findFirst({
    where: {
      slug,
      ...(opts.includeDraft ? {} : { status: PostStatus.PUBLISHED }),
    },
    include: {
      author: true,
      category: true,
      tags: true,
      relatedTo: { include: { relatedPost: { select: publicSelect } } },
    },
  });
}

export async function getRelatedPosts(post: {
  id: string;
  categoryId: string | null;
  tags: { id: string }[];
}) {
  const curated = await prisma.postRelation.findMany({
    where: { postId: post.id },
    include: { relatedPost: { select: publicSelect } },
    take: 3,
  });
  if (curated.length >= 3) return curated.map((c) => c.relatedPost);

  const algorithmic = await prisma.post.findMany({
    where: {
      id: { not: post.id },
      status: PostStatus.PUBLISHED,
      OR: [
        ...(post.categoryId ? [{ categoryId: post.categoryId }] : []),
        ...(post.tags.length ? [{ tags: { some: { id: { in: post.tags.map((t) => t.id) } } } }] : []),
      ],
    },
    select: publicSelect,
    orderBy: { publishedAt: "desc" },
    take: 3 - curated.length,
  });

  const seen = new Set(curated.map((c) => c.relatedPost.id));
  return [...curated.map((c) => c.relatedPost), ...algorithmic.filter((p) => !seen.has(p.id))];
}

export async function getAdjacentPosts(publishedAt: Date | null, currentId: string) {
  if (!publishedAt) return { previous: null, next: null };
  const [previous, next] = await Promise.all([
    prisma.post.findFirst({
      where: { status: PostStatus.PUBLISHED, publishedAt: { lt: publishedAt }, id: { not: currentId } },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true, coverImageUrl: true },
    }),
    prisma.post.findFirst({
      where: { status: PostStatus.PUBLISHED, publishedAt: { gt: publishedAt }, id: { not: currentId } },
      orderBy: { publishedAt: "asc" },
      select: { slug: true, title: true, coverImageUrl: true },
    }),
  ]);
  return { previous, next };
}

export type PublicPostListItem = Awaited<ReturnType<typeof getPosts>>["posts"][number];
