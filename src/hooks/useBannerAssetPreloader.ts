import { useState, useCallback, useRef, useEffect } from 'react';
import { isMobileDevice, isLowMemoryDevice } from './useMobileLiteMode';

interface PreloadConfig {
  // Critical assets shown immediately
  activeBackgroundUrl?: string;
  primaryPhotoUrl?: string;
  downloadIconUrl?: string;
  logoUrls?: string[];
  
  // Visible stickers for current slot
  visibleStickerUrls?: string[];
  
  // Non-critical: other slots, other stickers (lazy loaded)
  otherBackgroundUrls?: string[];
  otherStickerUrls?: string[];
  uplineAvatarUrls?: string[];
}

interface PreloadState {
  criticalLoaded: boolean;
  allLoaded: boolean;
  progress: number;
  timedOut: boolean;
}

// Mobile-safe limits
const MOBILE_PRELOAD_LIMIT = 8; // Max images to preload on mobile
const DESKTOP_PRELOAD_LIMIT = 25;
const CRITICAL_TIMEOUT_MS = 3000; // Fallback timeout for critical assets
const THROTTLE_MS = 150; // Throttle progress updates

/**
 * Mobile-optimized banner asset preloader
 * - Preloads only critical/visible assets first
 * - Shows UI after critical assets load
 * - Lazy loads non-critical assets in background
 * - Throttles progress updates to avoid re-renders
 * - Fallback timeout to unblock UI
 */
export const useBannerAssetPreloader = () => {
  const [state, setState] = useState<PreloadState>({
    criticalLoaded: false,
    allLoaded: false,
    progress: 0,
    timedOut: false,
  });
  
  const isMobile = isMobileDevice();
  const isLowMemory = isLowMemoryDevice();
  const lastProgressUpdate = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Load a single image with async decoding support
   */
  const loadImage = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!url || typeof url !== 'string' || url.trim() === '') {
        resolve(true);
        return;
      }

      const img = new Image();
      
      // Use async decoding on supported browsers
      if ('decode' in img) {
        img.decoding = 'async';
      }
      
      img.onload = async () => {
        // Async decode for smoother rendering
        try {
          if ('decode' in img) {
            await img.decode();
          }
        } catch {
          // Decode failed, but image is loaded
        }
        resolve(true);
      };
      
      img.onerror = () => {
        resolve(false); // Don't block on failed images
      };
      
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }, []);

  /**
   * Throttled progress update to avoid excessive re-renders
   */
  const updateProgress = useCallback((progress: number) => {
    const now = Date.now();
    if (now - lastProgressUpdate.current >= THROTTLE_MS) {
      lastProgressUpdate.current = now;
      setState(prev => ({ ...prev, progress }));
    }
  }, []);

  /**
   * Load critical assets with timeout fallback
   */
  const loadCriticalAssets = useCallback(async (urls: string[]): Promise<void> => {
    const validUrls = urls.filter(Boolean);
    if (validUrls.length === 0) {
      setState(prev => ({ ...prev, criticalLoaded: true, progress: 50 }));
      return;
    }

    // Set timeout fallback - unblock UI if critical assets take too long
    timeoutRef.current = setTimeout(() => {
      if (!abortRef.current) {
        console.log('⚠️ Critical assets timeout - unblocking UI');
        setState(prev => ({ ...prev, criticalLoaded: true, timedOut: true, progress: 50 }));
      }
    }, CRITICAL_TIMEOUT_MS);

    let loaded = 0;
    const total = validUrls.length;

    await Promise.all(
      validUrls.map(async (url) => {
        await loadImage(url);
        loaded++;
        if (!abortRef.current) {
          updateProgress(Math.round((loaded / total) * 50)); // First 50% for critical
        }
      })
    );

    // Clear timeout if we finished before timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!abortRef.current) {
      setState(prev => ({ ...prev, criticalLoaded: true, progress: 50 }));
    }
  }, [loadImage, updateProgress]);

  /**
   * Load non-critical assets in background (lazy)
   */
  const loadNonCriticalAssets = useCallback(async (urls: string[]): Promise<void> => {
    const validUrls = urls.filter(Boolean);
    if (validUrls.length === 0) {
      setState(prev => ({ ...prev, allLoaded: true, progress: 100 }));
      return;
    }

    // Apply mobile limits
    const limit = isLowMemory ? Math.floor(MOBILE_PRELOAD_LIMIT / 2) : (isMobile ? MOBILE_PRELOAD_LIMIT : DESKTOP_PRELOAD_LIMIT);
    const urlsToLoad = validUrls.slice(0, limit);
    
    let loaded = 0;
    const total = urlsToLoad.length;

    // Load in smaller batches on mobile
    const batchSize = isMobile ? 2 : 4;
    for (let i = 0; i < urlsToLoad.length; i += batchSize) {
      if (abortRef.current) break;
      
      const batch = urlsToLoad.slice(i, i + batchSize);
      await Promise.all(batch.map(url => loadImage(url)));
      
      loaded += batch.length;
      if (!abortRef.current) {
        updateProgress(50 + Math.round((loaded / total) * 50)); // Last 50% for non-critical
      }
      
      // Small delay between batches on low-memory devices
      if (isLowMemory && i + batchSize < urlsToLoad.length) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    if (!abortRef.current) {
      setState(prev => ({ ...prev, allLoaded: true, progress: 100 }));
    }
  }, [isMobile, isLowMemory, loadImage, updateProgress]);

  /**
   * Main preload function - progressive loading strategy
   */
  const preloadAssets = useCallback(async (config: PreloadConfig): Promise<void> => {
    abortRef.current = false;
    setState({ criticalLoaded: false, allLoaded: false, progress: 0, timedOut: false });

    // Phase 1: Critical assets (must show immediately)
    const criticalUrls: string[] = [];
    
    if (config.activeBackgroundUrl) criticalUrls.push(config.activeBackgroundUrl);
    if (config.primaryPhotoUrl) criticalUrls.push(config.primaryPhotoUrl);
    if (config.downloadIconUrl) criticalUrls.push(config.downloadIconUrl);
    if (config.logoUrls) criticalUrls.push(...config.logoUrls.filter(Boolean));
    if (config.visibleStickerUrls) criticalUrls.push(...config.visibleStickerUrls.filter(Boolean));

    console.log(`📦 Phase 1: Loading ${criticalUrls.length} critical assets...`);
    await loadCriticalAssets(criticalUrls);

    if (abortRef.current) return;

    // Phase 2: Non-critical assets (lazy loaded in background)
    const nonCriticalUrls: string[] = [];
    
    if (config.otherBackgroundUrls) nonCriticalUrls.push(...config.otherBackgroundUrls.filter(Boolean));
    if (config.otherStickerUrls) nonCriticalUrls.push(...config.otherStickerUrls.filter(Boolean));
    if (config.uplineAvatarUrls) nonCriticalUrls.push(...config.uplineAvatarUrls.filter(Boolean));

    console.log(`📦 Phase 2: Lazy loading ${nonCriticalUrls.length} non-critical assets...`);
    
    // Use requestIdleCallback if available for non-critical loading
    if ('requestIdleCallback' in window) {
      (window as Window & typeof globalThis & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
        if (!abortRef.current) {
          loadNonCriticalAssets(nonCriticalUrls);
        }
      });
    } else {
      // Fallback: small delay then load
      setTimeout(() => {
        if (!abortRef.current) {
          loadNonCriticalAssets(nonCriticalUrls);
        }
      }, 100);
    }
  }, [loadCriticalAssets, loadNonCriticalAssets]);

  /**
   * Reset the preloader state
   */
  const reset = useCallback(() => {
    abortRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState({ criticalLoaded: false, allLoaded: false, progress: 0, timedOut: false });
  }, []);

  return {
    preloadAssets,
    reset,
    criticalLoaded: state.criticalLoaded,
    allLoaded: state.allLoaded,
    progress: state.progress,
    timedOut: state.timedOut,
    isMobile,
  };
};

export default useBannerAssetPreloader;
