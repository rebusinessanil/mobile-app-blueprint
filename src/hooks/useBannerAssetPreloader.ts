import { useState, useCallback, useRef, useEffect } from 'react';
import { isMobileDevice, isLowMemoryDevice } from './useMobileLiteMode';

interface PreloadConfig {
  // All assets to preload - backgrounds, stickers, logos, photos
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

// Global timeout to ensure UI never gets stuck
const GLOBAL_TIMEOUT_MS = 12000;
const THROTTLE_MS = 100;

/**
 * Banner asset preloader - waits for 100% loading before showing preview
 * - Loads all assets (backgrounds, stickers, icons, photos) before rendering
 * - Shows progress until fully loaded
 * - Fallback timeout to unblock UI if assets fail
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
   * Load a single image with async decoding
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
      
      // Per-image timeout (5 seconds)
      const imgTimeout = setTimeout(() => {
        resolve(false);
      }, 5000);
      
      img.onload = async () => {
        clearTimeout(imgTimeout);
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
        clearTimeout(imgTimeout);
        resolve(false);
      };
      
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }, []);

  /**
   * Throttled progress update
   */
  const updateProgress = useCallback((progress: number) => {
    const now = Date.now();
    if (now - lastProgressUpdate.current >= THROTTLE_MS) {
      lastProgressUpdate.current = now;
      setState(prev => ({ ...prev, progress: Math.round(progress) }));
    }
  }, []);

  /**
   * Main preload function - loads ALL assets before showing preview
   */
  const preloadAssets = useCallback(async (config: PreloadConfig): Promise<void> => {
    abortRef.current = false;
    setState({ allLoaded: false, progress: 0, timedOut: false });

    // Collect ALL assets to preload
    const allUrls: string[] = [];
    
    // Critical assets first
    if (config.activeBackgroundUrl) allUrls.push(config.activeBackgroundUrl);
    if (config.primaryPhotoUrl) allUrls.push(config.primaryPhotoUrl);
    if (config.downloadIconUrl) allUrls.push(config.downloadIconUrl);
    if (config.logoUrls) allUrls.push(...config.logoUrls.filter(Boolean));
    if (config.visibleStickerUrls) allUrls.push(...config.visibleStickerUrls.filter(Boolean));
    
    // Non-critical assets (other backgrounds, stickers, avatars)
    if (config.otherBackgroundUrls) allUrls.push(...config.otherBackgroundUrls.filter(Boolean));
    if (config.otherStickerUrls) allUrls.push(...config.otherStickerUrls.filter(Boolean));
    if (config.uplineAvatarUrls) allUrls.push(...config.uplineAvatarUrls.filter(Boolean));

    // Remove duplicates
    const uniqueUrls = [...new Set(allUrls)].filter(Boolean);
    
    if (uniqueUrls.length === 0) {
      setState({ allLoaded: true, progress: 100, timedOut: false });
      return;
    }

    console.log(`📦 Loading ${uniqueUrls.length} assets for banner preview...`);

    // Set global timeout fallback
    timeoutRef.current = setTimeout(() => {
      if (!abortRef.current && !state.allLoaded) {
        console.log('⚠️ Global timeout - forcing ready');
        setState({ allLoaded: true, progress: 100, timedOut: true });
      }
    }, GLOBAL_TIMEOUT_MS);

    let loaded = 0;
    const total = uniqueUrls.length;

    // Load in batches to avoid overwhelming mobile
    const batchSize = isLowMemory ? 2 : (isMobile ? 3 : 5);
    
    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      if (abortRef.current) break;
      
      const batch = uniqueUrls.slice(i, i + batchSize);
      await Promise.all(batch.map(url => loadImage(url)));
      
      loaded += batch.length;
      const progress = (loaded / total) * 100;
      updateProgress(progress);
      
      // Small delay between batches on low-memory devices
      if (isLowMemory && i + batchSize < uniqueUrls.length) {
        await new Promise(r => setTimeout(r, 30));
      }
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!abortRef.current) {
      console.log('✅ All assets loaded successfully');
      setState({ allLoaded: true, progress: 100, timedOut: false });
    }
  }, [isMobile, isLowMemory, loadImage, updateProgress, state.allLoaded]);

  /**
   * Reset the preloader state
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
    // Legacy aliases for compatibility
    criticalLoaded: state.allLoaded,
  };
};

export default useBannerAssetPreloader;
