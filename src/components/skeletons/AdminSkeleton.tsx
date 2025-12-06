import { memo } from "react";

const AdminSkeleton = memo(() => (
  <div className="min-h-screen bg-navy-dark">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-primary/20 p-4 space-y-4 hidden md:block">
      <div className="h-8 w-32 bg-secondary/50 rounded animate-pulse mb-8" />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="w-5 h-5 bg-secondary/50 rounded animate-pulse" />
          <div className="h-4 w-24 bg-secondary/40 rounded animate-pulse" />
        </div>
      ))}
    </div>

    {/* Main Content */}
    <div className="md:ml-64 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="h-7 w-48 bg-secondary/50 rounded animate-pulse" />
        <div className="h-10 w-28 bg-primary/30 rounded-xl animate-pulse" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-secondary/20 rounded-xl p-4 space-y-2">
            <div className="h-4 w-20 bg-secondary/50 rounded animate-pulse" />
            <div className="h-8 w-16 bg-secondary/60 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-card rounded-xl border border-primary/20 overflow-hidden">
        <div className="p-4 border-b border-primary/10">
          <div className="h-5 w-32 bg-secondary/50 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-primary/10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-secondary/40 rounded-full animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 bg-secondary/50 rounded animate-pulse" />
                <div className="h-3 w-48 bg-secondary/30 rounded animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-secondary/40 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
));

AdminSkeleton.displayName = 'AdminSkeleton';
export default AdminSkeleton;
