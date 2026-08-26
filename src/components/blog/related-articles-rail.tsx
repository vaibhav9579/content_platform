import Image from "next/image";
import Link from "next/link";

import type { PublicPostListItem } from "@/features/posts/queries/get-posts";

/**
 * Compact "keep reading" rail shown alongside the article body — surfaces
 * related posts while the reader is still scrolling, instead of only at
 * the very bottom of the page where most readers never reach.
 */
export function RelatedArticlesRail({ posts }: { posts: PublicPostListItem[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Related Articles</p>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group flex gap-3">
              <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
                {post.coverImageUrl && (
                  <Image
                    src={post.coverImageUrl}
                    alt={post.coverImageAlt ?? post.title}
                    fill
                    sizes="56px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <div className="min-w-0">
                {post.category && (
                  <p className="text-primary text-[11px] font-semibold tracking-wide uppercase">
                    {post.category.name}
                  </p>
                )}
                <p className="line-clamp-2 text-sm font-medium group-hover:underline">{post.title}</p>
                {post.readingTimeMinutes && (
                  <p className="text-muted-foreground mt-0.5 text-xs">{post.readingTimeMinutes} min read</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
