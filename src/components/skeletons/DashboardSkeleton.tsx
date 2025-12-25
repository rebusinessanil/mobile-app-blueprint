import { memo } from "react";

const DashboardSkeleton = memo(() => (
  <div className="dashboard-shell bg-navy-dark min-h-screen">
    {/* Header Skeleton */}
    <header className="dashboard-header bg-navy-dark/95 border-b border-primary/20">
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-secondary/50 rounded-xl animate-pulse" />
          <div className="space-y-1">
            <div className="h-5 w-24 bg-secondary/50 rounded animate-pulse" />
            <div className="h-3 w-32 bg-secondary/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 bg-secondary/50 rounded-xl animate-pulse" />
          <div className="w-9 h-9 bg-secondary/50 rounded-xl animate-pulse" />
          <div className="w-9 h-9 bg-secondary/50 rounded-xl animate-pulse" />
        </div>
      </div>
    </header>

    {/* Scrollable Main Content */}
    <main>
      <div className="py-6 space-y-6">
        {/* Stories Section Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-28 bg-secondary/50 rounded animate-pulse ml-4" />
          <div className="flex gap-2 overflow-hidden pl-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-[72px] h-[100px] bg-secondary/30 rounded-2xl animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Category Sections Skeleton */}
        {[1, 2, 3].map((section) => (
          <div key={section} className="space-y-3">
            <div className="flex justify-between items-center px-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-secondary/50 rounded animate-pulse" />
                <div className="h-5 w-36 bg-secondary/50 rounded animate-pulse" />
              </div>
              <div className="h-4 w-14 bg-secondary/40 rounded animate-pulse" />
            </div>
            <div className="flex gap-3 overflow-hidden pl-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-[calc(33.333%-8px)] min-w-[110px] max-w-[140px] aspect-[4/5] bg-secondary/30 rounded-2xl animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>

    {/* Bottom Nav Skeleton */}
    <div className="dashboard-bottom-nav bg-card/95 border-t border-primary/20">
      <div className="h-full flex items-center justify-around px-6">
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

DashboardSkeleton.displayName = 'DashboardSkeleton';
export default DashboardSkeleton;
