import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { getCategoryBySlug } from "@/features/categories/queries";
import { getPosts, type PostListFilter } from "@/features/posts/queries/get-posts";
import { PostCard } from "@/components/blog/post-card";
import { PostFilterBar } from "@/components/blog/post-filter-bar";
import { PostPagination } from "@/components/blog/pagination";
import { Breadcrumbs } from "@/components/blog/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo/schema";

export const revalidate = 1800;

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { robots: { index: false, follow: false } };
  return {
    title: category.metaTitle || category.name,
    description: category.metaDescription || category.description || `Articles in ${category.name}`,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Number(sp.page) || 1;
  const sort = (sp.sort as PostListFilter["sort"]) || "newest";
  const { posts, total, totalPages } = await getPosts({ categorySlug: slug, sort, page });

  return (
    <div className="container-wide py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Categories", url: "/category" },
          { name: category.name, url: `/category/${category.slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Categories", href: "/category" },
          { name: category.name, href: `/category/${category.slug}` },
        ]}
      />

      <header className="mt-4 max-w-2xl">
        {category.children.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {category.children.map((child) => (
              <Badge key={child.id} variant="outline" asChild>
                <Link href={`/category/${child.slug}`}>{child.name}</Link>
              </Badge>
            ))}
          </div>
        )}
        <h1 className="font-serif text-4xl font-semibold tracking-tight">{category.name}</h1>
        {category.description && <p className="text-muted-foreground mt-2">{category.description}</p>}
      </header>

      <div className="my-8">
        <PostFilterBar total={total} />
      </div>

      <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-muted-foreground py-20 text-center">No articles in this category yet.</p>
      )}

      <PostPagination page={page} totalPages={totalPages} basePath={`/category/${slug}`} searchParams={{ sort }} />
    </div>
  );
}
