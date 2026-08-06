"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { CheckIcon, XIcon, ShieldAlertIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { moderateComment, deleteComment } from "@/features/comments/actions";
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

export function CommentModerationTable({ comments }: { comments: Comment[] }) {
  const [pending, startTransition] = useTransition();

  function act(id: string, fn: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.success) toast.success("Updated");
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between">
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
              onClick={() => act(c.id, () => deleteComment(c.id))}
              aria-label="Delete"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        </div>
      ))}
      {comments.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">No comments yet.</p>
      )}
    </div>
  );
}
