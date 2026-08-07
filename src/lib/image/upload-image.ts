import { compressImageIfNeeded } from "@/lib/image/compress-image";

export type UploadedMedia = {
  secureUrl: string;
  altText: string | null;
};

/** Compresses (if it makes sense to) then uploads an image file to `/api/upload`. */
export async function uploadImage(file: File, folder: string): Promise<UploadedMedia> {
  const { file: uploadFile } = await compressImageIfNeeded(file);

  const formData = new FormData();
  formData.append("file", uploadFile);
  formData.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return { secureUrl: json.media.secureUrl, altText: json.media.altText ?? null };
}
