"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaff, canManageAllPosts } from "@/lib/auth";
import { bannerInputSchema, type BannerInput } from "@/lib/validations";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export async function getBanners() {
  const user = await requireStaff();
  if (!user || !canManageAllPosts(user.role)) return [];

  return prisma.banner.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
}

/** Public — active banners within their optional schedule window, for the homepage hero. */
export async function getActiveBanners() {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
}

export async function saveBanner(raw: BannerInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!canManageAllPosts(user.role)) return { success: false, error: "Only editors and admins can manage banners." };

  const parsed = bannerInputSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const input = parsed.data;

  const data = {
    title: input.title || null,
    subtitle: input.subtitle || null,
    imageUrl: input.imageUrl,
    imageAlt: input.imageAlt || null,
    linkUrl: input.linkUrl || null,
    ctaLabel: input.ctaLabel || null,
    order: input.order,
    isActive: input.isActive,
    startAt: input.startAt ? new Date(input.startAt) : null,
    endAt: input.endAt ? new Date(input.endAt) : null,
  };

  const banner = input.id
    ? await prisma.banner.update({ where: { id: input.id }, data })
    : await prisma.banner.create({ data });

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true, data: { id: banner.id } };
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!canManageAllPosts(user.role)) return { success: false, error: "Only editors and admins can manage banners." };

  await prisma.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true, data: undefined };
}
