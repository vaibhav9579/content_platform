"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { StarIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "trending", label: "Trending" },
  { value: "most-viewed", label: "Most Viewed" },
  { value: "most-shared", label: "Most Shared" },
];

export function PostFilterBar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "newest";
  const featuredOnly = searchParams.get("featured") === "1";

  function updateSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleFeatured() {
    const params = new URLSearchParams(searchParams.toString());
    if (featuredOnly) params.delete("featured");
    else params.set("featured", "1");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-muted-foreground text-sm">
        {total} article{total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant={featuredOnly ? "default" : "outline"}
          size="sm"
          onClick={toggleFeatured}
          className={cn("gap-1.5")}
        >
          <StarIcon className={cn("size-3.5", featuredOnly && "fill-current")} /> Featured
        </Button>
        <Select value={currentSort} onValueChange={updateSort}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
