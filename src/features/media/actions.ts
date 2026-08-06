"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export async function getMedia(opts: { folder?: string; trashed?: boolean } = {}) {
  return prisma.media.findMany({
    where: {
      deletedAt: opts.trashed ? { not: null } : null,
      ...(opts.folder ? { folder: opts.folder } : {}),
    },
    orderBy: opts.trashed ? { deletedAt: "desc" } : { createdAt: "desc" },
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

/** Moves a media asset to trash. The Cloudinary asset is left untouched until permanent delete. */
export async function deleteMedia(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return { success: false, error: "Media not found" };

  await prisma.media.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/media");
  return { success: true, data: undefined };
}

export async function restoreMedia(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  await prisma.media.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath("/admin/media");
  return { success: true, data: undefined };
}

/** Irreversibly deletes a trashed media asset from Cloudinary and the database. */
export async function permanentlyDeleteMedia(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return { success: false, error: "Media not found" };
  if (!media.deletedAt) {
    return { success: false, error: "Move the asset to trash before deleting it permanently." };
  }

  await cloudinary.uploader.destroy(media.publicId).catch((err) => {
    console.error("Cloudinary destroy failed", err);
  });
  await prisma.media.delete({ where: { id } });

  revalidatePath("/admin/media");
  return { success: true, data: undefined };
}
