import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

type Adjacent = { slug: string; title: string } | null;

export function PrevNextNav({ previous, next }: { previous: Adjacent; next: Adjacent }) {
  if (!previous && !next) return null;

  return (
    <nav className="not-prose my-12 grid gap-3 border-t pt-8 sm:grid-cols-2" aria-label="Article navigation">
      {previous ? (
        <Link
          href={`/blog/${previous.slug}`}
          className="group hover:border-foreground/30 flex flex-col justify-center rounded-xl border p-4 transition-colors"
        >
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <ArrowLeftIcon className="size-3.5" /> Previous
          </span>
          <span className="mt-1 line-clamp-2 text-sm font-medium group-hover:underline">{previous.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group hover:border-foreground/30 flex flex-col items-end justify-center rounded-xl border p-4 text-right transition-colors"
        >
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            Next <ArrowRightIcon className="size-3.5" />
          </span>
          <span className="mt-1 line-clamp-2 text-sm font-medium group-hover:underline">{next.title}</span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
