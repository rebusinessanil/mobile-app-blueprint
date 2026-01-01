import { Link } from "react-router-dom";
import { useState, memo, useRef, useEffect } from "react";
import { getThumbnailUrl } from "@/lib/imageOptimizer";

interface StoryCardProps {
  id: string;
  title: string;
  imageUrl: string;
  storyStatus?: boolean | null; // false = Upcoming (yellow), true = Active (green), null = hidden
  linkTo: string;
  isPreview?: boolean;
  previewLabel?: string;
  // Legacy props for backward compatibility
  isActive?: boolean;
}

function StoryCardComponent({
  id,
  title,
  imageUrl,
  storyStatus,
  linkTo,
  isPreview = false,
  previewLabel = "Coming Soon",
  isActive, // Legacy prop
}: StoryCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Determine status: use storyStatus if provided, fall back to legacy isActive
  const resolvedStatus = storyStatus !== undefined ? storyStatus : (isActive ? true : false);
  const isUpcoming = resolvedStatus === false;
  const isActiveStatus = resolvedStatus === true;

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

  // Status dot color: green for active, yellow for upcoming
  const statusDotColor = isActiveStatus ? 'bg-green-500' : 'bg-yellow-500';

  const content = (
    <div ref={cardRef} className="story-card">
      {/* Image container - no text overlay */}
      <div className="story-card-image relative">
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
          <div className="absolute inset-0 bg-secondary/50 animate-pulse rounded-2xl" />
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
        {/* Status dot only - no text overlay */}
        {!isPreview && !isUpcoming && (
          <div 
            className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 ${statusDotColor} rounded-full border-2 border-white shadow-lg`} 
          />
        )}
        {/* Upcoming indicator - small dot instead of overlay */}
        {(isPreview || isUpcoming) && (
          <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-yellow-500 rounded-full border-2 border-white shadow-lg" />
        )}
      </div>
      {/* Title below image - outside card */}
      <div className="story-card-content">
        <p className="story-card-title">
          {title}
        </p>
      </div>
    </div>
  );

  // Upcoming stories (story_status = false) are not clickable
  if (isPreview || isUpcoming) {
    return (
      <div className="flex-shrink-0 transition-all opacity-75 transform-gpu cursor-not-allowed">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={linkTo}
      className="flex-shrink-0 transition-all transform-gpu will-change-transform"
    >
      {content}
    </Link>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(StoryCardComponent);
