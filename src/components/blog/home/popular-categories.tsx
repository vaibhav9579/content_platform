import Link from "next/link";
import * as Icons from "lucide-react";

export function PopularCategories({
  categories,
}: {
  categories: { id: string; name: string; slug: string; iconName: string | null; _count: { posts: number } }[];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="container-wide py-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Popular Categories</h2>
        <Link href="/category" className="text-primary text-sm font-medium hover:underline">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => {
          const Icon =
            (category.iconName && (Icons as unknown as Record<string, Icons.LucideIcon>)[category.iconName]) ||
            Icons.FolderIcon;
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="bg-muted/30 hover:border-foreground/20 hover:bg-muted/60 flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-colors"
            >
              <Icon className="text-muted-foreground size-5" />
              <span className="text-sm font-medium">{category.name}</span>
              <span className="text-muted-foreground text-xs">{category._count.posts} articles</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
