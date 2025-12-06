import { memo } from "react";

const BannerPreviewSkeleton = memo(() => (
  <div className="min-h-screen bg-navy-dark flex flex-col">
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

    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* Banner Preview Container - Main focal point */}
      <div className="relative w-full">
        <div className="aspect-square w-full max-w-[500px] mx-auto bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-2xl animate-pulse overflow-hidden">
          {/* Simulated banner content skeleton */}
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            {/* Top logos */}
            <div className="flex justify-between">
              <div className="w-16 h-16 bg-secondary/30 rounded-lg animate-pulse" />
              <div className="w-16 h-16 bg-secondary/30 rounded-lg animate-pulse" />
            </div>
            
            {/* Center content */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-32 h-32 bg-secondary/30 rounded-full animate-pulse" />
            </div>
            
            {/* Bottom info */}
            <div className="space-y-2">
              <div className="h-4 w-48 mx-auto bg-secondary/30 rounded animate-pulse" />
              <div className="h-3 w-32 mx-auto bg-secondary/30 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Photos Row + Download Button */}
      <div className="flex items-center justify-between px-2">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-10 h-10 bg-secondary/30 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
        <div className="w-16 h-16 bg-primary/30 rounded-lg animate-pulse" />
      </div>

      {/* Template Selector Grid */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-hidden rounded-2xl bg-secondary/20 border-2 border-primary/10 p-3">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
              <div 
                key={i} 
                className={`aspect-square rounded-lg animate-pulse ${
                  i === 1 ? 'bg-primary/40 border-2 border-primary' : 'bg-secondary/30'
                }`} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
));

BannerPreviewSkeleton.displayName = 'BannerPreviewSkeleton';
export default BannerPreviewSkeleton;