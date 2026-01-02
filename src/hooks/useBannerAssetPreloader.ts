import { useState, useCallback, useRef, useEffect } from 'react';
import { isMobileDevice, isLowMemoryDevice } from './useMobileLiteMode';

interface PreloadConfig {
  activeBackgroundUrl?: string;
  primaryPhotoUrl?: string;
  downloadIconUrl?: string;
  logoUrls?: string[];
  visibleStickerUrls?: string[];
  otherBackgroundUrls?: string[];
  otherStickerUrls?: string[];
  uplineAvatarUrls?: string[];
}

interface PreloadState {
  allLoaded: boolean;
  progress: number;
  timedOut: boolean;
}

// *** MOBILE-FIRST TIMEOUTS - Aggressive for instant loading ***
const GLOBAL_TIMEOUT_MS = 2500; // 2.5s max wait for mobile (was 3000)
const PER_IMAGE_TIMEOUT_MS = 1200; // 1.2s per image (was 1500)
const PROGRESS_THROTTLE_MS = 16; // ~60fps update rate for smoother progress

// *** GLOBAL IMAGE CACHE - Shared across all renders ***
// Prevents duplicate requests and stores decoded images for instant access
const imageCache = new Map<string, Promise<boolean>>();
const decodedImages = new Set<string>();

// *** PRELOADED IMAGE ELEMENTS - For instant rendering without network requests ***
const preloadedElements = new Map<string, HTMLImageElement>();

/**
 * MOBILE-FIRST Banner Asset Preloader
 * - Single batch parallel loading
 * - Global image cache prevents re-fetching
 * - Stores decoded image elements for instant rendering
 * - One-time load - never re-triggers after initial load
 * - Aggressive timeouts for mobile performance
 */
export const useBannerAssetPreloader = () => {
  const [state, setState] = useState<PreloadState>({
    allLoaded: false,
    progress: 0,
    timedOut: false,
  });
  
  const isMobile = isMobileDevice();
  const isLowMemory = isLowMemoryDevice();
  const lastProgressUpdate = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);
  const hasLoadedRef = useRef(false); // Prevent re-loading - CRITICAL for mobile stability

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  /**
   * Load single image with caching, decode, and element storage
   * Returns the cached/decoded image element for instant rendering
   */
  const loadImage = useCallback((url: string): Promise<boolean> => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return Promise.resolve(true);
    }

    // Already decoded and cached - instant return
    if (decodedImages.has(url) && preloadedElements.has(url)) {
      return Promise.resolve(true);
    }

    // Return cached promise if already loading
    if (imageCache.has(url)) {
      return imageCache.get(url)!;
    }

    const promise = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.crossOrigin = 'anonymous';
      
      const imgTimeout = setTimeout(() => {
        // Timeout but still mark as "ready" to prevent UI blocking
        decodedImages.add(url);
        preloadedElements.set(url, img);
        resolve(true);
      }, PER_IMAGE_TIMEOUT_MS);
      
      img.onload = async () => {
        clearTimeout(imgTimeout);
        try {
          // Decode image for instant rendering (no decode delay when displayed)
          await img.decode();
        } catch {
          // Decode failed but image is loaded - still usable
        }
        decodedImages.add(url);
        preloadedElements.set(url, img);
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(imgTimeout);
        // Mark as ready even on error to prevent blocking
        decodedImages.add(url);
        resolve(true);
      };
      
      img.src = url;
    });

    imageCache.set(url, promise);
    return promise;
  }, []);

  /**
   * Throttled progress update
   */
  const updateProgress = useCallback((progress: number) => {
    const now = Date.now();
    if (now - lastProgressUpdate.current >= PROGRESS_THROTTLE_MS || progress >= 100) {
      lastProgressUpdate.current = now;
      setState(prev => ({ ...prev, progress: Math.round(progress) }));
    }
  }, []);

  /**
   * Main preload - SINGLE BATCH parallel loading (all at once)
   * MOBILE-FIRST: One-time execution, aggressive timeouts, image caching
   */
  const preloadAssets = useCallback(async (config: PreloadConfig): Promise<void> => {
    // *** CRITICAL: Prevent re-loading - one-time only for mobile stability ***
    if (hasLoadedRef.current) {
      console.log('⚡ Assets already loaded - instant display');
      setState({ allLoaded: true, progress: 100, timedOut: false });
      return;
    }
    
    abortRef.current = false;
    setState({ allLoaded: false, progress: 0, timedOut: false });

    // Collect all URLs, deduplicated
    const allUrls = new Set<string>();
    
    if (config.activeBackgroundUrl) allUrls.add(config.activeBackgroundUrl);
    if (config.primaryPhotoUrl) allUrls.add(config.primaryPhotoUrl);
    if (config.downloadIconUrl) allUrls.add(config.downloadIconUrl);
    config.logoUrls?.forEach(url => url && allUrls.add(url));
    config.visibleStickerUrls?.forEach(url => url && allUrls.add(url));
    config.otherBackgroundUrls?.forEach(url => url && allUrls.add(url));
    config.otherStickerUrls?.forEach(url => url && allUrls.add(url));
    config.uplineAvatarUrls?.forEach(url => url && allUrls.add(url));

    const uniqueUrls = Array.from(allUrls);
    
    // Filter out already decoded images (from previous sessions or cache)
    const urlsToLoad = uniqueUrls.filter(url => !decodedImages.has(url));
    
    // All images already cached - instant complete
    if (urlsToLoad.length === 0) {
      hasLoadedRef.current = true;
      setState({ allLoaded: true, progress: 100, timedOut: false });
      console.log('⚡ All assets cached - instant display');
      return;
    }

    console.log(`⚡ Loading ${urlsToLoad.length} assets in single batch (mobile-first)...`);

    // Global timeout fallback - show content even if some images fail
    timeoutRef.current = setTimeout(() => {
      if (!abortRef.current) {
        console.log('⚠️ Timeout - showing banner immediately');
        hasLoadedRef.current = true;
        setState({ allLoaded: true, progress: 100, timedOut: true });
      }
    }, GLOBAL_TIMEOUT_MS);

    // *** SINGLE BATCH: Load ALL images in parallel at once ***
    let loaded = 0;
    const total = urlsToLoad.length;
    
    const loadPromises = urlsToLoad.map(async (url) => {
      await loadImage(url);
      loaded++;
      updateProgress((loaded / total) * 100);
    });

    await Promise.all(loadPromises);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!abortRef.current) {
      console.log('✅ All assets loaded - ready for instant display');
      hasLoadedRef.current = true;
      setState({ allLoaded: true, progress: 100, timedOut: false });
    }
  }, [loadImage, updateProgress]);

  /**
   * Reset preloader state (for component unmount/remount)
   * NOTE: Does NOT reset hasLoadedRef to preserve cache across re-renders
   */
  const reset = useCallback(() => {
    abortRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState({ allLoaded: false, progress: 0, timedOut: false });
  }, []);

  return {
    preloadAssets,
    reset,
    allLoaded: state.allLoaded,
    progress: state.progress,
    timedOut: state.timedOut,
    isMobile,
    criticalLoaded: state.allLoaded,
    // Expose cache check for external use
    isImageCached: (url: string) => decodedImages.has(url),
  };
};

// *** UTILITY: Check if an image is already preloaded ***
export const isImagePreloaded = (url: string): boolean => decodedImages.has(url);

// *** UTILITY: Get preloaded image element for instant rendering ***
export const getPreloadedImage = (url: string): HTMLImageElement | undefined => 
  preloadedElements.get(url);

export default useBannerAssetPreloader;
