"use server";

import { revalidatePath } from "next/cache";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { canManageSettings, requireStaff } from "@/lib/auth";
import { siteSettingsSchema, type SiteSettingsInput } from "@/lib/validations";
import { siteConfig } from "@/config/site";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export const getSiteSettings = cache(async () => {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (settings) return settings;

  return prisma.siteSettings.create({
    data: {
      id: "singleton",
      siteName: siteConfig.name,
      siteDescription: siteConfig.description,
      siteUrl: siteConfig.url,
    },
  });
});

export async function updateSiteSettings(raw: SiteSettingsInput): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!canManageSettings(user.role)) return { success: false, error: "Only admins can edit settings." };

  const parsed = siteSettingsSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}
