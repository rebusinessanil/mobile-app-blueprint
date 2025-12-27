import { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getThumbnailUrl } from "@/lib/imageOptimizer";

// Static proxy placeholder SVG
const PROXY_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect fill='%231a1f2e' width='200' height='150'/%3E%3Crect fill='%23ffd34e' opacity='0.08' width='200' height='150'/%3E%3C/svg%3E";

// Image cache for instant re-renders
const imageCache = new Set<string>();

interface SelectionCardProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  fallbackIcon?: string;
  fallbackGradient?: string;
  onClick: () => void;
  aspectRatio?: "4/3" | "3/4" | "square";
}

function SelectionCardComponent({
  id,
  title,
  subtitle,
  imageUrl,
  fallbackIcon = "🏆",
  fallbackGradient = "bg-gradient-to-br from-secondary to-card",
  onClick,
  aspectRatio = "4/3"
}: SelectionCardProps) {
  const isCached = useMemo(() => imageUrl ? imageCache.has(imageUrl) : false, [imageUrl]);
  const [imageLoaded, setImageLoaded] = useState(isCached);
  const [isInView, setIsInView] = useState(isCached);
  const cardRef = useRef<HTMLDivElement>(null);

  // Lazy load with Intersection Observer
  useEffect(() => {
    if (isCached || isInView) return;
    
    const element = cardRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isCached, isInView]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    if (imageUrl) imageCache.add(imageUrl);
  }, [imageUrl]);

  const thumbnailUrl = useMemo(() => 
    imageUrl ? getThumbnailUrl(imageUrl, 60) : '', 
    [imageUrl]
  );

  const aspectClass = {
    "4/3": "aspect-[4/3]",
    "3/4": "aspect-[3/4]",
    "square": "aspect-square"
  }[aspectRatio];

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="selection-card cursor-pointer rounded-2xl overflow-hidden border-2 border-primary/60 bg-card transition-all duration-200 transform-gpu hover:border-primary hover:shadow-[0_0_20px_hsl(45_100%_60%/0.3)] active:scale-95"
    >
      {/* Image Container with Aspect Ratio */}
      <div className={`${aspectClass} relative overflow-hidden bg-secondary/30`}>
        {imageUrl ? (
          <>
            {/* Placeholder/blur */}
            {!imageLoaded && (
              <img
                src={thumbnailUrl || PROXY_PLACEHOLDER}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-sm scale-105 transform-gpu"
                loading="eager"
              />
            )}
            {/* Main image */}
            {(isInView || isCached) && (
              <img
                src={imageUrl}
                alt={title}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 transform-gpu ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                loading="lazy"
                decoding="async"
              />
            )}
          </>
        ) : (
          <div className={`w-full h-full ${fallbackGradient} flex items-center justify-center text-4xl`}>
            {fallbackIcon}
          </div>
        )}
      </div>
      
      {/* Content Area */}
      <div className="p-3 text-center bg-card">
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(SelectionCardComponent);
