import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getTagBySlug } from "@/features/tags/queries";
import { getPosts, type PostListFilter } from "@/features/posts/queries/get-posts";
import { PostCard } from "@/components/blog/post-card";
import { PostFilterBar } from "@/components/blog/post-filter-bar";
import { PostPagination } from "@/components/blog/pagination";
import { Breadcrumbs } from "@/components/blog/breadcrumbs";

export const revalidate = 1800;

export async function generateMetadata({ params }: PageProps<"/tag/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { robots: { index: false, follow: false } };
  return {
    title: `#${tag.name}`,
    description: tag.description || `Articles tagged with ${tag.name}`,
    alternates: { canonical: `/tag/${tag.slug}` },
  };
}

export default async function TagPage({ params, searchParams }: PageProps<"/tag/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const page = Number(sp.page) || 1;
  const sort = (sp.sort as PostListFilter["sort"]) || "newest";
  const { posts, total, totalPages } = await getPosts({ tagSlug: slug, sort, page });

  return (
    <div className="container-wide py-12">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: `#${tag.name}`, href: `/tag/${tag.slug}` }]} />

      <header className="mt-4 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">#{tag.name}</h1>
        {tag.description && <p className="text-muted-foreground mt-2">{tag.description}</p>}
      </header>

      <div className="my-8">
        <PostFilterBar total={total} />
      </div>

      <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {posts.length === 0 && <p className="text-muted-foreground py-20 text-center">No articles tagged yet.</p>}

      <PostPagination page={page} totalPages={totalPages} basePath={`/tag/${slug}`} searchParams={{ sort }} />
    </div>
  );
}
