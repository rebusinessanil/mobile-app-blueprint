import { memo } from "react";

const BannerCreateSkeleton = memo(() => (
  <div className="min-h-screen bg-navy-dark pb-24">
    {/* Header */}
    <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-primary/20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-secondary/50 rounded-xl animate-pulse" />
        <div className="space-y-1 flex-1">
          <div className="h-5 w-40 bg-secondary/50 rounded animate-pulse" />
          <div className="h-3 w-56 bg-secondary/30 rounded animate-pulse" />
        </div>
      </div>
    </header>

    <div className="p-4 space-y-6">
      {/* Toggle Skeleton */}
      <div className="flex justify-center">
        <div className="h-10 w-64 bg-secondary/40 rounded-full animate-pulse" />
      </div>

      {/* Upline Carousel Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-secondary/50 rounded animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-16 h-16 bg-secondary/30 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Form Fields Skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-secondary/50 rounded animate-pulse" />
          <div className="h-12 w-full bg-secondary/30 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-secondary/50 rounded animate-pulse" />
          <div className="h-12 w-full bg-secondary/30 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 bg-secondary/50 rounded animate-pulse" />
          <div className="h-12 w-full bg-secondary/30 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Photo Upload Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-secondary/50 rounded animate-pulse" />
        <div className="h-40 w-full bg-secondary/30 rounded-2xl animate-pulse flex items-center justify-center">
          <div className="w-12 h-12 bg-secondary/50 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Action Button Skeleton */}
      <div className="h-14 w-full bg-primary/30 rounded-xl animate-pulse" />
    </div>
  </div>
));

BannerCreateSkeleton.displayName = 'BannerCreateSkeleton';
export default BannerCreateSkeleton;
