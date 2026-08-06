"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentForm } from "@/components/blog/comment-form";
import { formatDate } from "@/lib/utils";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  guestName: string | null;
  user: { name: string | null; imageUrl: string | null } | null;
  replies: {
    id: string;
    body: string;
    createdAt: string;
    guestName: string | null;
    user: { name: string | null; imageUrl: string | null } | null;
  }[];
};

export function CommentsSection({
  postId,
  comments,
  isSignedIn,
  allowComments,
}: {
  postId: string;
  comments: Comment[];
  isSignedIn: boolean;
  allowComments: boolean;
}) {
  const router = useRouter();
  const [replyTo, setReplyTo] = React.useState<string | null>(null);

  function refresh() {
    setReplyTo(null);
    router.refresh();
  }

  return (
    <section className="not-prose my-12 border-t pt-10" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="mb-6 text-2xl font-semibold tracking-tight">
        Discussion ({comments.length})
      </h2>

      {allowComments ? (
        <div className="mb-8">
          <CommentForm postId={postId} isSignedIn={isSignedIn} onSubmitted={refresh} />
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Comments are closed for this article.</p>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-4">
            <CommentItem comment={comment} />
            {allowComments && (
              <button
                className="text-muted-foreground ml-11 text-xs font-medium hover:underline"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                Reply
              </button>
            )}
            {replyTo === comment.id && (
              <div className="ml-11">
                <CommentForm postId={postId} parentId={comment.id} isSignedIn={isSignedIn} onSubmitted={refresh} />
              </div>
            )}
            {comment.replies.length > 0 && (
              <div className="ml-11 space-y-4 border-l pl-4">
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} />
                ))}
              </div>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-muted-foreground text-sm">Be the first to share your thoughts.</p>
        )}
      </div>
    </section>
  );
}

function CommentItem({
  comment,
}: {
  comment: {
    body: string;
    createdAt: string;
    guestName: string | null;
    user: { name: string | null; imageUrl: string | null } | null;
  };
}) {
  const name = comment.user?.name ?? comment.guestName ?? "Anonymous";
  return (
    <div className="flex gap-3">
      <Avatar className="size-8">
        <AvatarImage src={comment.user?.imageUrl ?? undefined} />
        <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-muted-foreground text-xs">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>
      </div>
    </div>
  );
}
