import { memo } from "react";

const WalletSkeleton = memo(() => (
  <div className="min-h-screen bg-navy-dark pb-24">
    {/* Header */}
    <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-secondary/50 rounded-xl animate-pulse" />
          <div className="h-5 w-24 bg-secondary/50 rounded animate-pulse" />
        </div>
        <div className="h-9 w-20 bg-primary/30 rounded-xl animate-pulse" />
      </div>
    </header>

    <div className="p-4 space-y-4">
      {/* Balance Card Skeleton */}
      <div className="bg-secondary/20 rounded-2xl p-6 space-y-3">
        <div className="h-4 w-28 bg-secondary/50 rounded animate-pulse" />
        <div className="h-10 w-32 bg-secondary/60 rounded animate-pulse" />
        <div className="h-3 w-40 bg-secondary/30 rounded animate-pulse" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/20 rounded-xl p-4 space-y-2">
          <div className="h-4 w-20 bg-secondary/50 rounded animate-pulse" />
          <div className="h-6 w-16 bg-secondary/60 rounded animate-pulse" />
        </div>
        <div className="bg-secondary/20 rounded-xl p-4 space-y-2">
          <div className="h-4 w-20 bg-secondary/50 rounded animate-pulse" />
          <div className="h-6 w-16 bg-secondary/60 rounded animate-pulse" />
        </div>
      </div>

      {/* Transactions Header */}
      <div className="flex justify-between items-center">
        <div className="h-5 w-32 bg-secondary/50 rounded animate-pulse" />
        <div className="h-4 w-16 bg-secondary/40 rounded animate-pulse" />
      </div>

      {/* Transaction List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
            <div className="w-10 h-10 bg-secondary/40 rounded-full animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 bg-secondary/50 rounded animate-pulse" />
              <div className="h-3 w-20 bg-secondary/30 rounded animate-pulse" />
            </div>
            <div className="h-5 w-14 bg-secondary/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
));

WalletSkeleton.displayName = 'WalletSkeleton';
export default WalletSkeleton;
