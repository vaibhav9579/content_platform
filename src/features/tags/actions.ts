"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { tagInputSchema, type TagInput } from "@/lib/validations";
import { ensureUniqueSlug } from "@/lib/content/slug";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export async function getTags() {
  return prisma.tag.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: "asc" },
  });
}

export async function saveTag(raw: TagInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = tagInputSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const input = parsed.data;

  const slug = await ensureUniqueSlug(
    input.slug || input.name,
    async (candidate) => {
      const existing = await prisma.tag.findUnique({ where: { slug: candidate } });
      return !!existing && existing.id !== input.id;
    },
    input.id ? input.slug : undefined,
  );

  const data = { name: input.name, slug, description: input.description || null };
  const tag = input.id
    ? await prisma.tag.update({ where: { id: input.id }, data })
    : await prisma.tag.create({ data });

  revalidatePath("/admin/tags");
  revalidatePath("/tag");
  return { success: true, data: { id: tag.id } };
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/tags");
  return { success: true, data: undefined };
}
