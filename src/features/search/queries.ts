import "server-only";

import { prisma } from "@/lib/prisma";

export async function searchTaxonomy(query: string) {
  if (query.trim().length < 2) return { categories: [], tags: [], authors: [] };

  const [categories, tags, authors] = await Promise.all([
    prisma.category.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: 5,
    }),
    prisma.tag.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: 5,
    }),
    prisma.author.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true, slug: true, avatarUrl: true },
      take: 5,
    }),
  ]);

  return { categories, tags, authors };
}
