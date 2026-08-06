"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, FileTextIcon, FolderIcon, TagIcon, UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

type SearchResults = {
  posts: { id: string; title: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
  authors: { id: string; name: string; slug: string }[];
};

const EMPTY: SearchResults = { posts: [], categories: [], tags: [], authors: [] };

export function SearchTrigger() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults>(EMPTY);
  const router = useRouter();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then(setResults)
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const hasResults =
    results.posts.length + results.categories.length + results.tags.length + results.authors.length > 0;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="relative"
      >
        <SearchIcon className="size-4" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search articles, categories, tags, authors…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim().length >= 2 && !hasResults && <CommandEmpty>No results found.</CommandEmpty>}
          {query.trim().length < 2 && <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>}

          {results.posts.length > 0 && (
            <CommandGroup heading="Articles">
              {results.posts.map((post) => (
                <CommandItem key={post.id} onSelect={() => go(`/blog/${post.slug}`)}>
                  <FileTextIcon /> {post.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.categories.length > 0 && (
            <CommandGroup heading="Categories">
              {results.categories.map((c) => (
                <CommandItem key={c.id} onSelect={() => go(`/category/${c.slug}`)}>
                  <FolderIcon /> {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.tags.length > 0 && (
            <CommandGroup heading="Tags">
              {results.tags.map((t) => (
                <CommandItem key={t.id} onSelect={() => go(`/tag/${t.slug}`)}>
                  <TagIcon /> {t.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.authors.length > 0 && (
            <CommandGroup heading="Authors">
              {results.authors.map((a) => (
                <CommandItem key={a.id} onSelect={() => go(`/author/${a.slug}`)}>
                  <UserIcon /> {a.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
