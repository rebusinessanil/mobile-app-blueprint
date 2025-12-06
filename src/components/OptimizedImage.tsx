import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';
import { getThumbnailUrl, getOptimizedImageUrl } from '@/lib/imageOptimizer';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

function OptimizedImageComponent({
  src,
  alt,
  className,
  width = 400,
  height,
  priority = false,
  fallback,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const thumbnailUrl = getThumbnailUrl(src, 40);
  const optimizedUrl = getOptimizedImageUrl(src, { width, quality: 80 });

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
      {/* Blur placeholder */}
      {!isLoaded && thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 transform-gpu"
          loading="eager"
        />
      )}
      
      {/* Main image */}
      {isInView && (
        <img
          src={optimizedUrl}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300 transform-gpu',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
}

export const OptimizedImage = memo(OptimizedImageComponent);
export default OptimizedImage;
