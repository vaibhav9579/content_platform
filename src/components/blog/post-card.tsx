import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import type { PublicPostListItem } from "@/features/posts/queries/get-posts";
import { cn } from "@/lib/utils";

export function PostCard({ post, size = "default" }: { post: PublicPostListItem; size?: "default" | "large" }) {
  return (
    <article className="group flex flex-col gap-3">
      <Link
        href={`/blog/${post.slug}`}
        className={cn(
          "bg-muted relative block overflow-hidden rounded-xl",
          size === "large" ? "aspect-[16/10]" : "aspect-video",
        )}
      >
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? post.title}
            fill
            sizes={size === "large" ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
            className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="from-muted to-muted/50 flex size-full items-center justify-center bg-gradient-to-br">
            <span className="text-muted-foreground font-serif text-lg">{post.title.slice(0, 1)}</span>
          </div>
        )}
      </Link>

      <div className="space-y-2">
        {post.category && (
          <Link
            href={`/category/${post.category.slug}`}
            className="text-primary text-xs font-semibold tracking-wide uppercase hover:underline"
          >
            {post.category.name}
          </Link>
        )}
        <Link href={`/blog/${post.slug}`}>
          <h3
            className={cn(
              "text-balance font-serif font-semibold tracking-tight transition-colors group-hover:underline",
              size === "large" ? "text-2xl md:text-3xl" : "text-lg",
            )}
          >
            {post.title}
          </h3>
        </Link>
        {post.excerpt && (
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{post.excerpt}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Avatar className="size-6">
            <AvatarImage src={post.author.avatarUrl ?? undefined} />
            <AvatarFallback>{post.author.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground text-xs">
            {post.author.name}
            {post.publishedAt && <> · {formatDate(post.publishedAt)}</>}
            {post.readingTimeMinutes && <> · {post.readingTimeMinutes} min read</>}
          </span>
        </div>
      </div>
    </article>
  );
}

export function PostCardCompact({ post }: { post: PublicPostListItem }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex items-center gap-3">
      <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg">
        {post.coverImageUrl && (
          <Image src={post.coverImageUrl} alt={post.title} fill sizes="64px" className="object-contain" />
        )}
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-medium group-hover:underline">{post.title}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {post.publishedAt && formatDate(post.publishedAt)}
        </p>
      </div>
    </Link>
  );
}

export function TrendingBadgeList({ posts }: { posts: PublicPostListItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {posts.map((post) => (
        <Badge key={post.id} variant="outline" asChild>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </Badge>
      ))}
    </div>
  );
}
