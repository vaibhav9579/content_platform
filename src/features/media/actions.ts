"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export async function getMedia(folder?: string) {
  return prisma.media.findMany({
    where: folder ? { folder } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function updateMediaAltText(id: string, altText: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  await prisma.media.update({ where: { id }, data: { altText } });
  revalidatePath("/admin/media");
  return { success: true, data: undefined };
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return { success: false, error: "Media not found" };

  await cloudinary.uploader.destroy(media.publicId).catch((err) => {
    console.error("Cloudinary destroy failed", err);
  });
  await prisma.media.delete({ where: { id } });

  revalidatePath("/admin/media");
  return { success: true, data: undefined };
}
