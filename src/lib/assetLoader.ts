/**
 * Asset Loader - Unified asset preloading and caching system
 * Mobile-optimized with aggressive caching and memory management
 */

// Global cache for loaded assets
const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<boolean>>();

// Device-specific image sizing
export const getOptimalImageSize = () => {
  const width = window.innerWidth;
  if (width <= 640) return 512; // Mobile
  if (width <= 1024) return 768; // Tablet
  return 1024; // Desktop
};

/**
 * Load a single image with caching and error handling
 */
export const loadImage = (url: string): Promise<boolean> => {
  if (!url || typeof url !== 'string') return Promise.resolve(false);
  
  // Return cached image immediately
  if (imageCache.has(url)) return Promise.resolve(true);
  
  // Return existing loading promise if in progress
  if (loadingPromises.has(url)) return loadingPromises.get(url)!;
  
  const promise = new Promise<boolean>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      imageCache.set(url, img);
      loadingPromises.delete(url);
      resolve(true);
    };
    
    img.onerror = () => {
      loadingPromises.delete(url);
      resolve(false); // Don't block on failed images
    };
    
    img.src = url;
  });
  
  loadingPromises.set(url, promise);
  return promise;
};

/**
 * Load multiple images with progress tracking
 */
export const loadImages = async (
  urls: string[],
  onProgress?: (percent: number) => void
): Promise<{ loaded: number; failed: number }> => {
  const validUrls = urls.filter(url => url && typeof url === 'string' && url.trim() !== '');
  if (validUrls.length === 0) return { loaded: 0, failed: 0 };
  
  let loaded = 0;
  let failed = 0;
  const total = validUrls.length;
  
  const promises = validUrls.map(async (url) => {
    const success = await loadImage(url);
    if (success) {
      loaded++;
    } else {
      failed++;
    }
    if (onProgress) {
      onProgress(Math.round(((loaded + failed) / total) * 100));
    }
    return success;
  });
  
  await Promise.all(promises);
  return { loaded, failed };
};

/**
 * Check if image is already cached
 */
export const isImageCached = (url: string): boolean => {
  return imageCache.has(url);
};

/**
 * Get cached image element
 */
export const getCachedImage = (url: string): HTMLImageElement | undefined => {
  return imageCache.get(url);
};

/**
 * Preload images lazily using IntersectionObserver
 */
export const createLazyLoader = (
  onLoad?: (url: string) => void
): IntersectionObserver | null => {
  if (typeof IntersectionObserver === 'undefined') return null;
  
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const url = img.dataset.src;
          if (url && !img.src) {
            loadImage(url).then(() => {
              img.src = url;
              img.classList.add('loaded');
              if (onLoad) onLoad(url);
            });
          }
        }
      });
    },
    {
      rootMargin: '50px', // Start loading 50px before entering viewport
      threshold: 0.01,
    }
  );
};

/**
 * Clear image cache to free memory
 */
export const clearImageCache = () => {
  imageCache.clear();
  loadingPromises.clear();
};

/**
 * Clear specific images from cache
 */
export const removeFromCache = (urls: string[]) => {
  urls.forEach((url) => {
    imageCache.delete(url);
    loadingPromises.delete(url);
  });
};

/**
 * Collect all image URLs from banner data
 */
export const collectBannerAssets = (data: {
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
}): string[] => {
  const urls: string[] = [];
  
  // Background images
  data.backgrounds?.forEach((bg) => {
    if (bg.imageUrl) urls.push(bg.imageUrl);
  });
  
  // Profile photos
  if (data.profilePhoto) urls.push(data.profilePhoto);
  data.profilePhotos?.forEach((p) => {
    if (p.photo_url) urls.push(p.photo_url);
  });
  
  // Uplines
  data.uplines?.forEach((u) => {
    if (u.avatar) urls.push(u.avatar);
  });
  
  // Stickers
  data.stickers?.forEach((s) => {
    if (s.url) urls.push(s.url);
  });
  
  // Banner defaults
  if (data.bannerDefaults?.congratulations_image) {
    urls.push(data.bannerDefaults.congratulations_image);
  }
  if (data.bannerDefaults?.logo_left) {
    urls.push(data.bannerDefaults.logo_left);
  }
  if (data.bannerDefaults?.logo_right) {
    urls.push(data.bannerDefaults.logo_right);
  }
  
  // Misc
  if (data.rankIcon) urls.push(data.rankIcon);
  if (data.photo) urls.push(data.photo);
  
  return urls.filter((url) => url && typeof url === 'string');
};

/**
 * Preload dashboard assets
 */
export const collectDashboardAssets = (data: {
  ranks?: { icon?: string }[];
  trips?: { trip_image_url?: string }[];
  birthdays?: { Birthday_image_url?: string }[];
  templates?: { cover_thumbnail_url?: string }[];
  festivals?: { poster_url?: string }[];
}): string[] => {
  const urls: string[] = [];
  
  data.ranks?.forEach((r) => {
    if (r.icon) urls.push(r.icon);
  });
  
  data.trips?.forEach((t) => {
    if (t.trip_image_url) urls.push(t.trip_image_url);
  });
  
  data.birthdays?.forEach((b) => {
    if (b.Birthday_image_url) urls.push(b.Birthday_image_url);
  });
  
  // Limit templates to first 20 for initial load
  data.templates?.slice(0, 20).forEach((t) => {
    if (t.cover_thumbnail_url) urls.push(t.cover_thumbnail_url);
  });
  
  data.festivals?.forEach((f) => {
    if (f.poster_url) urls.push(f.poster_url);
  });
  
  return urls.filter((url) => url && typeof url === 'string');
};
