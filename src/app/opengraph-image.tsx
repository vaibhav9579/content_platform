import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "linear-gradient(135deg, #0d0d10 0%, #1a1a22 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, letterSpacing: -1 }}>{siteConfig.name}</div>
        <div style={{ display: "flex", fontSize: 30, opacity: 0.7, maxWidth: 800, textAlign: "center" }}>
          {siteConfig.description}
        </div>
      </div>
    ),
    { ...size },
  );
}
