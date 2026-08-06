import { Skeleton } from "@/components/ui/skeleton";
import { PostGridSkeleton } from "@/components/blog/post-grid-skeleton";

export default function Loading() {
  return (
    <div className="container-wide py-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-8 w-8 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-16">
        <Skeleton className="mb-6 h-8 w-56" />
        <PostGridSkeleton count={6} />
      </div>
    </div>
  );
}
