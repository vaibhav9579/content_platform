"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

export function SearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(initialQuery);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      params.delete("page");
      router.push(`/search?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search articles, categories, tags, authors…"
        className="h-14 rounded-xl pl-12 text-lg shadow-sm"
      />
    </div>
  );
}
