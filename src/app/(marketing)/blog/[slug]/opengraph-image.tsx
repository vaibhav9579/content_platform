import fs from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

export const alt = "Article cover image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug, deletedAt: null },
    select: { title: true, category: { select: { name: true } }, author: { select: { name: true } } },
  });
  const logoData = await fs.readFile(path.join(process.cwd(), "public", siteConfig.logo));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #0d0d10 0%, #1a1a22 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            background: "white",
            borderRadius: 12,
            padding: "10px 18px",
            alignSelf: "flex-start",
          }}
        >
          <img src={logoSrc} width={180} height={59} alt={siteConfig.name} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {post?.category && (
            <div style={{ display: "flex", fontSize: 26, color: "#a78bfa", fontWeight: 600 }}>
              {post.category.name.toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>
            {post?.title ?? siteConfig.name}
          </div>
          {post?.author && (
            <div style={{ display: "flex", fontSize: 26, opacity: 0.7, marginTop: 8 }}>By {post.author.name}</div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
