"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { categoryInputSchema, type CategoryInput } from "@/lib/validations";
import { ensureUniqueSlug } from "@/lib/content/slug";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

export async function getCategories() {
  return prisma.category.findMany({
    include: { parent: true, _count: { select: { posts: true, children: true } } },
    orderBy: { name: "asc" },
  });
}

export async function saveCategory(raw: CategoryInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const input = parsed.data;

  if (input.parentId && input.id && input.parentId === input.id) {
    return { success: false, error: "A category cannot be its own parent." };
  }

  const slug = await ensureUniqueSlug(
    input.slug || input.name,
    async (candidate) => {
      const existing = await prisma.category.findUnique({ where: { slug: candidate } });
      return !!existing && existing.id !== input.id;
    },
    input.id ? input.slug : undefined,
  );

  const data = {
    name: input.name,
    slug,
    description: input.description || null,
    parentId: input.parentId || null,
    color: input.color || null,
    iconName: input.iconName || null,
    metaTitle: input.metaTitle || null,
    metaDescription: input.metaDescription || null,
  };

  const category = input.id
    ? await prisma.category.update({ where: { id: input.id }, data })
    : await prisma.category.create({ data });

  revalidatePath("/admin/categories");
  revalidatePath("/category");
  return { success: true, data: { id: category.id } };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };

  // Children are automatically detached (parentId -> null) via the schema's onDelete: SetNull.
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return { success: true, data: undefined };
}
