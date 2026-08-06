import Link from "next/link";
import type { Metadata } from "next";
import { FolderIcon } from "lucide-react";

import { getPublicCategories } from "@/features/categories/queries";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse every category of articles.",
  alternates: { canonical: "/category" },
};

export default async function CategoriesPage() {
  const categories = await getPublicCategories();
  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="container-wide py-12">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Categories</h1>
      <p className="text-muted-foreground mt-2">Explore articles by topic.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topLevel.map((category) => (
          <Link key={category.id} href={`/category/${category.slug}`}>
            <Card className="hover:border-foreground/20 h-full transition-colors">
              <CardContent className="flex items-center gap-3 pt-5 pb-5">
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <FolderIcon className="text-muted-foreground size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{category.name}</p>
                  <p className="text-muted-foreground text-xs">{category._count.posts} articles</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
