import { NextResponse } from "next/server";
import { PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { searchRateLimit, getRequestIdentifier } from "@/lib/rate-limit";

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

  const [posts, categories, tags, authors] = await Promise.all([
    prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, slug: true, coverImageUrl: true },
      take: 6,
    }),
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

  return NextResponse.json({ posts, categories, tags, authors });
}
