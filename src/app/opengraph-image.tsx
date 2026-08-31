import fs from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "linear-gradient(135deg, #0d0d10 0%, #1a1a22 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            background: "white",
            borderRadius: 24,
            padding: "24px 40px",
          }}
        >
          <img src={logoSrc} width={480} height={157} alt={siteConfig.name} />
        </div>
        <div style={{ display: "flex", fontSize: 30, opacity: 0.7, maxWidth: 800, textAlign: "center" }}>
          {siteConfig.description}
        </div>
      </div>
    ),
    { ...size },
  );
}
