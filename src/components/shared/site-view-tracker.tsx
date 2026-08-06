"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { trackPageView } from "@/lib/analytics/track-page-view";

/**
 * Site-wide pageview beacon, mounted once in the root layout. Blog post
 * pages track themselves (with a postId, via ViewTracker) so they're
 * skipped here to avoid double-counting the same navigation. Admin routes
 * are excluded so staff using the CMS doesn't skew visitor/traffic stats.
 */
export function SiteViewTracker() {
  const pathname = usePathname();

  React.useEffect(() => {
    if (pathname.startsWith("/blog/") || pathname.startsWith("/admin")) return;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
