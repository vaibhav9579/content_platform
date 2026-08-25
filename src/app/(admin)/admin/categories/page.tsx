import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireStaff, canManageAllPosts } from "@/lib/auth";
import { getCategories, getAllCategoryOptions } from "@/features/categories/actions";
import { CategoryManager } from "@/components/admin/categories/category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const user = await requireStaff();
  if (!user || !canManageAllPosts(user.role)) redirect("/admin/dashboard");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ categories, totalCount, totalPages, pageSize }, allCategoryOptions] = await Promise.all([
    getCategories(page),
    getAllCategoryOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-muted-foreground text-sm">
          Organize articles into unlimited, nestable categories.
        </p>
      </div>
      <CategoryManager
        categories={JSON.parse(JSON.stringify(categories))}
        allCategoryOptions={allCategoryOptions}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  );
}
