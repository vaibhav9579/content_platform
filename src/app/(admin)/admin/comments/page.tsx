import type { Metadata } from "next";

import { getAllComments } from "@/features/comments/actions";
import { CommentModerationTable } from "@/components/admin/comments/comment-moderation-table";

export const metadata: Metadata = { title: "Comments" };

export default async function AdminCommentsPage() {
  const comments = await getAllComments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comments</h1>
        <p className="text-muted-foreground text-sm">Moderate reader discussion across every article.</p>
      </div>
      <CommentModerationTable comments={JSON.parse(JSON.stringify(comments))} />
    </div>
  );
}
