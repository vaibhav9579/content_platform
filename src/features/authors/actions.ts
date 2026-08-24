"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaff, canManageSettings } from "@/lib/auth";
import { authorInputSchema, type AuthorInput } from "@/lib/validations";
import { ensureUniqueSlug } from "@/lib/content/slug";

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

const PAGE_SIZE = 20;

export async function getAuthors(page = 1) {
  const currentPage = Math.max(1, page);
  const [authors, totalCount] = await Promise.all([
    prisma.author.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: "asc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.author.count(),
  ]);
  return { authors, totalCount, page: currentPage, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) };
}

export async function getAuthorBySlug(slug: string) {
  return prisma.author.findUnique({ where: { slug } });
}

export async function saveAuthor(raw: AuthorInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!canManageSettings(user.role)) return { success: false, error: "Only admins can manage authors." };

  const parsed = authorInputSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const input = parsed.data;

  const slug = await ensureUniqueSlug(
    input.slug || input.name,
    async (candidate) => {
      const existing = await prisma.author.findUnique({ where: { slug: candidate } });
      return !!existing && existing.id !== input.id;
    },
    input.id ? input.slug : undefined,
  );

  const data = {
    userId: input.userId || null,
    name: input.name,
    slug,
    bio: input.bio || null,
    avatarUrl: input.avatarUrl || null,
    coverUrl: input.coverUrl || null,
    title: input.title || null,
    experience: input.experience || null,
    location: input.location || null,
    websiteUrl: input.websiteUrl || null,
    twitterUrl: input.twitterUrl || null,
    linkedinUrl: input.linkedinUrl || null,
    githubUrl: input.githubUrl || null,
    youtubeUrl: input.youtubeUrl || null,
    isVerified: input.isVerified,
    featured: input.featured,
  };

  const author = input.id
    ? await prisma.author.update({ where: { id: input.id }, data })
    : await prisma.author.create({ data });

  revalidatePath("/admin/authors");
  revalidatePath(`/author/${author.slug}`);
  return { success: true, data: { id: author.id } };
}

export async function deleteAuthor(id: string): Promise<ActionResult> {
  const user = await requireStaff();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!canManageSettings(user.role)) return { success: false, error: "Only admins can manage authors." };

  const postCount = await prisma.post.count({ where: { authorId: id } });
  if (postCount > 0) {
    return { success: false, error: `Cannot delete: ${postCount} post(s) still reference this author.` };
  }

  await prisma.author.delete({ where: { id } });
  revalidatePath("/admin/authors");
  return { success: true, data: undefined };
}
