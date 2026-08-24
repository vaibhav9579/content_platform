"use client";

import Link from "next/link";
import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { CheckIcon, XIcon, ShieldAlertIcon, Trash2Icon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationBar } from "@/components/ui/pagination";
import {
  moderateComment,
  deleteComment,
  restoreComment,
  permanentlyDeleteComment,
  getAllComments,
} from "@/features/comments/actions";
import { formatDate, truncate } from "@/lib/utils";

type Comment = {
  id: string;
  body: string;
  status: string;
  guestName: string | null;
  createdAt: string;
  user: { name: string | null; email: string } | null;
  post: { title: string; slug: string };
};

const statusVariant: Record<string, "success" | "secondary" | "destructive" | "outline"> = {
  APPROVED: "success",
  PENDING: "secondary",
  SPAM: "destructive",
  REJECTED: "outline",
};

export function CommentModerationTable({
  comments: initialComments,
  initialTotalCount,
  initialTotalPages,
  pageSize,
}: {
  comments: Comment[];
  initialTotalCount: number;
  initialTotalPages: number;
  pageSize: number;
}) {
  const [tab, setTab] = React.useState<"active" | "trash">("active");
  const [comments, setComments] = React.useState(initialComments);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(initialTotalCount);
  const [totalPages, setTotalPages] = React.useState(initialTotalPages);
  const [pending, startTransition] = useTransition();

  function act(id: string, fn: () => Promise<{ success: boolean; error?: string }>, refetch = false) {
    startTransition(async () => {
      const result = await fn();
      if (result.success) {
        toast.success("Updated");
        if (refetch) loadPage(tab, page);
      } else toast.error(result.error);
    });
  }

  function loadPage(nextTab: "active" | "trash", nextPage: number) {
    startTransition(async () => {
      const result = await getAllComments({ trashed: nextTab === "trash", page: nextPage });
      setComments(JSON.parse(JSON.stringify(result.comments)));
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setPage(result.page);
    });
  }

  function loadTab(next: "active" | "trash") {
    setTab(next);
    loadPage(next, 1);
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => loadTab(v as "active" | "trash")}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="trash">Trash</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {comments.map((c) => (
          <div
            key={c.id}
            className="bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">{c.user?.name ?? c.guestName ?? "Anonymous"}</span>
                <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                <span className="text-muted-foreground">on</span>
                <Link href={`/blog/${c.post.slug}`} className="text-muted-foreground truncate hover:underline">
                  {c.post.title}
                </Link>
                <span className="text-muted-foreground">· {formatDate(c.createdAt)}</span>
              </div>
              <p className="mt-1.5 text-sm">{truncate(c.body, 240)}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              {tab === "active" ? (
                <>
                  {c.status !== "APPROVED" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      onClick={() => act(c.id, () => moderateComment(c.id, "APPROVED"))}
                      aria-label="Approve"
                    >
                      <CheckIcon className="size-4" />
                    </Button>
                  )}
                  {c.status !== "REJECTED" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      onClick={() => act(c.id, () => moderateComment(c.id, "REJECTED"))}
                      aria-label="Reject"
                    >
                      <XIcon className="size-4" />
                    </Button>
                  )}
                  {c.status !== "SPAM" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      onClick={() => act(c.id, () => moderateComment(c.id, "SPAM"))}
                      aria-label="Mark spam"
                    >
                      <ShieldAlertIcon className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending}
                    onClick={() => act(c.id, () => deleteComment(c.id), true)}
                    aria-label="Move to trash"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending}
                    onClick={() => act(c.id, () => restoreComment(c.id), true)}
                    aria-label="Restore"
                  >
                    <RotateCcwIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending}
                    onClick={() => {
                      if (confirm("Permanently delete this comment? This cannot be undone.")) {
                        act(c.id, () => permanentlyDeleteComment(c.id), true);
                      }
                    }}
                    aria-label="Delete permanently"
                  >
                    <Trash2Icon className="text-destructive size-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-muted-foreground py-10 text-center text-sm">
            {tab === "trash" ? "Trash is empty." : "No comments yet."}
          </p>
        )}
      </div>
      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={(p) => loadPage(tab, p)}
      />
    </div>
  );
}
