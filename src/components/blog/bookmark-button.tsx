"use client";

import * as React from "react";
import { useTransition } from "react";
import { BookmarkIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleBookmark } from "@/features/bookmarks/actions";

export function BookmarkButton({
  postId,
  initialBookmarked = false,
  variant = "outline",
}: {
  postId: string;
  initialBookmarked?: boolean;
  variant?: "outline" | "ghost";
}) {
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleBookmark(postId);
      if (result.success) {
        setBookmarked(result.data.bookmarked);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn("rounded-full", variant === "outline" && bookmarked && "border-primary")}
      onClick={handleClick}
      disabled={pending}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this article"}
    >
      <BookmarkIcon className={cn("size-4", bookmarked && "fill-current")} />
    </Button>
  );
}
