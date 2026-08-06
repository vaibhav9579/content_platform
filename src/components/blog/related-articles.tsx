import { PostCard } from "@/components/blog/post-card";
import type { PublicPostListItem } from "@/features/posts/queries/get-posts";

export function RelatedArticles({ posts }: { posts: PublicPostListItem[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="not-prose my-12" aria-labelledby="related-heading">
      <h2 id="related-heading" className="mb-6 text-2xl font-semibold tracking-tight">
        Related Articles
      </h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
