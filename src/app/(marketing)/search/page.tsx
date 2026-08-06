import Link from "next/link";
import type { Metadata } from "next";
import { FolderIcon, TagIcon, UserIcon } from "lucide-react";

import { getPosts } from "@/features/posts/queries/get-posts";
import { searchTaxonomy } from "@/features/search/queries";
import { SearchBox } from "@/components/blog/search-box";
import { PostCard } from "@/components/blog/post-card";
import { PostPagination } from "@/components/blog/pagination";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const sp = await searchParams;
  const query = (sp.q as string) ?? "";
  const page = Number(sp.page) || 1;

  const [{ posts, total, totalPages }, taxonomy] = await Promise.all([
    query.trim().length >= 2 ? getPosts({ search: query, page }) : Promise.resolve({ posts: [], total: 0, totalPages: 1 }),
    searchTaxonomy(query),
  ]);

  const hasTaxonomyResults = taxonomy.categories.length + taxonomy.tags.length + taxonomy.authors.length > 0;

  return (
    <div className="container-prose max-w-3xl py-12">
      <h1 className="mb-6 text-center font-serif text-3xl font-semibold tracking-tight">Search</h1>
      <SearchBox initialQuery={query} />

      {query.trim().length < 2 ? (
        <p className="text-muted-foreground mt-10 text-center text-sm">
          Start typing to search articles, categories, tags, and authors.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          {hasTaxonomyResults && (
            <div className="flex flex-wrap gap-2">
              {taxonomy.categories.map((c) => (
                <Badge key={c.id} variant="outline" asChild>
                  <Link href={`/category/${c.slug}`}>
                    <FolderIcon className="size-3" /> {c.name}
                  </Link>
                </Badge>
              ))}
              {taxonomy.tags.map((t) => (
                <Badge key={t.id} variant="outline" asChild>
                  <Link href={`/tag/${t.slug}`}>
                    <TagIcon className="size-3" /> {t.name}
                  </Link>
                </Badge>
              ))}
              {taxonomy.authors.map((a) => (
                <Badge key={a.id} variant="outline" asChild>
                  <Link href={`/author/${a.slug}`} className="flex items-center gap-1">
                    <Avatar className="size-3.5">
                      <AvatarImage src={a.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        <UserIcon className="size-2.5" />
                      </AvatarFallback>
                    </Avatar>
                    {a.name}
                  </Link>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <p className="text-muted-foreground mb-6 text-sm">
              {total} result{total === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
            </p>
            <div className="grid max-w-none gap-x-8 gap-y-12 sm:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {posts.length === 0 && (
              <p className="text-muted-foreground py-10 text-center text-sm">
                No articles matched your search.
              </p>
            )}
            <PostPagination page={page} totalPages={totalPages} basePath="/search" searchParams={{ q: query }} />
          </div>
        </div>
      )}
    </div>
  );
}
