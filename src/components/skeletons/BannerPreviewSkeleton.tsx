import { memo } from "react";

const BannerPreviewSkeleton = memo(() => (
  <div className="min-h-screen bg-navy-dark pb-24">
    {/* Header */}
    <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-secondary/40 rounded-xl animate-pulse" />
          <div className="h-5 w-32 bg-secondary/40 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-9 h-9 bg-secondary/40 rounded-xl animate-pulse" />
          <div className="w-9 h-9 bg-secondary/40 rounded-xl animate-pulse" />
        </div>
      </div>
    </header>

    <div className="p-4 space-y-4">
      {/* Banner Preview Box - Square 1:1 aspect ratio matching actual layout */}
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0 bg-secondary/20 rounded-2xl animate-pulse overflow-hidden">
          {/* Simulate inner banner elements */}
          <div className="absolute inset-0">
            {/* Left achiever photo placeholder */}
            <div className="absolute left-0 top-0 w-[40%] h-full bg-secondary/30 animate-pulse" />
            {/* Right mentor photo placeholder */}
            <div className="absolute right-0 bottom-0 w-[40%] h-[40%] bg-secondary/30 animate-pulse" />
            {/* Bottom bar placeholder */}
            <div className="absolute bottom-[2%] left-[2%] right-[2%] h-[9%] bg-secondary/40 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Template Selector Skeleton - Horizontal scroll */}
      <div className="space-y-2">
        <div className="h-4 w-28 bg-secondary/40 rounded animate-pulse" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-16 h-16 bg-secondary/30 rounded-xl animate-pulse flex-shrink-0 border-2 border-transparent" />
          ))}
        </div>
      </div>

      {/* Profile Photos Selector Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-secondary/40 rounded animate-pulse" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-14 h-14 bg-secondary/30 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex gap-3 pt-2">
        <div className="h-12 flex-1 bg-secondary/30 rounded-xl animate-pulse" />
        <div className="h-12 flex-1 bg-primary/20 rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
));

BannerPreviewSkeleton.displayName = 'BannerPreviewSkeleton';
export default BannerPreviewSkeleton;
