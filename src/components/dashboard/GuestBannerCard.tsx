import { useState, memo, useRef, useEffect, useCallback, useMemo } from "react";
import { getOptimizedImageUrl, getThumbnailUrl } from "@/lib/imageOptimizer";
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
  
  // Optimized image URL - 300px width, 80% quality for thumbnails
  const optimizedUrl = useMemo(() => 
    imageUrl ? getOptimizedImageUrl(imageUrl, { width: 300, quality: 80 }) : '',
    [imageUrl]
  );
  
  // Check if image is already cached - instant display
  const isCached = useMemo(() => optimizedUrl ? imageCache.has(optimizedUrl) : false, [optimizedUrl]);
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
    if (optimizedUrl) imageCache.add(optimizedUrl);
  }, [optimizedUrl]);

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
        className="template-card"
      >
        {/* Fixed aspect ratio container */}
        <div className="template-card-image">
          {imageUrl ? (
            <>
              {!imageLoaded && (
                <img
                  src={thumbnailUrl || PROXY_PLACEHOLDER}
                  alt=""
                  aria-hidden="true"
                  className="template-card-image-blur"
                  loading="eager"
                />
              )}
              {(isInView || isCached) && (
                <img
                  src={optimizedUrl}
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
            <div className={`template-card-fallback ${fallbackGradient}`}>
              {fallbackIcon}
            </div>
          )}
        </div>
        <div className="template-card-content">
          <p className="template-card-title">
            {title}
          </p>
          {subtitle && (
            <p className="template-card-subtitle">
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
