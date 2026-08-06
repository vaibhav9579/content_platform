import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import type { PublicPostListItem } from "@/features/posts/queries/get-posts";

export function HeroSection({ posts }: { posts: PublicPostListItem[] }) {
  const [lead, ...rest] = posts;
  if (!lead) return null;

  return (
    <section className="container-wide grid gap-8 py-10 lg:grid-cols-[1.4fr_1fr] lg:py-16">
      <Link href={`/blog/${lead.slug}`} className="group block animate-fade-up">
        <div className="bg-muted relative aspect-[16/10] overflow-hidden rounded-2xl">
          {lead.coverImageUrl && (
            <Image
              src={lead.coverImageUrl}
              alt={lead.coverImageAlt ?? lead.title}
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          )}
        </div>
        <div className="mt-5">
          {lead.category && (
            <Badge variant="secondary" className="mb-2">
              {lead.category.name}
            </Badge>
          )}
          <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight transition-colors group-hover:underline md:text-4xl">
            {lead.title}
          </h1>
          {lead.excerpt && (
            <p className="text-muted-foreground mt-3 line-clamp-2 text-lg leading-relaxed">{lead.excerpt}</p>
          )}
          <div className="mt-4 flex items-center gap-2.5">
            <Avatar className="size-7">
              <AvatarImage src={lead.author.avatarUrl ?? undefined} />
              <AvatarFallback>{lead.author.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-sm">
              {lead.author.name}
              {lead.publishedAt && <> · {formatDate(lead.publishedAt)}</>}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-6 divide-y">
        {rest.slice(0, 4).map((post, i) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex items-start gap-4 pt-6 first:pt-0"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="text-muted-foreground/40 font-serif text-3xl leading-none">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              {post.category && (
                <span className="text-primary text-xs font-semibold tracking-wide uppercase">
                  {post.category.name}
                </span>
              )}
              <h3 className="mt-1 line-clamp-2 text-base leading-snug font-medium transition-colors group-hover:underline">
                {post.title}
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                {post.publishedAt && formatDate(post.publishedAt)}
                {post.readingTimeMinutes && <> · {post.readingTimeMinutes} min</>}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
