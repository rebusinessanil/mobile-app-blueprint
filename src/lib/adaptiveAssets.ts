/**
 * Adaptive Asset Delivery Utilities
 * Optimizes images based on device and network conditions
 */

const MOBILE_BREAKPOINT = 768;

/**
 * Detect iOS devices (iPhone, iPad, iPod)
 */
export const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Get optimized image URL with Supabase transformations
 * @param url - Original image URL
 * @param width - Optional target width (auto-detected if not provided)
 * @returns Optimized URL with query params
 */
export const getOptimizedImageUrl = (
  url: string,
  width?: number
): string => {
  if (!url) return url;
  
  // Skip optimization for non-Supabase URLs or data URLs
  if (!url.includes('supabase') || url.startsWith('data:')) {
    return url;
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;
  const isiOSDevice = isIOS();
  
  // Parse existing URL
  const urlObj = new URL(url);
  
  // iOS: Aggressive downscaling to prevent memory crashes
  if (isiOSDevice) {
    urlObj.searchParams.set('width', String(Math.min(width || 300, 300)));
    urlObj.searchParams.set('quality', '40');
    urlObj.searchParams.set('format', 'webp');
  } else if (isMobile) {
    // Mobile (non-iOS): Low quality, small size
    urlObj.searchParams.set('width', String(width || 400));
    urlObj.searchParams.set('quality', '50');
    urlObj.searchParams.set('format', 'webp');
  } else {
    // Desktop: Higher quality
    if (width) {
      urlObj.searchParams.set('width', String(width));
    }
    urlObj.searchParams.set('quality', '80');
    urlObj.searchParams.set('format', 'webp');
  }

  return urlObj.toString();
};

/**
 * Get thumbnail URL for quick loading
 */
export const getThumbnailUrl = (url: string, size: number = 100): string => {
  if (!url || !url.includes('supabase') || url.startsWith('data:')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('width', String(size));
    urlObj.searchParams.set('quality', '30');
    urlObj.searchParams.set('format', 'webp');
    return urlObj.toString();
  } catch {
    return url;
  }
};

/**
 * Preload critical images
 */
export const preloadCriticalImages = (urls: string[]): void => {
  if (typeof document === 'undefined') return;
  
  const head = document.head;
  
  urls.forEach((url) => {
    if (!url) return;
    
    // Check if already preloaded
    const existing = head.querySelector(`link[href="${url}"]`);
    if (existing) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getOptimizedImageUrl(url);
    head.appendChild(link);
  });
};

/**
 * Image props for optimal loading
 */
export const getImageProps = (priority: boolean = false) => ({
  loading: priority ? 'eager' as const : 'lazy' as const,
  decoding: 'async' as const,
});

/**
 * Check WebP support
 */
let webpSupported: boolean | null = null;
export const supportsWebP = (): boolean => {
  if (webpSupported !== null) return webpSupported;
  if (typeof document === 'undefined') return true;
  
  const canvas = document.createElement('canvas');
  webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  return webpSupported;
};
