"use client";

import * as React from "react";
import { toast } from "sonner";
import { Link2Icon, CopyIcon } from "lucide-react";

import { findLinkableRelatedPosts } from "@/features/posts/actions/post-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Suggests already-published posts worth linking to, based on the title
 * being written — internal links compound the site's own SEO authority
 * and keep readers on-site, distinct from (but complementary to) external
 * backlinks. Debounced so it doesn't query on every keystroke.
 */
export function InternalLinkSuggestions({ title, postId }: { title: string; postId?: string }) {
  const [results, setResults] = React.useState<{ id: string; title: string; slug: string }[]>([]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (title.trim().length < 4) {
        setResults([]);
        return;
      }
      findLinkableRelatedPosts(title, postId)
        .then(setResults)
        .catch(() => setResults([]));
    }, 500);
    return () => clearTimeout(timeout);
  }, [title, postId]);

  function copyPath(slug: string) {
    navigator.clipboard.writeText(`/blog/${slug}`);
    toast.success("Link copied — paste it wherever you want in the body");
  }

  if (results.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Link2Icon className="size-3.5" /> Internal links you could add
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pb-5">
        {results.map((post) => (
          <div key={post.id} className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5">
            <span className="truncate text-xs">{post.title}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={() => copyPath(post.slug)}
              aria-label={`Copy link to ${post.title}`}
            >
              <CopyIcon className="size-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
