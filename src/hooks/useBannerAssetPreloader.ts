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

// Ultra-fast timeouts for instant loading - aggressive for mobile performance
const GLOBAL_TIMEOUT_MS = 3000; // Reduced from 5000 for faster fallback
const PER_IMAGE_TIMEOUT_MS = 1500; // Reduced from 2000 for faster per-image fallback
const PROGRESS_THROTTLE_MS = 32; // ~30fps update rate for smoother progress

// Global image cache to prevent duplicate requests across renders
const imageCache = new Map<string, Promise<boolean>>();

// Pre-decoded image storage for instant rendering
const decodedImages = new Set<string>();

/**
 * Ultra-fast Banner asset preloader
 * - Single batch parallel loading (no sequential batches)
 * - Global image cache prevents re-fetching
 * - One-time load - never re-triggers after initial load
 * - Instant rendering without animations
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
  const hasLoadedRef = useRef(false); // Prevent re-loading

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  /**
   * Load single image with caching and immediate decode
   */
  const loadImage = useCallback((url: string): Promise<boolean> => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return Promise.resolve(true);
    }

    // Already decoded - instant return
    if (decodedImages.has(url)) {
      return Promise.resolve(true);
    }

    // Return cached promise if already loading
    if (imageCache.has(url)) {
      return imageCache.get(url)!;
    }

    const promise = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      
      const imgTimeout = setTimeout(() => {
        decodedImages.add(url); // Mark as ready even on timeout
        resolve(true);
      }, PER_IMAGE_TIMEOUT_MS);
      
      img.onload = async () => {
        clearTimeout(imgTimeout);
        try {
          await img.decode();
        } catch {
          // Decode failed but image is loaded
        }
        decodedImages.add(url);
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(imgTimeout);
        decodedImages.add(url); // Mark as ready on error too
        resolve(true);
      };
      
      img.crossOrigin = 'anonymous';
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
   * One-time execution - never re-triggers after initial load
   */
  const preloadAssets = useCallback(async (config: PreloadConfig): Promise<void> => {
    // CRITICAL: Prevent re-loading - one-time only
    if (hasLoadedRef.current) {
      console.log('⚡ Assets already loaded - skipping');
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
    
    // Filter out already decoded images
    const urlsToLoad = uniqueUrls.filter(url => !decodedImages.has(url));
    
    if (urlsToLoad.length === 0) {
      hasLoadedRef.current = true;
      setState({ allLoaded: true, progress: 100, timedOut: false });
      return;
    }

    console.log(`⚡ Loading ${urlsToLoad.length} assets in single batch...`);

    // Global timeout fallback
    timeoutRef.current = setTimeout(() => {
      if (!abortRef.current) {
        console.log('⚠️ Timeout - showing preview immediately');
        hasLoadedRef.current = true;
        setState({ allLoaded: true, progress: 100, timedOut: true });
      }
    }, GLOBAL_TIMEOUT_MS);

    // SINGLE BATCH: Load ALL images in parallel at once
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
      console.log('✅ All assets loaded in single batch');
      hasLoadedRef.current = true;
      setState({ allLoaded: true, progress: 100, timedOut: false });
    }
  }, [loadImage, updateProgress]);

  /**
   * Reset preloader state (for component unmount/remount)
   */
  const reset = useCallback(() => {
    abortRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Note: hasLoadedRef is NOT reset to prevent re-loading on state changes
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
  };
};

export default useBannerAssetPreloader;
