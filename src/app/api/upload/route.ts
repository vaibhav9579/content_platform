import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { uploadRateLimit } from "@/lib/rate-limit";
import { saveUploadedFile } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

function mediaTypeFromMime(mime: string): MediaType {
  if (mime.startsWith("video/")) return MediaType.VIDEO;
  if (mime.startsWith("audio/")) return MediaType.AUDIO;
  if (mime.startsWith("image/")) return MediaType.IMAGE;
  return MediaType.DOCUMENT;
}

/**
 * Server-side upload proxy: saves uploaded files directly to the Droplet disk
 * under public/uploads and records metadata in PostgreSQL.
 */
export async function POST(req: Request) {
  const user = await requireStaff();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success: withinLimit } = await uploadRateLimit.check(user.id);
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many uploads — please slow down." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const folder = (formData.get("folder") as string) || "uploads";
  const altText = (formData.get("altText") as string) || undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 15MB limit" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await saveUploadedFile(buffer, file.name, file.type, folder);

    const media = await prisma.media.create({
      data: {
        publicId: result.publicId,
        url: result.url,
        secureUrl: result.secureUrl,
        type: mediaTypeFromMime(file.type),
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        altText,
        folder,
        uploadedById: user.id,
      },
    });

    return NextResponse.json({ media });
  } catch (err) {
    console.error("Local file upload failed:", err);
    return NextResponse.json(
      { error: "Failed to save file to local storage. Please try again." },
      { status: 500 },
    );
  }
}
