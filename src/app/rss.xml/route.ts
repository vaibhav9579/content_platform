import RSS from "rss";
import { PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: { author: true, category: true },
  });

  const feed = new RSS({
    title: siteConfig.name,
    description: siteConfig.description,
    site_url: siteConfig.url,
    feed_url: `${siteConfig.url}/rss.xml`,
    language: "en",
    pubDate: posts[0]?.publishedAt ?? new Date(),
    ttl: 60,
  });

  for (const post of posts) {
    feed.item({
      title: post.title,
      description: post.excerpt ?? post.metaDescription ?? "",
      url: `${siteConfig.url}/blog/${post.slug}`,
      guid: post.id,
      categories: post.category ? [post.category.name] : [],
      author: post.author.name,
      date: post.publishedAt ?? post.createdAt,
      enclosure: post.coverImageUrl ? { url: post.coverImageUrl } : undefined,
    });
  }

  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
