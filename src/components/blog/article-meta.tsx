import Link from "next/link";
import { CalendarIcon, ClockIcon, RefreshCwIcon, BarChart3Icon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const DIFFICULTY_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function ArticleMeta({
  author,
  publishedAt,
  updatedAt,
  readingTimeMinutes,
  difficulty,
}: {
  author: { name: string; slug: string; avatarUrl: string | null; title: string | null };
  publishedAt: Date | string | null;
  updatedAt: Date | string | null;
  readingTimeMinutes: number | null;
  difficulty?: string | null;
}) {
  const showUpdated =
    updatedAt && publishedAt && new Date(updatedAt).toDateString() !== new Date(publishedAt).toDateString();

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      <Link href={`/author/${author.slug}`} className="flex items-center gap-2.5">
        <Avatar className="size-9">
          <AvatarImage src={author.avatarUrl ?? undefined} />
          <AvatarFallback>{author.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <span>
          <span className="block font-medium">{author.name}</span>
          {author.title && <span className="text-muted-foreground block text-xs">{author.title}</span>}
        </span>
      </Link>

      <span className="text-muted-foreground flex items-center gap-1.5">
        <CalendarIcon className="size-3.5" />
        {publishedAt ? formatDate(publishedAt) : "Draft"}
      </span>

      {showUpdated && (
        <span className="text-muted-foreground flex items-center gap-1.5">
          <RefreshCwIcon className="size-3.5" /> Updated {formatDate(updatedAt!)}
        </span>
      )}

      {readingTimeMinutes && (
        <span className="text-muted-foreground flex items-center gap-1.5">
          <ClockIcon className="size-3.5" /> {readingTimeMinutes} min read
        </span>
      )}

      {difficulty && (
        <Badge variant="outline" className="gap-1">
          <BarChart3Icon className="size-3" /> {DIFFICULTY_LABEL[difficulty] ?? difficulty}
        </Badge>
      )}
    </div>
  );
}
