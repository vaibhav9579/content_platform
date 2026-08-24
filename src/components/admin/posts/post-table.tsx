"use client";

import * as React from "react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import type { PostStatus } from "@prisma/client";
import { CopyIcon, EyeIcon, PencilIcon, SearchIcon, Trash2Icon, SendIcon, RotateCcwIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination";
import {
  listPostsForAdmin,
  listTrashedPostsForAdmin,
  deletePost,
  restorePost,
  permanentlyDeletePost,
  duplicatePost,
  updatePostStatus,
} from "@/features/posts/actions/post-actions";
import { formatDate, formatCompactNumber } from "@/lib/utils";

type Post = Awaited<ReturnType<typeof listPostsForAdmin>>["posts"][number];
type TabValue = PostStatus | "ALL" | "TRASH";

const TABS: { value: TabValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "TRASH", label: "Trash" },
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
  initialTotalCount,
  initialTotalPages,
  pageSize,
}: {
  initialPosts: Post[];
  counts: Partial<Record<PostStatus, number>> & { TRASH?: number };
  initialTotalCount: number;
  initialTotalPages: number;
  pageSize: number;
}) {
  const [tab, setTab] = React.useState<TabValue>("ALL");
  const [search, setSearch] = React.useState("");
  const [posts, setPosts] = React.useState(initialPosts);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(initialTotalCount);
  const [totalPages, setTotalPages] = React.useState(initialTotalPages);
  const [pending, startTransition] = useTransition();

  function refetch(nextTab: TabValue, nextSearch: string, nextPage: number) {
    startTransition(async () => {
      if (nextTab === "TRASH") {
        const result = await listTrashedPostsForAdmin(nextPage);
        setPosts(result.posts);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        setPage(result.page);
        return;
      }
      const result = await listPostsForAdmin(
        nextTab === "ALL" ? undefined : nextTab,
        nextSearch || undefined,
        nextPage,
      );
      setPosts(result.posts);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setPage(result.page);
    });
  }

  function handleTabChange(value: string) {
    const next = value as TabValue;
    setTab(next);
    refetch(next, search, 1);
  }

  const searchTimeout = React.useRef<ReturnType<typeof setTimeout>>(null);
  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => refetch(tab, value, 1), 300);
  }

  // Removing/adding a row can leave the current page short (or overfull by
  // one), so reload the page from the server rather than patching the local
  // array — keeps counts/pages accurate.
  function handleDelete(id: string) {
    if (!confirm("Move this post to trash? You can restore it later from the Trash tab.")) return;
    startTransition(async () => {
      const result = await deletePost(id);
      if (result.success) {
        toast.success("Moved to trash");
        refetch(tab, search, page);
      } else toast.error(result.error);
    });
  }

  function handleRestore(id: string) {
    startTransition(async () => {
      const result = await restorePost(id);
      if (result.success) {
        toast.success("Restored");
        refetch(tab, search, page);
      } else toast.error(result.error);
    });
  }

  function handlePermanentDelete(id: string) {
    if (!confirm("Permanently delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await permanentlyDeletePost(id);
      if (result.success) {
        toast.success("Deleted permanently");
        refetch(tab, search, page);
      } else toast.error(result.error);
    });
  }

  function handleDuplicate(id: string) {
    startTransition(async () => {
      const result = await duplicatePost(id);
      if (result.success) {
        toast.success("Post duplicated");
        refetch(tab, search, page);
      } else toast.error(result.error);
    });
  }

  function handlePublishNow(id: string) {
    startTransition(async () => {
      const result = await updatePostStatus(id, "PUBLISHED" as PostStatus);
      if (result.success) {
        toast.success("Published");
        refetch(tab, search, page);
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="flex-wrap">
            {TABS.map((t) => {
              const count = t.value === "TRASH" ? counts.TRASH : counts[t.value as PostStatus];
              return (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                  {t.value !== "ALL" && count ? (
                    <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
                      {count}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        {tab !== "TRASH" && (
          <div className="relative w-full sm:w-64">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              placeholder="Search posts…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        )}
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
                <TableHead>{tab === "TRASH" ? "Deleted" : "Updated"}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-xs">
                    {tab === "TRASH" ? (
                      <span className="line-clamp-1 font-medium">{post.title}</span>
                    ) : (
                      <Link href={`/admin/posts/${post.id}/edit`} className="line-clamp-1 font-medium hover:underline">
                        {post.title}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[post.status]}>{post.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{post.author.name}</TableCell>
                  <TableCell className="text-muted-foreground">{post.category?.name ?? "—"}</TableCell>
                  <TableCell>{formatCompactNumber(post.viewCount)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(tab === "TRASH" && post.deletedAt ? post.deletedAt : post.updatedAtCms)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {tab === "TRASH" ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleRestore(post.id)} aria-label="Restore">
                          <RotateCcwIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePermanentDelete(post.id)}
                          aria-label="Delete permanently"
                        >
                          <Trash2Icon className="text-destructive size-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {post.status === "PUBLISHED" && (
                          <Button variant="ghost" size="icon" asChild aria-label="View">
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <EyeIcon className="size-4" />
                            </Link>
                          </Button>
                        )}
                        {post.status !== "PUBLISHED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePublishNow(post.id)}
                            aria-label="Publish now"
                          >
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
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} aria-label="Move to trash">
                          <Trash2Icon className="size-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-14 text-center">
                    {tab === "TRASH" ? "Trash is empty." : "No posts found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={(p) => refetch(tab, search, p)}
      />
    </div>
  );
}
