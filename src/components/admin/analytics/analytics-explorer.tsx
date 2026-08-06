"use client";

import * as React from "react";
import Link from "next/link";
import { useTransition } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getTopPostsBy, type AnalyticsSort } from "@/features/analytics/actions";
import { formatCompactNumber, formatDate } from "@/lib/utils";

type Post = Awaited<ReturnType<typeof getTopPostsBy>>[number];

const TABS: { value: AnalyticsSort; label: string }[] = [
  { value: "viewCount", label: "Most Viewed" },
  { value: "likeCount", label: "Most Liked" },
  { value: "clapCount", label: "Most Clapped" },
  { value: "shareCount", label: "Most Shared" },
  { value: "bookmarkCount", label: "Most Bookmarked" },
];

export function AnalyticsExplorer({ initialPosts }: { initialPosts: Post[] }) {
  const [sort, setSort] = React.useState<AnalyticsSort>("viewCount");
  const [posts, setPosts] = React.useState(initialPosts);
  const [pending, startTransition] = useTransition();

  function handleTabChange(value: string) {
    const next = value as AnalyticsSort;
    setSort(next);
    startTransition(async () => {
      const result = await getTopPostsBy(next);
      setPosts(result);
    });
  }

  return (
    <Tabs value={sort} onValueChange={handleTabChange}>
      <TabsList className="mb-4 flex-wrap">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {pending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Likes</TableHead>
              <TableHead>Claps</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="max-w-xs truncate font-medium">
                  <Link href={`/admin/posts/${post.id}/edit`} className="hover:underline">
                    {post.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{post.category?.name ?? "—"}</TableCell>
                <TableCell>{formatCompactNumber(post.viewCount)}</TableCell>
                <TableCell>{formatCompactNumber(post.likeCount)}</TableCell>
                <TableCell>{formatCompactNumber(post.clapCount)}</TableCell>
                <TableCell>{formatCompactNumber(post.shareCount)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {post.publishedAt ? formatDate(post.publishedAt) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                  No data yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Tabs>
  );
}
