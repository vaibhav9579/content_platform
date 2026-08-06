import "server-only";

import { PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getPosts, publicSelect } from "@/features/posts/queries/get-posts";

export async function getHomepageData() {
  const [featured, trending, latest, editorsPick, popularCategories] = await Promise.all([
    getPosts({ featured: true, pageSize: 5 }),
    getPosts({ sort: "trending", pageSize: 5 }),
    getPosts({ sort: "newest", pageSize: 9 }),
    prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED, isPinned: true, deletedAt: null },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: publicSelect,
    }),
    prisma.category.findMany({
      where: { posts: { some: { status: PostStatus.PUBLISHED, deletedAt: null } } },
      orderBy: { posts: { _count: "desc" } },
      take: 6,
      select: { id: true, name: true, slug: true, iconName: true, _count: { select: { posts: true } } },
    }),
  ]);

  return {
    featured: featured.posts,
    trending: trending.posts,
    latest: latest.posts,
    editorsPick,
    popularCategories,
  };
}
