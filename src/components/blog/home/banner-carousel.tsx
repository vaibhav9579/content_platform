"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { getActiveBanners } from "@/features/banners/actions";

type Banner = Awaited<ReturnType<typeof getActiveBanners>>[number];

const AUTO_ROTATE_MS = 6000;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % banners.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className="container-wide py-10 lg:py-16">
      <div className="bg-muted relative aspect-[21/9] w-full overflow-hidden rounded-2xl md:aspect-[3/1]">
        {banners.map((banner, i) => {
          const slideClassName = cn(
            "absolute inset-0 block transition-opacity duration-700",
            i === active ? "opacity-100" : "pointer-events-none opacity-0",
          );
          const content = (
            <>
              <Image
                src={banner.imageUrl}
                alt={banner.imageAlt ?? banner.title ?? ""}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
              {(banner.title || banner.subtitle || banner.ctaLabel) && (
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/25 to-transparent p-6 md:p-10">
                  {banner.title && (
                    <h2 className="text-balance font-serif text-2xl font-semibold text-white md:text-4xl">
                      {banner.title}
                    </h2>
                  )}
                  {banner.subtitle && (
                    <p className="mt-2 max-w-xl text-sm text-white/90 md:text-base">{banner.subtitle}</p>
                  )}
                  {banner.ctaLabel && (
                    <span className="text-foreground bg-background mt-4 inline-flex w-fit items-center rounded-full px-5 py-2 text-sm font-medium">
                      {banner.ctaLabel}
                    </span>
                  )}
                </div>
              )}
            </>
          );

          return banner.linkUrl ? (
            <Link key={banner.id} href={banner.linkUrl} className={slideClassName}>
              {content}
            </Link>
          ) : (
            <div key={banner.id} className={slideClassName}>
              {content}
            </div>
          );
        })}

        {banners.length > 1 && (
          <div className="absolute right-4 bottom-4 flex gap-1.5">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show banner ${i + 1}`}
                className={cn("size-2 rounded-full transition-colors", i === active ? "bg-white" : "bg-white/40")}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
