import { memo } from "react";

const BannerPreviewSkeleton = memo(() => (
  <div className="min-h-screen bg-navy-dark pb-24">
    {/* Header */}
    <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-secondary/50 rounded-xl animate-pulse" />
          <div className="h-5 w-32 bg-secondary/50 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-9 h-9 bg-secondary/50 rounded-xl animate-pulse" />
          <div className="w-9 h-9 bg-secondary/50 rounded-xl animate-pulse" />
        </div>
      </div>
    </header>

    <div className="p-4 space-y-4">
      {/* Banner Preview Skeleton */}
      <div className="aspect-square w-full bg-secondary/30 rounded-2xl animate-pulse" />

      {/* Template Selector Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-28 bg-secondary/50 rounded animate-pulse" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-16 h-16 bg-secondary/30 rounded-xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Profile Photos Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-secondary/50 rounded animate-pulse" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-14 h-14 bg-secondary/30 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex gap-3">
        <div className="h-12 flex-1 bg-secondary/40 rounded-xl animate-pulse" />
        <div className="h-12 flex-1 bg-primary/30 rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
));

BannerPreviewSkeleton.displayName = 'BannerPreviewSkeleton';
export default BannerPreviewSkeleton;
