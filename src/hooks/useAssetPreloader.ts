import { useState, useEffect, useCallback, useRef } from 'react';
import { loadImages, collectBannerAssets, isImageCached } from '@/lib/assetLoader';

interface UseAssetPreloaderOptions {
  backgrounds?: { imageUrl?: string }[];
  profilePhoto?: string | null;
  profilePhotos?: { photo_url?: string }[];
  uplines?: { avatar?: string }[];
  stickers?: { url?: string }[];
  bannerDefaults?: {
    congratulations_image?: string | null;
    logo_left?: string | null;
    logo_right?: string | null;
  } | null;
  rankIcon?: string;
  photo?: string | null;
  additionalUrls?: string[];
  enabled?: boolean;
}

interface UseAssetPreloaderResult {
  isLoaded: boolean;
  progress: number;
  loadedCount: number;
  failedCount: number;
  totalCount: number;
  reload: () => void;
}

/**
 * Hook to preload all banner/page assets before render
 * Returns loading state and progress for smooth UX
 */
export const useAssetPreloader = (
  options: UseAssetPreloaderOptions
): UseAssetPreloaderResult => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const loadStartedRef = useRef(false);
  const mountedRef = useRef(true);
  
  const { enabled = true, additionalUrls = [], ...assetData } = options;
  
  const loadAssets = useCallback(async () => {
    if (!enabled || loadStartedRef.current) return;
    loadStartedRef.current = true;
    
    // Collect all URLs
    const urls = [
      ...collectBannerAssets(assetData),
      ...additionalUrls.filter(Boolean),
    ];
    
    // Filter out already cached images
    const uncachedUrls = urls.filter((url) => !isImageCached(url));
    
    // If all cached, immediately ready
    if (uncachedUrls.length === 0) {
      if (mountedRef.current) {
        setProgress(100);
        setIsLoaded(true);
        setTotalCount(urls.length);
        setLoadedCount(urls.length);
      }
      return;
    }
    
    if (mountedRef.current) {
      setTotalCount(uncachedUrls.length);
    }
    
    // Load with progress tracking
    const result = await loadImages(uncachedUrls, (percent) => {
      if (mountedRef.current) {
        setProgress(percent);
      }
    });
    
    if (mountedRef.current) {
      setLoadedCount(result.loaded);
      setFailedCount(result.failed);
      setIsLoaded(true);
    }
  }, [enabled, assetData, additionalUrls]);
  
  const reload = useCallback(() => {
    loadStartedRef.current = false;
    setIsLoaded(false);
    setProgress(0);
    setLoadedCount(0);
    setFailedCount(0);
    loadAssets();
  }, [loadAssets]);
  
  useEffect(() => {
    mountedRef.current = true;
    loadAssets();
    
    return () => {
      mountedRef.current = false;
    };
  }, [loadAssets]);
  
  return {
    isLoaded,
    progress,
    loadedCount,
    failedCount,
    totalCount,
    reload,
  };
};

export default useAssetPreloader;
