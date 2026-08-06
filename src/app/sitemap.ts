import type { MetadataRoute } from "next";
import { PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags, authors] = await Promise.all([
    prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      select: { slug: true, updatedAtCms: true, coverImageUrl: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.tag.findMany({ select: { slug: true } }),
    prisma.author.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/blog`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteConfig.url}/category`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteConfig.url}/author`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteConfig.url}/search`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: post.updatedAtCms,
    changeFrequency: "weekly",
    priority: 0.8,
    ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteConfig.url}/category/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${siteConfig.url}/tag/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  const authorRoutes: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${siteConfig.url}/author/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes, ...authorRoutes];
}
