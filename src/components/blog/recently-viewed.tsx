"use client";

import * as React from "react";
import Link from "next/link";

type Item = { slug: string; title: string; viewedAt: number };

function readRecentlyViewed(excludeSlug: string): Item[] {
  try {
    const raw = localStorage.getItem("cp_recently_viewed");
    const list: Item[] = raw ? JSON.parse(raw) : [];
    return list.filter((i) => i.slug !== excludeSlug).slice(0, 5);
  } catch {
    return [];
  }
}

export function RecentlyViewed({ excludeSlug }: { excludeSlug: string }) {
  const [items, setItems] = React.useState<Item[]>([]);

  React.useEffect(() => {
    // localStorage only exists client-side, so reading it has to happen in
    // an effect rather than during render — this isn't state we could
    // derive without syncing from that external source first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readRecentlyViewed(excludeSlug));
  }, [excludeSlug]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Recently viewed</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={`/blog/${item.slug}`} className="line-clamp-1 text-sm hover:underline">
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
