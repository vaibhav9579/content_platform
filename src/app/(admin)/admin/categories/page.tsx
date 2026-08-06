import type { Metadata } from "next";

import { getCategories } from "@/features/categories/actions";
import { CategoryManager } from "@/components/admin/categories/category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-muted-foreground text-sm">
          Organize articles into unlimited, nestable categories.
        </p>
      </div>
      <CategoryManager categories={JSON.parse(JSON.stringify(categories))} />
    </div>
  );
}
