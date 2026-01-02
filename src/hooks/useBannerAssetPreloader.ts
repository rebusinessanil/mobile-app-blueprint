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

// *** MOBILE-FIRST TIMEOUTS - Ultra-aggressive for instant loading ***
// Goal: Show banner ASAP, never block on slow assets
const GLOBAL_TIMEOUT_MS = 1800; // 1.8s max wait (was 2500) - show banner fast
const PER_IMAGE_TIMEOUT_MS = 800; // 0.8s per image (was 1200) - fail fast
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
   * Main preload - INSTANT DISPLAY PRIORITY
   * MOBILE-FIRST: Load critical assets first, show banner ASAP
   * Non-critical assets continue loading in background
   */
  const preloadAssets = useCallback(async (config: PreloadConfig): Promise<void> => {
    // *** CRITICAL: Prevent re-loading - one-time only for mobile stability ***
    if (hasLoadedRef.current) {
      console.log('⚡ Assets already loaded - instant display');
      setState({ allLoaded: true, progress: 100, timedOut: false });
      return;
    }
    
    abortRef.current = false;
    setState({ allLoaded: false, progress: 5, timedOut: false }); // Start at 5% to show activity

    // *** PRIORITY LOADING: Critical assets first ***
    // Critical = what's visible immediately (primary photo, active background)
    const criticalUrls = new Set<string>();
    const secondaryUrls = new Set<string>();
    
    // Critical: Immediately visible assets
    if (config.activeBackgroundUrl) criticalUrls.add(config.activeBackgroundUrl);
    if (config.primaryPhotoUrl) criticalUrls.add(config.primaryPhotoUrl);
    
    // Secondary: Everything else
    if (config.downloadIconUrl) secondaryUrls.add(config.downloadIconUrl);
    config.logoUrls?.forEach(url => url && secondaryUrls.add(url));
    config.visibleStickerUrls?.forEach(url => url && secondaryUrls.add(url));
    config.otherBackgroundUrls?.forEach(url => url && secondaryUrls.add(url));
    config.otherStickerUrls?.forEach(url => url && secondaryUrls.add(url));
    config.uplineAvatarUrls?.forEach(url => url && secondaryUrls.add(url));

    // Filter out already cached
    const criticalToLoad = Array.from(criticalUrls).filter(url => !decodedImages.has(url));
    const secondaryToLoad = Array.from(secondaryUrls).filter(url => !decodedImages.has(url));
    
    const totalToLoad = criticalToLoad.length + secondaryToLoad.length;
    
    // All images already cached - instant complete
    if (totalToLoad === 0) {
      hasLoadedRef.current = true;
      setState({ allLoaded: true, progress: 100, timedOut: false });
      console.log('⚡ All assets cached - instant display');
      return;
    }

    console.log(`⚡ Loading ${criticalToLoad.length} critical + ${secondaryToLoad.length} secondary assets...`);

    // Ultra-aggressive global timeout - show content even if some images fail
    timeoutRef.current = setTimeout(() => {
      if (!abortRef.current) {
        console.log('⚠️ Timeout - showing banner immediately');
        hasLoadedRef.current = true;
        setState({ allLoaded: true, progress: 100, timedOut: true });
      }
    }, GLOBAL_TIMEOUT_MS);

    // *** PHASE 1: Load critical assets first (visible immediately) ***
    let loaded = 0;
    const criticalPromises = criticalToLoad.map(async (url) => {
      await loadImage(url);
      loaded++;
      // Critical assets weight more in progress (60% of total)
      const criticalProgress = (loaded / Math.max(criticalToLoad.length, 1)) * 60;
      updateProgress(criticalProgress);
    });

    await Promise.all(criticalPromises);
    
    // After critical assets - mark ready early (users see banner faster)
    if (!abortRef.current && criticalToLoad.length > 0) {
      console.log('✅ Critical assets loaded - banner visible');
    }

    // *** PHASE 2: Load secondary assets (logos, other slots, stickers) ***
    const secondaryPromises = secondaryToLoad.map(async (url) => {
      await loadImage(url);
      loaded++;
      // Secondary assets fill remaining 40%
      const totalProgress = 60 + ((loaded - criticalToLoad.length) / Math.max(secondaryToLoad.length, 1)) * 40;
      updateProgress(Math.min(totalProgress, 100));
    });

    await Promise.all(secondaryPromises);

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
