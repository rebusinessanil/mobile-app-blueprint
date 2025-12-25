/**
 * Adaptive Asset Delivery Utilities
 * Optimizes images based on device and network conditions
 */

const MOBILE_BREAKPOINT = 768;

/**
 * Network connection types for quality adjustment
 */
type NetworkEffectiveType = 'slow-2g' | '2g' | '3g' | '4g';

interface NetworkInformation {
  effectiveType?: NetworkEffectiveType;
  downlink?: number;
  saveData?: boolean;
}

/**
 * Get network information from the browser
 */
const getNetworkInfo = (): NetworkInformation => {
  if (typeof navigator === 'undefined') return {};
  
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
  
  return {
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    saveData: connection?.saveData || false,
  };
};

/**
 * Detect if user is on a slow connection (2G/3G or saveData enabled)
 */
export const isSlowConnection = (): boolean => {
  const { effectiveType, saveData, downlink } = getNetworkInfo();
  
  // User explicitly requested reduced data
  if (saveData) return true;
  
  // Slow connection types
  if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') {
    return true;
  }
  
  // Very low bandwidth (less than 1.5 Mbps)
  if (downlink !== undefined && downlink < 1.5) {
    return true;
  }
  
  return false;
};

/**
 * Get network quality tier for optimization decisions
 * Returns: 'ultra-low' | 'low' | 'medium' | 'high'
 */
export const getNetworkQualityTier = (): 'ultra-low' | 'low' | 'medium' | 'high' => {
  const { effectiveType, saveData, downlink } = getNetworkInfo();
  
  // User explicitly requested reduced data - ultra low quality
  if (saveData) return 'ultra-low';
  
  // 2G connections - ultra low
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'ultra-low';
  }
  
  // 3G connections - low quality
  if (effectiveType === '3g') {
    return 'low';
  }
  
  // Check bandwidth if available
  if (downlink !== undefined) {
    if (downlink < 0.5) return 'ultra-low';
    if (downlink < 1.5) return 'low';
    if (downlink < 5) return 'medium';
  }
  
  return 'high';
};

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
 * Now includes network-aware quality adjustments
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
  const networkTier = getNetworkQualityTier();
  const slowNetwork = networkTier === 'ultra-low' || networkTier === 'low';
  
  // Parse existing URL
  const urlObj = new URL(url);
  
  // Ultra-low quality for 2G/slow-2g or saveData mode
  if (networkTier === 'ultra-low') {
    urlObj.searchParams.set('width', String(Math.min(width || 200, 200)));
    urlObj.searchParams.set('quality', '20');
    urlObj.searchParams.set('format', 'webp');
  }
  // Low quality for 3G or low bandwidth
  else if (networkTier === 'low') {
    urlObj.searchParams.set('width', String(Math.min(width || 250, 250)));
    urlObj.searchParams.set('quality', '30');
    urlObj.searchParams.set('format', 'webp');
  }
  // iOS: Aggressive downscaling to prevent memory crashes
  else if (isiOSDevice) {
    urlObj.searchParams.set('width', String(Math.min(width || 300, 300)));
    urlObj.searchParams.set('quality', '40');
    urlObj.searchParams.set('format', 'webp');
  } 
  // Mobile (non-iOS): Low quality, small size
  else if (isMobile) {
    urlObj.searchParams.set('width', String(width || 400));
    urlObj.searchParams.set('quality', '50');
    urlObj.searchParams.set('format', 'webp');
  } 
  // Desktop: Higher quality (but still respect slow networks)
  else {
    if (width) {
      urlObj.searchParams.set('width', String(width));
    }
    urlObj.searchParams.set('quality', slowNetwork ? '60' : '80');
    urlObj.searchParams.set('format', 'webp');
  }

  return urlObj.toString();
};

/**
 * Get thumbnail URL for quick loading
 * Network-aware: even smaller on slow connections
 */
export const getThumbnailUrl = (url: string, size: number = 100): string => {
  if (!url || !url.includes('supabase') || url.startsWith('data:')) {
    return url;
  }

  const networkTier = getNetworkQualityTier();
  
  // Adjust thumbnail size based on network
  let adjustedSize = size;
  let quality = 30;
  
  if (networkTier === 'ultra-low') {
    adjustedSize = Math.min(size, 50);
    quality = 15;
  } else if (networkTier === 'low') {
    adjustedSize = Math.min(size, 75);
    quality = 20;
  }

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('width', String(adjustedSize));
    urlObj.searchParams.set('quality', String(quality));
    urlObj.searchParams.set('format', 'webp');
    return urlObj.toString();
  } catch {
    return url;
  }
};

/**
 * Preload critical images (skip on slow connections)
 */
export const preloadCriticalImages = (urls: string[]): void => {
  if (typeof document === 'undefined') return;
  
  // Skip preloading on slow connections to save bandwidth
  if (isSlowConnection()) return;
  
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

/**
 * Hook-friendly function to check if we should use lite mode
 * Combines device + network checks
 */
export const shouldUseLiteMode = (): boolean => {
  return isIOS() || isSlowConnection();
};
