import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";

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
 * Server-side upload proxy: keeps the Cloudinary API secret off the client
 * and lets us enforce auth, size, and mime-type limits before any bytes
 * reach Cloudinary. Used by the editor's image drop/upload UI and the
 * admin Media Library.
 */
export async function POST(req: Request) {
  const user = await requireStaff();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const folder = (formData.get("folder") as string) || "content-platform/uploads";
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

  const result = await new Promise<import("cloudinary").UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", overwrite: false },
      (error, res) => {
        if (error || !res) return reject(error ?? new Error("Upload failed"));
        resolve(res);
      },
    );
    stream.end(buffer);
  });

  const media = await prisma.media.create({
    data: {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
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
}
