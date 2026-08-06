import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheckIcon, GlobeIcon, Link2Icon, FolderGit2Icon, AtSignIcon } from "lucide-react";

import { getPublicAuthorBySlug } from "@/features/authors/queries";
import { getPosts } from "@/features/posts/queries/get-posts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/blog/post-card";
import { Breadcrumbs } from "@/components/blog/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { authorJsonLd } from "@/lib/seo/schema";

export const revalidate = 1800;

export async function generateMetadata({ params }: PageProps<"/author/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const author = await getPublicAuthorBySlug(slug);
  if (!author) return {};
  return {
    title: author.name,
    description: author.bio || `Articles by ${author.name}`,
    alternates: { canonical: `/author/${author.slug}` },
  };
}

export default async function AuthorPage({ params }: PageProps<"/author/[slug]">) {
  const { slug } = await params;
  const author = await getPublicAuthorBySlug(slug);
  if (!author) notFound();

  const { posts, total } = await getPosts({ authorSlug: slug, pageSize: 24 });

  return (
    <div className="container-wide py-12">
      <JsonLd data={authorJsonLd(author)} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Authors", href: "/author" }, { name: author.name, href: `/author/${author.slug}` }]} />

      <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Avatar className="size-24">
          <AvatarImage src={author.avatarUrl ?? undefined} />
          <AvatarFallback className="text-2xl">{author.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-semibold tracking-tight">{author.name}</h1>
            {author.isVerified && <BadgeCheckIcon className="text-primary size-5" />}
          </div>
          {author.title && <p className="text-muted-foreground mt-1">{author.title}</p>}
          {author.bio && <p className="mt-3 max-w-2xl leading-relaxed">{author.bio}</p>}
          <div className="mt-3 flex items-center gap-4">
            {author.websiteUrl && (
              <a href={author.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label="Website">
                <GlobeIcon className="text-muted-foreground hover:text-foreground size-4" />
              </a>
            )}
            {author.twitterUrl && (
              <a href={author.twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
                <AtSignIcon className="text-muted-foreground hover:text-foreground size-4" />
              </a>
            )}
            {author.linkedinUrl && (
              <a href={author.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Link2Icon className="text-muted-foreground hover:text-foreground size-4" />
              </a>
            )}
            {author.githubUrl && (
              <a href={author.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <FolderGit2Icon className="text-muted-foreground hover:text-foreground size-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <h2 className="mt-12 mb-6 text-xl font-semibold tracking-tight">{total} Published Articles</h2>
      <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {posts.length === 0 && <p className="text-muted-foreground py-10 text-center">No articles published yet.</p>}
    </div>
  );
}
