import { memo } from "react";

const GenericSkeleton = memo(() => (
  <div className="min-h-screen bg-navy-dark pb-24">
    {/* Header */}
    <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-primary/20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-secondary/50 rounded-xl animate-pulse" />
        <div className="h-5 w-32 bg-secondary/50 rounded animate-pulse" />
      </div>
    </header>

    <div className="p-4 space-y-4">
      {/* Content blocks */}
      <div className="h-6 w-48 bg-secondary/50 rounded animate-pulse" />
      <div className="h-4 w-full bg-secondary/30 rounded animate-pulse" />
      <div className="h-4 w-3/4 bg-secondary/30 rounded animate-pulse" />
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-secondary/30 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>

    {/* Bottom Nav Skeleton */}
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-primary/20 px-6 py-3 z-50">
      <div className="flex justify-around">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-secondary/50 rounded animate-pulse" />
            <div className="w-12 h-3 bg-secondary/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
));

GenericSkeleton.displayName = 'GenericSkeleton';
export default GenericSkeleton;
