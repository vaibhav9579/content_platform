"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/content/toc";

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = React.useState<string | null>(items[0]?.id ?? null);

  React.useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 1.0 },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">On this page</p>
      <ul className="border-border space-y-2 border-l">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: item.level === 3 ? "1.5rem" : "1rem" }}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l pl-3 leading-snug transition-colors",
                activeId === item.id
                  ? "border-foreground text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
