import { Skeleton } from "@/components/ui/skeleton";
import { PostGridSkeleton } from "@/components/blog/post-grid-skeleton";

export default function Loading() {
  return (
    <div className="container-wide py-12">
      <Skeleton className="mb-2 h-10 w-64" />
      <Skeleton className="mb-8 h-5 w-96" />
      <PostGridSkeleton count={9} />
    </div>
  );
}
