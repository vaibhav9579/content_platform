"use client";

import * as React from "react";
import Link from "next/link";

type Item = { slug: string; title: string; viewedAt: number };

export function RecentlyViewed({ excludeSlug }: { excludeSlug: string }) {
  const [items, setItems] = React.useState<Item[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("cp_recently_viewed");
      const list: Item[] = raw ? JSON.parse(raw) : [];
      setItems(list.filter((i) => i.slug !== excludeSlug).slice(0, 5));
    } catch {
      setItems([]);
    }
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
