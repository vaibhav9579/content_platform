import imageCompression from "browser-image-compression";

// Vector (SVG) and animated (GIF) images can't go through canvas-based
// compression without destroying what makes them work — SVG would get
// rasterized, GIF would lose every frame but the first.
const COMPRESSIBLE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);

// Below this, recompressing costs more (CPU + quality loss) than it saves.
const SKIP_BELOW_BYTES = 200 * 1024;

export type CompressionResult = {
  file: File;
  didCompress: boolean;
  originalBytes: number;
  finalBytes: number;
};

/**
 * Resizes (max 2560px on the longest side) and compresses an image in the
 * browser before it's uploaded, so large phone/camera photos don't take
 * forever to upload or eat into the 15MB request limit. Runs in a Web
 * Worker so it doesn't block the editor UI.
 */
export async function compressImageIfNeeded(file: File): Promise<CompressionResult> {
  if (!COMPRESSIBLE_TYPES.has(file.type) || file.size < SKIP_BELOW_BYTES) {
    return { file, didCompress: false, originalBytes: file.size, finalBytes: file.size };
  }

  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 2560,
      maxSizeMB: 1.5,
      useWebWorker: true,
      initialQuality: 0.82,
      fileType: file.type,
    });

    // browser-image-compression can occasionally hand back a slightly
    // larger file for already-efficient images — keep whichever is smaller.
    if (compressed.size >= file.size) {
      return { file, didCompress: false, originalBytes: file.size, finalBytes: file.size };
    }

    const result = new File([compressed], file.name, { type: file.type });
    return { file: result, didCompress: true, originalBytes: file.size, finalBytes: result.size };
  } catch {
    // Compression is a nice-to-have — never block the actual upload on it.
    return { file, didCompress: false, originalBytes: file.size, finalBytes: file.size };
  }
}
