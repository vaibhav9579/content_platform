import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-wide py-10">
      <Skeleton className="h-4 w-64" />
      <div className="mx-auto mt-6 max-w-3xl space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-2/3" />
        <div className="flex items-center gap-2.5 pt-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="mx-auto mt-8 aspect-video w-full max-w-4xl rounded-2xl" />
      <div className="mx-auto mt-10 max-w-3xl space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
