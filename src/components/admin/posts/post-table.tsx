"use client";

import * as React from "react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import type { PostStatus } from "@prisma/client";
import { CopyIcon, EyeIcon, PencilIcon, SearchIcon, Trash2Icon, SendIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listPostsForAdmin,
  deletePost,
  duplicatePost,
  updatePostStatus,
} from "@/features/posts/actions/post-actions";
import { formatDate, formatCompactNumber } from "@/lib/utils";

type Post = Awaited<ReturnType<typeof listPostsForAdmin>>[number];

const TABS: { value: PostStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const STATUS_VARIANT: Record<PostStatus, "success" | "secondary" | "outline" | "warning"> = {
  PUBLISHED: "success",
  DRAFT: "secondary",
  IN_REVIEW: "warning",
  SCHEDULED: "warning",
  ARCHIVED: "outline",
};

export function PostTable({
  initialPosts,
  counts,
}: {
  initialPosts: Post[];
  counts: Partial<Record<PostStatus, number>>;
}) {
  const [tab, setTab] = React.useState<PostStatus | "ALL">("ALL");
  const [search, setSearch] = React.useState("");
  const [posts, setPosts] = React.useState(initialPosts);
  const [pending, startTransition] = useTransition();

  function refetch(nextTab: PostStatus | "ALL", nextSearch: string) {
    startTransition(async () => {
      const result = await listPostsForAdmin(nextTab === "ALL" ? undefined : nextTab, nextSearch || undefined);
      setPosts(result);
    });
  }

  function handleTabChange(value: string) {
    const next = value as PostStatus | "ALL";
    setTab(next);
    refetch(next, search);
  }

  const searchTimeout = React.useRef<ReturnType<typeof setTimeout>>(null);
  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => refetch(tab, value), 300);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this post permanently? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deletePost(id);
      if (result.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Post deleted");
      } else toast.error(result.error);
    });
  }

  function handleDuplicate(id: string) {
    startTransition(async () => {
      const result = await duplicatePost(id);
      if (result.success) {
        toast.success("Post duplicated");
        refetch(tab, search);
      } else toast.error(result.error);
    });
  }

  function handlePublishNow(id: string) {
    startTransition(async () => {
      const result = await updatePostStatus(id, "PUBLISHED" as PostStatus);
      if (result.success) {
        toast.success("Published");
        refetch(tab, search);
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="flex-wrap">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {t.value !== "ALL" && counts[t.value as PostStatus] ? (
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
                    {counts[t.value as PostStatus]}
                  </Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search posts…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border">
        {pending ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-xs">
                    <Link href={`/admin/posts/${post.id}/edit`} className="line-clamp-1 font-medium hover:underline">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[post.status]}>{post.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{post.author.name}</TableCell>
                  <TableCell className="text-muted-foreground">{post.category?.name ?? "—"}</TableCell>
                  <TableCell>{formatCompactNumber(post.viewCount)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(post.updatedAtCms)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {post.status === "PUBLISHED" && (
                      <Button variant="ghost" size="icon" asChild aria-label="View">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <EyeIcon className="size-4" />
                        </Link>
                      </Button>
                    )}
                    {post.status !== "PUBLISHED" && (
                      <Button variant="ghost" size="icon" onClick={() => handlePublishNow(post.id)} aria-label="Publish now">
                        <SendIcon className="size-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild aria-label="Edit">
                      <Link href={`/admin/posts/${post.id}/edit`}>
                        <PencilIcon className="size-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(post.id)} aria-label="Duplicate">
                      <CopyIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} aria-label="Delete">
                      <Trash2Icon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-14 text-center">
                    No posts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
