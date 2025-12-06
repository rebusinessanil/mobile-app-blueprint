import { memo } from "react";

const BannerPreviewSkeleton = memo(() => (
  <div className="min-h-screen bg-background flex flex-col">
    {/* Header */}
    <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-5 w-32 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-9 h-9 bg-muted/50 rounded-xl animate-pulse" />
          <div className="w-9 h-9 bg-muted/50 rounded-xl animate-pulse" />
        </div>
      </div>
    </header>

    <div className="flex-1 flex flex-col px-3 sm:px-4 py-3 sm:py-4 space-y-4">
      {/* Banner Preview Container - Fixed aspect ratio to prevent layout shift */}
      <div className="relative w-full max-w-[100vw] sm:max-w-[520px] mx-auto flex-shrink-0">
        <div className="border-4 border-primary/30 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
          <div 
            className="relative bg-gradient-to-br from-muted/60 to-muted/30"
            style={{ aspectRatio: '1 / 1' }}
          >
            {/* Simulated banner layout matching actual structure */}
            <div className="absolute inset-0 p-3 sm:p-4 flex flex-col">
              {/* Top logos row */}
              <div className="flex justify-between items-start mb-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted/40 rounded-lg animate-pulse" />
                {/* Upline avatars */}
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 bg-muted/40 rounded-full animate-pulse" />
                  ))}
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted/40 rounded-lg animate-pulse" />
              </div>
              
              {/* Main content area - left photo + right content */}
              <div className="flex-1 flex gap-2 sm:gap-3">
                {/* Left - Main achiever photo placeholder */}
                <div 
                  className="bg-muted/40 rounded-xl animate-pulse flex-shrink-0"
                  style={{ width: '44%', aspectRatio: '3 / 4' }}
                />
                
                {/* Right - Category content area */}
                <div className="flex-1 flex flex-col justify-center items-center gap-2 sm:gap-3 p-2">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted/30 rounded-full animate-pulse" />
                  <div className="h-4 sm:h-6 w-3/4 bg-muted/30 rounded animate-pulse" />
                  <div className="h-3 sm:h-5 w-1/2 bg-muted/30 rounded animate-pulse" />
                  <div className="h-2 sm:h-3 w-2/3 bg-muted/30 rounded animate-pulse" />
                </div>
              </div>
              
              {/* Bottom section - contact bar + profile photo */}
              <div className="flex items-end justify-between mt-2">
                {/* Contact info bar */}
                <div className="flex-1 mr-2 sm:mr-3">
                  <div className="h-14 sm:h-20 bg-muted/40 rounded-lg animate-pulse" />
                </div>
                {/* Bottom-right profile photo */}
                <div 
                  className="bg-muted/40 rounded-lg animate-pulse flex-shrink-0"
                  style={{ width: '35%', aspectRatio: '1 / 1' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Photos Row + Download Button */}
      <div className="flex items-center justify-between px-2 flex-shrink-0">
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 bg-muted/30 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/30 rounded-lg animate-pulse flex-shrink-0" />
      </div>

      {/* Template Selector Grid */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-hidden rounded-2xl bg-muted/20 border-2 border-primary/10 p-2 sm:p-3">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
              <div 
                key={i} 
                className={`aspect-square rounded-lg animate-pulse ${
                  i === 1 ? 'bg-primary/40 border-2 border-primary' : 'bg-muted/30'
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