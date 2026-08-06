import "server-only";

import { Prisma, PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { buildPrefixTsQuery } from "@/lib/search/full-text-query";

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

export const publicSelect = {
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

  if (search) {
    return searchPostsFullText({ search, status, categorySlug, tagSlug, authorSlug, featured, page, pageSize });
  }

  const where: Prisma.PostWhereInput = {
    deletedAt: null,
    status: Array.isArray(status) ? { in: status } : status,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
    ...(authorSlug ? { author: { slug: authorSlug } } : {}),
    ...(typeof featured === "boolean" ? { isFeatured: featured } : {}),
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

/**
 * Postgres full-text search over the generated `searchVector` column
 * (title/subtitle/excerpt weighted above body content — see the
 * add_fulltext_search migration), ranked with `ts_rank` and prefix-matched
 * so "secur" finds "security". Runs as raw SQL because tsvector/tsquery
 * aren't representable in Prisma's query builder; the rest of the filters
 * are still parameterized through Prisma.sql, so there's no string-built
 * SQL anywhere in this query.
 */
async function searchPostsFullText({
  search,
  status,
  categorySlug,
  tagSlug,
  authorSlug,
  featured,
  page,
  pageSize,
}: {
  search: string;
  status: PostStatus | PostStatus[];
  categorySlug?: string;
  tagSlug?: string;
  authorSlug?: string;
  featured?: boolean;
  page: number;
  pageSize: number;
}) {
  const tsQuery = buildPrefixTsQuery(search);
  if (!tsQuery) {
    return { posts: [], total: 0, page, pageSize, totalPages: 1 };
  }

  const statusCondition = Array.isArray(status)
    ? Prisma.sql`p."status" = ANY(${status}::"PostStatus"[])`
    : Prisma.sql`p."status" = ${status}::"PostStatus"`;

  const conditions: Prisma.Sql[] = [
    Prisma.sql`p."deletedAt" IS NULL`,
    statusCondition,
    Prisma.sql`p."searchVector" @@ to_tsquery('english', ${tsQuery})`,
  ];
  if (categorySlug) {
    conditions.push(Prisma.sql`c."slug" = ${categorySlug}`);
  }
  if (authorSlug) {
    conditions.push(Prisma.sql`a."slug" = ${authorSlug}`);
  }
  if (tagSlug) {
    conditions.push(
      Prisma.sql`EXISTS (
        SELECT 1 FROM "_PostToTag" pt
        JOIN "tags" t ON t.id = pt."B"
        WHERE pt."A" = p.id AND t.slug = ${tagSlug}
      )`,
    );
  }
  if (typeof featured === "boolean") {
    conditions.push(Prisma.sql`p."isFeatured" = ${featured}`);
  }

  const whereSql = Prisma.join(conditions, " AND ");
  const fromSql = Prisma.sql`
    FROM "posts" p
    LEFT JOIN "categories" c ON c.id = p."categoryId"
    LEFT JOIN "authors" a ON a.id = p."authorId"
    WHERE ${whereSql}
  `;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`
      SELECT p.id
      ${fromSql}
      ORDER BY ts_rank(p."searchVector", to_tsquery('english', ${tsQuery})) DESC, p."publishedAt" DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      ${fromSql}
    `,
  ]);

  const orderedIds = rows.map((r) => r.id);
  const total = Number(countRows[0]?.count ?? 0);

  if (orderedIds.length === 0) {
    return { posts: [], total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  const unordered = await prisma.post.findMany({
    where: { id: { in: orderedIds } },
    select: publicSelect,
  });
  const byId = new Map(unordered.map((p) => [p.id, p]));
  const posts = orderedIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);

  return { posts, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPostBySlug(slug: string, opts: { includeDraft?: boolean } = {}) {
  return prisma.post.findFirst({
    where: {
      slug,
      deletedAt: null,
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
      deletedAt: null,
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
      where: {
        status: PostStatus.PUBLISHED,
        deletedAt: null,
        publishedAt: { lt: publishedAt },
        id: { not: currentId },
      },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true, coverImageUrl: true },
    }),
    prisma.post.findFirst({
      where: {
        status: PostStatus.PUBLISHED,
        deletedAt: null,
        publishedAt: { gt: publishedAt },
        id: { not: currentId },
      },
      orderBy: { publishedAt: "asc" },
      select: { slug: true, title: true, coverImageUrl: true },
    }),
  ]);
  return { previous, next };
}

export type PublicPostListItem = Awaited<ReturnType<typeof getPosts>>["posts"][number];
