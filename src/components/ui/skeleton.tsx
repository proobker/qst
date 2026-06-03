import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-lg", className)}
      aria-hidden="true"
    />
  );
}

export function FeedSkeleton() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Skeleton className="h-24 w-full" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-48" />
            </div>
          </div>
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DiscoverSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-[420px] w-full rounded-2xl" />
    </div>
  );
}

export function QuestListSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  );
}
