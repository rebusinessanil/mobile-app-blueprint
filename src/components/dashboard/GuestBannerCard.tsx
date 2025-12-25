import { useState, memo, useRef, useEffect, useCallback, useMemo } from "react";
import { getThumbnailUrl } from "@/lib/imageOptimizer";
import LoginPromptModal from "@/components/LoginPromptModal";

// Static proxy placeholder SVG - instant display, no network
const PROXY_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='105' viewBox='0 0 140 105'%3E%3Crect fill='%231a1f2e' width='140' height='105'/%3E%3Crect fill='%23ffd34e' opacity='0.08' width='140' height='105'/%3E%3C/svg%3E";

// Image cache for instant re-renders
const imageCache = new Set<string>();

interface GuestBannerCardProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  fallbackIcon?: string;
  fallbackGradient?: string;
  linkTo: string;
  isAuthenticated: boolean;
  onAuthenticatedClick?: () => void;
}

function GuestBannerCardComponent({
  id,
  title,
  subtitle,
  imageUrl,
  fallbackIcon = "🏆",
  fallbackGradient = "bg-gradient-to-br from-secondary to-card",
  linkTo,
  isAuthenticated,
  onAuthenticatedClick
}: GuestBannerCardProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Check if image is already cached - instant display
  const isCached = useMemo(() => imageUrl ? imageCache.has(imageUrl) : false, [imageUrl]);
  const [imageLoaded, setImageLoaded] = useState(isCached);
  const [isInView, setIsInView] = useState(isCached);
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle click - gate for guests
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (onAuthenticatedClick) {
      onAuthenticatedClick();
    }
  }, [isAuthenticated, onAuthenticatedClick]);

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
      { rootMargin: '200px', threshold: 0.01 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isCached, isInView]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    if (imageUrl) imageCache.add(imageUrl);
  }, [imageUrl]);

  const thumbnailUrl = useMemo(() => 
    imageUrl ? getThumbnailUrl(imageUrl, 40) : '', 
    [imageUrl]
  );

  return (
    <>
      <div
        ref={cardRef}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick(e as any)}
        className="w-[calc(33.333%-8px)] min-w-[110px] max-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all active:scale-95 transform-gpu will-change-transform cursor-pointer"
      >
        {/* Fixed aspect ratio container */}
        <div className="aspect-[4/3] relative bg-secondary/30 overflow-hidden">
          {imageUrl ? (
            <>
              {!imageLoaded && (
                <img
                  src={thumbnailUrl || PROXY_PLACEHOLDER}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-sm scale-105 transform-gpu"
                  loading="eager"
                />
              )}
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
      
      <LoginPromptModal 
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        featureName={`${title} banner creation`}
      />
    </>
  );
}

export default memo(GuestBannerCardComponent);
