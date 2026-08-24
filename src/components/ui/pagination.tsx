"use client";

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationBarProps = {
  page: number;
  totalPages: number;
  totalCount?: number;
  pageSize?: number;
  className?: string;
} & ({ onPageChange: (page: number) => void; hrefForPage?: never } | { hrefForPage: (page: number) => string; onPageChange?: never });

/** first, last, current ± 1, collapsing any gaps into a single ellipsis marker. */
function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const keep = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = Array.from(keep)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

const itemClass = (active: boolean) =>
  cn(
    "flex size-9 shrink-0 items-center justify-center rounded-md border text-sm font-medium transition-colors",
    active
      ? "bg-primary text-primary-foreground border-primary"
      : "border-transparent hover:bg-accent hover:text-accent-foreground",
  );

const navButtonClass = (disabled: boolean) =>
  cn(
    "border-input flex size-9 shrink-0 items-center justify-center rounded-md border text-sm transition-colors",
    disabled ? "pointer-events-none opacity-40" : "hover:bg-accent hover:text-accent-foreground",
  );

/**
 * Numbered pagination bar. Pass `hrefForPage` for server-rendered, URL-driven
 * tables (renders links — shareable/bookmarkable ?page=N) or `onPageChange`
 * for tables that already manage their rows via client state + Server
 * Actions (renders buttons) — see admin post/comment tables for that pattern.
 */
export function PaginationBar(props: PaginationBarProps) {
  const { page, totalPages, totalCount, pageSize, className } = props;
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);
  const isLinkMode = "hrefForPage" in props && !!props.hrefForPage;
  const hrefForPage = isLinkMode ? props.hrefForPage : undefined;
  const onPageChange = !isLinkMode ? props.onPageChange : undefined;

  const rangeLabel =
    totalCount != null && pageSize != null
      ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount}`
      : null;

  function renderPrevNext(direction: "prev" | "next") {
    const target = direction === "prev" ? page - 1 : page + 1;
    const disabled = target < 1 || target > totalPages;
    const Icon = direction === "prev" ? ChevronLeftIcon : ChevronRightIcon;
    const label = direction === "prev" ? "Previous page" : "Next page";

    if (isLinkMode) {
      return disabled ? (
        <span className={navButtonClass(true)} aria-hidden="true">
          <Icon className="size-4" />
        </span>
      ) : (
        <Link href={hrefForPage!(target)} className={navButtonClass(false)} aria-label={label}>
          <Icon className="size-4" />
        </Link>
      );
    }
    return (
      <button
        type="button"
        className={navButtonClass(disabled)}
        disabled={disabled}
        onClick={() => onPageChange!(target)}
        aria-label={label}
      >
        <Icon className="size-4" />
      </button>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-between gap-3 sm:flex-row", className)}>
      {rangeLabel && <p className="text-muted-foreground text-sm">{rangeLabel}</p>}
      <div className="flex items-center gap-1 sm:ml-auto">
        {renderPrevNext("prev")}
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="text-muted-foreground flex size-9 items-center justify-center">
              <MoreHorizontalIcon className="size-4" />
            </span>
          ) : isLinkMode ? (
            <Link key={p} href={hrefForPage!(p)} className={itemClass(p === page)} aria-current={p === page ? "page" : undefined}>
              {p}
            </Link>
          ) : (
            <button
              key={p}
              type="button"
              className={itemClass(p === page)}
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPageChange!(p)}
            >
              {p}
            </button>
          ),
        )}
        {renderPrevNext("next")}
      </div>
    </div>
  );
}
