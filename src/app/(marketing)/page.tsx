import Link from "next/link";
import type { Metadata } from "next";
import { FlameIcon } from "lucide-react";

import { getHomepageData } from "@/features/posts/queries/get-homepage-data";
import { getActiveBanners } from "@/features/banners/actions";
import { HeroSection } from "@/components/blog/home/hero-section";
import { BannerCarousel } from "@/components/blog/home/banner-carousel";
import { PopularCategories } from "@/components/blog/home/popular-categories";
import { Testimonials } from "@/components/blog/home/testimonials";
import { NewsletterCta } from "@/components/blog/home/newsletter-cta";
import { PostCard } from "@/components/blog/post-card";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";

export const revalidate = 900;

export const metadata: Metadata = {
  title: `${siteConfig.name} — In-depth articles, tutorials & guides`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [{ featured, trending, latest, editorsPick, popularCategories }, banners] = await Promise.all([
    getHomepageData(),
    getActiveBanners(),
  ]);
  const heroPosts = featured.length >= 3 ? featured : latest.slice(0, 5);

  return (
    <>
      {banners.length > 0 ? <BannerCarousel banners={banners} /> : <HeroSection posts={heroPosts} />}

      {editorsPick.length > 0 && (
        <section className="container-wide py-12">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Editor&apos;s Picks</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {editorsPick.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <Separator className="container-wide" />

      <PopularCategories categories={popularCategories} />

      {trending.length > 0 && (
        <section className="container-wide py-12">
          <div className="mb-6 flex items-center gap-2">
            <FlameIcon className="text-warning size-5" />
            <h2 className="text-2xl font-semibold tracking-tight">Trending Now</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <section className="container-wide py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Latest Articles</h2>
          <Link href="/blog" className="text-primary text-sm font-medium hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        {latest.length === 0 && (
          <p className="text-muted-foreground py-16 text-center">
            No articles published yet — check back soon, or{" "}
            <Link href="/admin/posts/new" className="underline">
              publish your first one
            </Link>
            .
          </p>
        )}
      </section>

      <Testimonials />
      <NewsletterCta />
    </>
  );
}
