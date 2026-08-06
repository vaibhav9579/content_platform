import { NextResponse } from "next/server";
import { PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { searchRateLimit, getRequestIdentifier } from "@/lib/rate-limit";
import { buildPrefixTsQuery } from "@/lib/search/full-text-query";

export async function GET(req: Request) {
  const identifier = await getRequestIdentifier();
  const { success: withinLimit } = await searchRateLimit.check(identifier);
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many searches — please slow down." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ posts: [], categories: [], tags: [], authors: [] });
  }

  const tsQuery = buildPrefixTsQuery(q);

  const [postRows, categories, tags, authors] = await Promise.all([
    tsQuery
      ? prisma.$queryRaw<{ id: string; title: string; slug: string; coverImageUrl: string | null }[]>`
          SELECT p.id, p.title, p.slug, p."coverImageUrl"
          FROM "posts" p
          WHERE p."deletedAt" IS NULL
            AND p."status" = ${PostStatus.PUBLISHED}::"PostStatus"
            AND p."searchVector" @@ to_tsquery('english', ${tsQuery})
          ORDER BY ts_rank(p."searchVector", to_tsquery('english', ${tsQuery})) DESC
          LIMIT 6
        `
      : Promise.resolve([]),
    prisma.category.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: 4,
    }),
    prisma.tag.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: 4,
    }),
    prisma.author.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, slug: true, avatarUrl: true },
      take: 4,
    }),
  ]);

  return NextResponse.json({ posts: postRows, categories, tags, authors });
}
