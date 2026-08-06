import * as React from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PostPagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => !!v) as [string, string][],
    );
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <Button variant="outline" size="icon" disabled={page <= 1} asChild={page > 1}>
        {page > 1 ? (
          <Link href={href(page - 1)} aria-label="Previous page">
            <ChevronLeftIcon className="size-4" />
          </Link>
        ) : (
          <ChevronLeftIcon className="size-4" />
        )}
      </Button>

      {pages.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && pages[i - 1] !== p - 1 && <span className="text-muted-foreground px-1">…</span>}
          <Button variant={p === page ? "default" : "outline"} size="icon" asChild={p !== page}>
            {p !== page ? (
              <Link href={href(p)}>{p}</Link>
            ) : (
              <span className={cn("tabular-nums")}>{p}</span>
            )}
          </Button>
        </React.Fragment>
      ))}

      <Button variant="outline" size="icon" disabled={page >= totalPages} asChild={page < totalPages}>
        {page < totalPages ? (
          <Link href={href(page + 1)} aria-label="Next page">
            <ChevronRightIcon className="size-4" />
          </Link>
        ) : (
          <ChevronRightIcon className="size-4" />
        )}
      </Button>
    </nav>
  );
}
