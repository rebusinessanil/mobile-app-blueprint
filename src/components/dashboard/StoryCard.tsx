import { Link } from "react-router-dom";
import { useState, memo, useRef, useEffect } from "react";
import { getThumbnailUrl } from "@/lib/imageOptimizer";

interface StoryCardProps {
  id: string;
  title: string;
  imageUrl: string;
  isActive?: boolean;
  linkTo: string;
  isPreview?: boolean;
  previewLabel?: string;
}

function StoryCardComponent({
  id,
  title,
  imageUrl,
  isActive = true,
  linkTo,
  isPreview = false,
  previewLabel = "Coming Soon"
}: StoryCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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
      { rootMargin: '50px', threshold: 0.01 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const thumbnailUrl = getThumbnailUrl(imageUrl, 20);

  const content = (
    <div ref={cardRef} className="gold-border bg-card rounded-2xl overflow-hidden">
      {/* Fixed aspect ratio container - GPU accelerated */}
      <div className="w-[72px] h-[72px] relative bg-secondary/30 overflow-hidden">
        {/* Blur placeholder */}
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
        {isPreview ? (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-medium">
              {previewLabel}
            </span>
          </div>
        ) : (
          <div 
            className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 ${
              isActive ? 'bg-green-500' : 'bg-yellow-500'
            } rounded-full border-2 border-white shadow-lg`} 
          />
        )}
      </div>
      <div className="p-1.5 text-center">
        <p className="text-[10px] font-semibold text-foreground leading-tight line-clamp-2">
          {title}
        </p>
      </div>
    </div>
  );

  if (isPreview) {
    return (
      <div className="flex-shrink-0 transition-all opacity-75 transform-gpu">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={linkTo}
      className="flex-shrink-0 transition-all hover:scale-105 active:scale-95 transform-gpu will-change-transform"
    >
      {content}
    </Link>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(StoryCardComponent);
