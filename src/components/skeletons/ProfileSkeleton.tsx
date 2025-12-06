import { memo } from "react";

const ProfileSkeleton = memo(() => (
  <div className="min-h-screen bg-navy-dark pb-24">
    {/* Header */}
    <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-primary/20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-secondary/50 rounded-xl animate-pulse" />
        <div className="h-5 w-24 bg-secondary/50 rounded animate-pulse" />
      </div>
    </header>

    <div className="p-4 space-y-6">
      {/* Profile Photo Skeleton */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-24 h-24 bg-secondary/40 rounded-full animate-pulse" />
        <div className="h-5 w-32 bg-secondary/50 rounded animate-pulse" />
        <div className="h-4 w-24 bg-secondary/30 rounded animate-pulse" />
      </div>

      {/* Photo Gallery Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-28 bg-secondary/50 rounded animate-pulse" />
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-square bg-secondary/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Form Fields Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 bg-secondary/50 rounded animate-pulse" />
            <div className="h-12 w-full bg-secondary/30 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>

      {/* Save Button Skeleton */}
      <div className="h-14 w-full bg-primary/30 rounded-xl animate-pulse" />
    </div>
  </div>
));

ProfileSkeleton.displayName = 'ProfileSkeleton';
export default ProfileSkeleton;
