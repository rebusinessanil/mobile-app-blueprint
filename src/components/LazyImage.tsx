import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { isImageCached, loadImage } from '@/lib/assetLoader';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  placeholderSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  fadeIn?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/**
 * Optimized lazy loading image component with fade-in transitions
 * - Uses IntersectionObserver for viewport-based loading
 * - Supports placeholder/proxy images
 * - GPU-accelerated fade transitions
 * - Memory-efficient with cleanup
 */
const LazyImageComponent = ({
  src,
  alt,
  className = '',
  placeholderClassName = '',
  placeholderSrc,
  onLoad,
  onError,
  priority = false,
  fadeIn = true,
  crossOrigin = 'anonymous',
}: LazyImageProps) => {
  const [loaded, setLoaded] = useState(() => isImageCached(src));
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Setup IntersectionObserver for lazy loading
  useEffect(() => {
    if (priority || loaded || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    
    const img = imgRef.current;
    if (!img) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Load 100px before entering viewport
        threshold: 0.01,
      }
    );
    
    observerRef.current.observe(img);
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, loaded]);
  
  // Load image when in view
  useEffect(() => {
    if (!inView || !src || loaded) return;
    
    loadImage(src).then((success) => {
      if (success) {
        setLoaded(true);
        onLoad?.();
      } else {
        setError(true);
        onError?.();
      }
    });
  }, [inView, src, loaded, onLoad, onError]);
  
  const handleError = useCallback(() => {
    setError(true);
    onError?.();
  }, [onError]);
  
  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);
  
  // Show placeholder or proxy image while loading
  if (!loaded && !error) {
    return (
      <div 
        ref={imgRef}
        className={cn(
          'relative overflow-hidden',
          placeholderClassName || className
        )}
      >
        {placeholderSrc ? (
          <img
            src={placeholderSrc}
            alt=""
            className={cn('w-full h-full object-cover', className)}
            aria-hidden="true"
          />
        ) : (
          <div 
            className={cn(
              'w-full h-full animate-pulse bg-muted/50',
              className
            )}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
  
  // Error state - show placeholder or nothing
  if (error) {
    return placeholderSrc ? (
      <img
        src={placeholderSrc}
        alt={alt}
        className={className}
      />
    ) : (
      <div className={cn('bg-muted/30', className)} />
    );
  }
  
  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      crossOrigin={crossOrigin}
      className={cn(
        className,
        fadeIn && 'transition-opacity duration-300',
        fadeIn && (loaded ? 'opacity-100' : 'opacity-0')
      )}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export const LazyImage = memo(LazyImageComponent);
LazyImage.displayName = 'LazyImage';

export default LazyImage;
