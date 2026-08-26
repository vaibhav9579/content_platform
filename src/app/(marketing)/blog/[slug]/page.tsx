import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { getPostBySlug, getRelatedPosts, getAdjacentPosts } from "@/features/posts/queries/get-posts";
import { getApprovedComments } from "@/features/comments/actions";
import { getCurrentDbUser } from "@/lib/auth";
import { extractToc } from "@/lib/content/toc";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";
import { postJsonLdGraph } from "@/lib/seo/schema";

import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/blog/breadcrumbs";
import { ArticleMeta } from "@/components/blog/article-meta";
import { ArticleContent } from "@/components/blog/article-content";
import { ArticleEnhancers } from "@/components/blog/article-enhancers";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ReadingProgressBar } from "@/components/blog/reading-progress-bar";
import { FloatingShareBar } from "@/components/blog/floating-share-bar";
import { ReactionBar } from "@/components/blog/reaction-bar";
import { BookmarkButton } from "@/components/blog/bookmark-button";
import { SummaryBlock, KeyTakeaways, FaqSection, SourcesSection } from "@/components/blog/geo-blocks";
import { AuthorBioCard } from "@/components/blog/author-bio-card";
import { RelatedArticles } from "@/components/blog/related-articles";
import { PrevNextNav } from "@/components/blog/prev-next-nav";
import { CommentsSection } from "@/components/blog/comments-section";
import { RecentlyViewed } from "@/components/blog/recently-viewed";
import { ViewTracker } from "@/components/blog/view-tracker";
import { Badge } from "@/components/ui/badge";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug, { includeDraft: true });
  // Match the `noindex` tag Next.js injects for the notFound() boundary below,
  // so search engines never see conflicting robots directives on a 404.
  if (!post) return { robots: { index: false, follow: false } };

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || siteConfig.description;
  const url = `/blog/${post.slug}`;
  const [robotsIndex, robotsFollow] = post.metaRobots.split(",").map((s) => !s.includes("no"));

  return {
    title,
    description,
    alternates: { canonical: post.canonicalUrl || url },
    robots: { index: robotsIndex, follow: robotsFollow },
    authors: [{ name: post.author.name, url: absoluteUrl(`/author/${post.author.slug}`) }],
    openGraph: {
      type: "article",
      url,
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAtCms.toISOString(),
      authors: [post.author.name],
      images: post.ogImageUrl || post.coverImageUrl ? [{ url: post.ogImageUrl || post.coverImageUrl! }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.ogImageUrl || post.coverImageUrl ? [post.ogImageUrl || post.coverImageUrl!] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const currentUser = await getCurrentDbUser().catch(() => null);
  const isStaff = currentUser?.role && ["ADMIN", "EDITOR", "AUTHOR", "CONTRIBUTOR"].includes(currentUser.role);

  const post = await getPostBySlug(slug, { includeDraft: !!isStaff });
  if (!post) notFound();

  const [related, adjacent, comments] = await Promise.all([
    getRelatedPosts({ id: post.id, categoryId: post.categoryId, tags: post.tags }),
    getAdjacentPosts(post.publishedAt, post.id),
    getApprovedComments(post.id),
  ]);

  const toc = extractToc(post.contentHtml ?? "");
  const faq = (post.faq as { question: string; answer: string }[] | null) ?? [];
  const sources = (post.sources as { label: string; url: string }[] | null) ?? [];
  const contentId = `article-${post.id}`;

  return (
    <>
      <ReadingProgressBar />
      <ViewTracker postId={post.id} slug={post.slug} title={post.title} />
      <JsonLd
        data={postJsonLdGraph({
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          metaDescription: post.metaDescription,
          coverImageUrl: post.coverImageUrl,
          publishedAt: post.publishedAt,
          updatedAtCms: post.updatedAtCms,
          author: post.author,
          category: post.category,
          tags: post.tags,
          faq,
          readingTimeMinutes: post.readingTimeMinutes,
        })}
      />
      <ArticleEnhancers containerId={contentId} toc={toc} />

      {post.status !== "PUBLISHED" && (
        <div className="bg-warning/10 text-warning border-warning/30 border-b py-2 text-center text-sm font-medium">
          Preview — this post is {post.status.toLowerCase().replace("_", " ")}, not live yet.
        </div>
      )}

      <div className="container-wide py-10">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            ...(post.category ? [{ name: post.category.name, href: `/category/${post.category.slug}` }] : []),
            { name: post.title, href: `/blog/${post.slug}` },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-8">
              <TableOfContents items={toc} />
              <RecentlyViewed excludeSlug={post.slug} />
            </div>
          </aside>

          <div className="min-w-0">
            <header className="mx-auto max-w-3xl">
              {post.category && (
                <Link
                  href={`/category/${post.category.slug}`}
                  className="text-primary text-sm font-semibold tracking-wide uppercase hover:underline"
                >
                  {post.category.name}
                </Link>
              )}
              <h1 className="mt-2 text-balance font-serif text-4xl font-semibold tracking-tight md:text-5xl">
                {post.title}
              </h1>
              {post.subtitle && (
                <p className="text-muted-foreground mt-3 text-xl leading-relaxed text-balance">{post.subtitle}</p>
              )}

              <div className="mt-6 flex items-center justify-between gap-4">
                <ArticleMeta
                  author={post.author}
                  publishedAt={post.publishedAt}
                  updatedAt={post.updatedAtCms}
                  readingTimeMinutes={post.readingTimeMinutes}
                  difficulty={post.difficulty}
                />
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <BookmarkButton postId={post.id} />
                </div>
              </div>
            </header>

            {post.coverImageUrl && (
              <div className="relative mx-auto mt-8 aspect-video w-full max-w-4xl overflow-hidden rounded-2xl">
                <Image
                  src={post.coverImageUrl}
                  alt={post.coverImageAlt ?? post.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 900px, 100vw"
                  className="object-cover"
                />
              </div>
            )}

            <div className="mx-auto mt-10 max-w-3xl">
              {post.summary && <SummaryBlock summary={post.summary} />}

              <ArticleContent id={contentId} html={post.contentHtml ?? ""} />

              <KeyTakeaways items={post.keyTakeaways} />
              <FaqSection items={faq} />
              <SourcesSection items={sources} />

              {post.tags.length > 0 && (
                <div className="not-prose mt-8 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" asChild>
                      <Link href={`/tag/${tag.slug}`}>#{tag.name}</Link>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="not-prose mt-8 flex items-center justify-between border-t pt-6">
                <ReactionBar postId={post.id} initialLikes={post.likeCount} initialClaps={post.clapCount} />
              </div>

              <AuthorBioCard author={post.author} />
              <PrevNextNav previous={adjacent.previous} next={adjacent.next} />
              <RelatedArticles posts={related} />
              <CommentsSection
                postId={post.id}
                comments={JSON.parse(JSON.stringify(comments))}
                isSignedIn={!!currentUser}
                allowComments={post.allowComments}
              />
            </div>
          </div>
        </div>
      </div>

      <FloatingShareBar postId={post.id} title={post.title} />
    </>
  );
}
