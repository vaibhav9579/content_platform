import type { Metadata } from "next";

import { getPosts, type PostListFilter } from "@/features/posts/queries/get-posts";
import { siteConfig } from "@/config/site";
import { PostCard } from "@/components/blog/post-card";
import { PostFilterBar } from "@/components/blog/post-filter-bar";
import { PostPagination } from "@/components/blog/pagination";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "All Articles",
  description: `Every article published on ${siteConfig.name} — tutorials, guides, and deep dives.`,
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage({
  searchParams,
}: PageProps<"/blog">) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const sort = (sp.sort as PostListFilter["sort"]) || "newest";
  const featured = sp.featured === "1" ? true : undefined;

  const { posts, total, totalPages } = await getPosts({ sort, page, featured });

  return (
    <div className="container-wide py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">All Articles</h1>
        <p className="text-muted-foreground mt-2">
          Every tutorial, guide, and deep dive — {total} and counting.
        </p>
      </header>

      <div className="mb-8">
        <PostFilterBar total={total} />
      </div>

      <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-muted-foreground py-20 text-center">No articles published yet.</p>
      )}

      <PostPagination page={page} totalPages={totalPages} basePath="/blog" searchParams={{ sort }} />
    </div>
  );
}
