import { memo } from "react";

const ListPageSkeleton = memo(() => (
  <div className="min-h-screen bg-navy-dark pb-24">
    {/* Header */}
    <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-primary/20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-secondary/50 rounded-xl animate-pulse" />
        <div className="h-5 w-36 bg-secondary/50 rounded animate-pulse" />
      </div>
    </header>

    <div className="p-4 space-y-4">
      {/* Grid of Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="aspect-[4/5] bg-secondary/30 rounded-2xl animate-pulse" />
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

ListPageSkeleton.displayName = 'ListPageSkeleton';
export default ListPageSkeleton;
