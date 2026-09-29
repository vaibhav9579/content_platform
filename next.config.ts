import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],

  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 90],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "i.ytimg.com" },
      // Demo/seed content only — real deployments serve all imagery through
      // Cloudinary; remove these once seed data is replaced with real uploads.
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/(.*)\\.(js|css|woff2|avif|webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  async redirects() {
    return [];
  },

  async rewrites() {
    // IndexNow verification: the protocol requires the key to be served
    // literally at /{key}.txt at the site root. Only rewrites when
    // INDEXNOW_KEY is set, and only for that exact filename — nothing
    // else about the site's routing/404 behavior is affected.
    const key = process.env.INDEXNOW_KEY;
    if (!key) return [];
    return [{ source: `/${key}.txt`, destination: "/api/indexnow-key" }];
  },
};

export default nextConfig;
