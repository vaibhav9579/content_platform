"use client";

import * as React from "react";
import { useTransition } from "react";
import { ReactionType } from "@prisma/client";
import { HeartIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn, formatCompactNumber } from "@/lib/utils";
import { toggleReaction } from "@/features/bookmarks/actions";

export function ReactionBar({
  postId,
  initialLikes,
  initialClaps,
}: {
  postId: string;
  initialLikes: number;
  initialClaps: number;
}) {
  const [likes, setLikes] = React.useState(initialLikes);
  const [claps, setClaps] = React.useState(initialClaps);
  const [liked, setLiked] = React.useState(false);
  const [clapped, setClapped] = React.useState(false);
  const [, startTransition] = useTransition();

  function react(type: ReactionType) {
    const isLike = type === ReactionType.LIKE;
    const active = isLike ? liked : clapped;
    // Optimistic update
    if (isLike) {
      setLiked(!active);
      setLikes((n) => n + (active ? -1 : 1));
    } else {
      setClapped(!active);
      setClaps((n) => n + (active ? -1 : 1));
    }
    startTransition(async () => {
      const result = await toggleReaction(postId, type);
      if (!result.success) {
        toast.error(result.error);
        // Revert
        if (isLike) {
          setLiked(active);
          setLikes((n) => n + (active ? 1 : -1));
        } else {
          setClapped(active);
          setClaps((n) => n + (active ? 1 : -1));
        }
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5 rounded-full", liked && "border-destructive text-destructive")}
        onClick={() => react(ReactionType.LIKE)}
      >
        <HeartIcon className={cn("size-4", liked && "fill-current")} />
        {formatCompactNumber(likes)}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5 rounded-full", clapped && "border-primary")}
        onClick={() => react(ReactionType.CLAP)}
      >
        👏 {formatCompactNumber(claps)}
      </Button>
    </div>
  );
}
