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

// Mobile-safe timeouts
const GLOBAL_TIMEOUT_MS = 8000;
const PER_IMAGE_TIMEOUT_MS = 4000;
const PROGRESS_THROTTLE_MS = 150;

// Image cache to prevent duplicate requests
const imageCache = new Map<string, Promise<boolean>>();

/**
 * Optimized Banner asset preloader
 * - Deduplicates requests via cache
 * - Batched loading with mobile-safe limits
 * - Throttled progress updates to reduce re-renders
 * - Async image decoding for smooth performance
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  /**
   * Load single image with caching and async decode
   */
  const loadImage = useCallback((url: string): Promise<boolean> => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return Promise.resolve(true);
    }

    // Return cached promise if already loading/loaded
    if (imageCache.has(url)) {
      return imageCache.get(url)!;
    }

    const promise = new Promise<boolean>((resolve) => {
      const img = new Image();
      if ('decode' in img) img.decoding = 'async';
      
      const imgTimeout = setTimeout(() => resolve(true), PER_IMAGE_TIMEOUT_MS);
      
      img.onload = async () => {
        clearTimeout(imgTimeout);
        try {
          if ('decode' in img) await img.decode();
        } catch {
          // Decode failed but image is loaded
        }
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(imgTimeout);
        resolve(true); // Continue on error
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
   * Main preload - batched loading with deduplication
   */
  const preloadAssets = useCallback(async (config: PreloadConfig): Promise<void> => {
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
    
    if (uniqueUrls.length === 0) {
      setState({ allLoaded: true, progress: 100, timedOut: false });
      return;
    }

    console.log(`📦 Preloading ${uniqueUrls.length} unique assets...`);

    // Global timeout fallback
    timeoutRef.current = setTimeout(() => {
      if (!abortRef.current) {
        console.log('⚠️ Timeout reached - showing preview');
        setState({ allLoaded: true, progress: 100, timedOut: true });
      }
    }, GLOBAL_TIMEOUT_MS);

    // Batch size based on device capability
    const batchSize = isLowMemory ? 2 : isMobile ? 3 : 6;
    let loaded = 0;
    const total = uniqueUrls.length;

    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      if (abortRef.current) break;
      
      const batch = uniqueUrls.slice(i, i + batchSize);
      await Promise.all(batch.map(loadImage));
      
      loaded += batch.length;
      updateProgress((loaded / total) * 100);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!abortRef.current) {
      console.log('✅ All assets loaded');
      setState({ allLoaded: true, progress: 100, timedOut: false });
    }
  }, [isMobile, isLowMemory, loadImage, updateProgress]);

  /**
   * Reset preloader state
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
  };
};

export default useBannerAssetPreloader;
