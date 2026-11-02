import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { imageSize } from "image-size";

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number | null;
  height: number | null;
  bytes: number;
}

/**
 * Sanitizes a filename: keeps alphanumerics, dots, hyphens, underscores.
 */
function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const nameWithoutExt = path.basename(filename, ext);
  const cleanName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  
  const shortId = crypto.randomBytes(4).toString("hex");
  return `${cleanName || "upload"}-${shortId}${ext}`;
}

/**
 * Saves a file buffer locally on the Droplet filesystem.
 * Files are saved to `public/uploads/YYYY/MM/filename.ext`.
 */
export async function saveUploadedFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  _folder?: string
): Promise<UploadResult> {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const targetDir = path.join(/*turbopackIgnore: true*/ UPLOAD_ROOT, year, month);
  await fs.mkdir(targetDir, { recursive: true });

  const safeFilename = sanitizeFilename(originalFilename);
  const targetFilePath = path.join(targetDir, safeFilename);

  await fs.writeFile(targetFilePath, buffer);

  // Measure dimensions if image
  let width: number | null = null;
  let height: number | null = null;
  try {
    const dimensions = imageSize(buffer);
    if (dimensions.width) width = dimensions.width;
    if (dimensions.height) height = dimensions.height;
  } catch {
    // Non-image or unparsable format (e.g. some SVGs) — leave as null
  }

  const ext = path.extname(safeFilename).replace(/^\./, "").toLowerCase();
  const relativePath = `/uploads/${year}/${month}/${safeFilename}`;
  const publicId = `uploads/${year}/${month}/${safeFilename}`;

  return {
    publicId,
    url: relativePath,
    secureUrl: relativePath,
    format: ext || mimeType.split("/")[1] || "bin",
    width,
    height,
    bytes: buffer.length,
  };
}

/**
 * Deletes a previously uploaded file from the Droplet local disk.
 * Guards against path-traversal attacks.
 */
export async function deleteUploadedFile(publicId: string): Promise<boolean> {
  try {
    // Strip leading slashes to prevent root-relative path resolution
    const cleanPublicId = publicId.replace(/^[/\\]+/, "");
    
    // Resolve relative to public folder
    const targetPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "public", cleanPublicId);
    const resolvedUploadRoot = path.resolve(/*turbopackIgnore: true*/ UPLOAD_ROOT);

    // Security check: ensure path stays within UPLOAD_ROOT
    if (!targetPath.startsWith(resolvedUploadRoot)) {
      console.warn(`Attempted path traversal deletion: ${publicId}`);
      return false;
    }

    await fs.unlink(targetPath);
    return true;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      // File already removed or never existed
      return true;
    }
    console.error("Failed to delete local file:", err);
    return false;
  }
}
