"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { submitComment } from "@/features/comments/actions";

export function CommentForm({
  postId,
  parentId,
  isSignedIn,
  onSubmitted,
}: {
  postId: string;
  parentId?: string;
  isSignedIn: boolean;
  onSubmitted?: () => void;
}) {
  const [body, setBody] = React.useState("");
  const [guestName, setGuestName] = React.useState("");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitComment({ postId, parentId, body, guestName, guestEmail });
      if (result.success) {
        toast.success(isSignedIn ? "Comment posted" : "Comment submitted for review");
        setBody("");
        onSubmitted?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!isSignedIn && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Name" required value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          <Input
            type="email"
            placeholder="Email (not published)"
            required
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
          />
        </div>
      )}
      <Textarea
        placeholder="Share your thoughts…"
        rows={3}
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Posting…" : "Post comment"}
      </Button>
    </form>
  );
}
