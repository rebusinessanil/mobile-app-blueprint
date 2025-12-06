import { useNavigate } from "react-router-dom";
import { useState, memo, useRef, useEffect, useCallback } from "react";
import { getThumbnailUrl } from "@/lib/imageOptimizer";

interface BannerCardProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  fallbackIcon?: string;
  fallbackGradient?: string;
  linkTo: string;
  instantNav?: boolean; // Enable instant navigation without transition
}

function BannerCardComponent({
  id,
  title,
  subtitle,
  imageUrl,
  fallbackIcon = "🏆",
  fallbackGradient = "bg-gradient-to-br from-secondary to-card",
  linkTo,
  instantNav = false
}: BannerCardProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Instant navigation handler - zero delay
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Use replace: false for normal history, navigate immediately
    navigate(linkTo);
  }, [navigate, linkTo]);

  // Lazy load with Intersection Observer
  useEffect(() => {
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
  }, []);

  const thumbnailUrl = imageUrl ? getThumbnailUrl(imageUrl, 40) : '';

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e as any)}
      className="w-[calc(33.333%-8px)] min-w-[110px] max-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all active:scale-95 transform-gpu will-change-transform cursor-pointer"
    >
      {/* Fixed aspect ratio container - GPU accelerated */}
      <div className="aspect-[4/3] relative bg-secondary/30 overflow-hidden">
        {imageUrl ? (
          <>
            {/* Blur placeholder - always render first */}
            {thumbnailUrl && !imageLoaded && (
              <img
                src={thumbnailUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-md scale-110 transform-gpu"
                loading="eager"
              />
            )}
            {/* Skeleton fallback */}
            {!imageLoaded && !thumbnailUrl && (
              <div className="absolute inset-0 bg-secondary/50 animate-pulse" />
            )}
            {/* Main image - only load when in view */}
            {isInView && (
              <img
                src={imageUrl}
                alt={title}
                className={`w-full h-full object-cover transition-opacity duration-200 transform-gpu ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
                decoding="async"
              />
            )}
          </>
        ) : (
          <div className={`w-full h-full ${fallbackGradient} flex items-center justify-center text-3xl`}>
            {fallbackIcon}
          </div>
        )}
      </div>
      <div className="p-2 text-center">
        <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">
          {title}
        </p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(BannerCardComponent);
