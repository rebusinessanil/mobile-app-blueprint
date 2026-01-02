/**
 * Robust download utilities with proper memory management
 * Optimized for fast mobile downloads with JPEG/PNG compression
 * Handles large images without freezing UI on low-end devices
 */

export interface BannerExportOptions {
  format: 'jpeg' | 'png';
  quality: number; // 0.0 - 1.0
  maxFileSizeMB: number;
  progressive: boolean;
}

// Default export options - optimized for speed and quality
export const DEFAULT_EXPORT_OPTIONS: BannerExportOptions = {
  format: 'jpeg',
  quality: 0.92, // High quality JPEG
  maxFileSizeMB: 5,
  progressive: true,
};

/**
 * Convert base64 data URL to Blob efficiently
 * Avoids memory spikes on low-end devices
 */
export const base64ToBlob = async (
  dataUrl: string,
  mimeType: string = 'image/jpeg'
): Promise<Blob> => {
  // Use fetch API for efficient conversion
  const response = await fetch(dataUrl);
  return response.blob();
};

/**
 * Compress image to target size using canvas
 * Uses iterative quality reduction for smart compression
 */
export const compressToTargetSize = async (
  canvas: HTMLCanvasElement,
  targetSizeMB: number = 5,
  format: 'jpeg' | 'png' = 'jpeg',
  initialQuality: number = 0.92
): Promise<{ blob: Blob; quality: number }> => {
  const maxBytes = targetSizeMB * 1024 * 1024;
  let quality = initialQuality;
  const minQuality = 0.6; // Never go below 60% quality
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  
  // For PNG, no quality control - just export
  if (format === 'png') {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => b ? resolve(b) : reject(new Error('PNG export failed')),
        mimeType
      );
    });
    return { blob, quality: 1 };
  }
  
  // For JPEG, iteratively reduce quality until target size
  let blob: Blob;
  do {
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => b ? resolve(b) : reject(new Error('JPEG export failed')),
        mimeType,
        quality
      );
    });
    
    if (blob.size <= maxBytes) break;
    quality -= 0.05;
  } while (quality >= minQuality);
  
  return { blob, quality };
};

/**
 * Trigger file download with proper memory cleanup
 * Non-blocking, UI-safe implementation
 */
export const triggerDownload = async (
  blob: Blob,
  filename: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    // Yield to UI thread before heavy operations
    requestAnimationFrame(() => {
      try {
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup after download starts
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          resolve(true);
        }, 150);
      } catch (error) {
        console.error('Download trigger failed:', error);
        resolve(false);
      }
    });
  });
};

/**
 * Download an image from URL with proper memory cleanup
 * Uses fetch → blob → createObjectURL → revokeObjectURL pattern
 */
export const downloadImage = async (
  imageUrl: string,
  filename: string = 'banner.png'
): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      mode: 'cors',
      cache: 'force-cache',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    return triggerDownload(blob, filename);
  } catch (error) {
    console.error('Download failed:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Download timed out');
    }
    
    try {
      window.open(imageUrl, '_blank');
    } catch {
      // Silent fail
    }
    
    return false;
  }
};

/**
 * Download image from canvas with JPEG/PNG compression
 * Optimized for fast mobile downloads
 */
export const downloadFromCanvas = async (
  canvas: HTMLCanvasElement,
  filename: string = 'banner.jpg',
  options: Partial<BannerExportOptions> = {}
): Promise<{ success: boolean; sizeMB: number }> => {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  
  try {
    const { blob, quality } = await compressToTargetSize(
      canvas,
      opts.maxFileSizeMB,
      opts.format,
      opts.quality
    );
    
    const sizeMB = blob.size / (1024 * 1024);
    console.log(`📦 Banner: ${sizeMB.toFixed(2)}MB @ ${(quality * 100).toFixed(0)}% quality`);
    
    const success = await triggerDownload(blob, filename);
    return { success, sizeMB };
  } catch (error) {
    console.error('Canvas download failed:', error);
    return { success: false, sizeMB: 0 };
  }
};

/**
 * Clean up banner render state and memory
 * Call after successful download to free resources
 */
export const cleanupBannerMemory = (bannerRef: HTMLDivElement | null) => {
  // Schedule cleanup in idle time to not block UI
  const cleanup = () => {
    // Force garbage collection hint by nullifying references
    if (bannerRef) {
      // Clear any inline styles that might hold image references
      bannerRef.style.backgroundImage = '';
      
      // Remove all image elements from memory
      const images = bannerRef.querySelectorAll('img');
      images.forEach((img) => {
        img.src = '';
        img.srcset = '';
      });
    }
    
    // Clear any remaining blob URLs
    console.log(`🧹 Memory cleanup triggered`);
  };

  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(cleanup, { timeout: 500 });
  } else {
    setTimeout(cleanup, 100);
  }
};

/**
 * Download multiple images with controlled concurrency
 */
export const downloadBatch = async (
  images: Array<{ url: string; filename: string }>,
  concurrency: number = 2
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, i + concurrency);
    
    const results = await Promise.allSettled(
      batch.map(({ url, filename }) => downloadImage(url, filename))
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        success++;
      } else {
        failed++;
      }
    });

    if (i + concurrency < images.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return { success, failed };
};

/**
 * Share image using Web Share API (mobile-friendly)
 */
export const shareImage = async (
  imageUrl: string,
  title: string = 'Check out my banner!'
): Promise<boolean> => {
  try {
    if (!navigator.share) {
      return downloadImage(imageUrl, 'banner.png');
    }

    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'banner.png', { type: blob.type });

    await navigator.share({
      title,
      files: [file],
    });

    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
};

/**
 * Convert HTMLElement to optimized JPEG/PNG blob
 * Uses html-to-image with performance optimizations
 */
export const elementToBlob = async (
  element: HTMLElement,
  options: {
    width: number;
    height: number;
    pixelRatio?: number;
    format?: 'jpeg' | 'png';
    quality?: number;
    filter?: (node: Element) => boolean;
  }
): Promise<{ blob: Blob; dataUrl: string }> => {
  const { toJpeg, toPng } = await import('html-to-image');
  
  const {
    width,
    height,
    pixelRatio = 1.5, // Lower than 2 for faster rendering
    format = 'jpeg',
    quality = 0.92,
    filter,
  } = options;

  const exportFn = format === 'jpeg' ? toJpeg : toPng;
  
  const dataUrl = await exportFn(element, {
    cacheBust: true,
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    pixelRatio,
    quality,
    backgroundColor: format === 'jpeg' ? '#000000' : undefined,
    filter,
  });

  const blob = await base64ToBlob(
    dataUrl,
    format === 'jpeg' ? 'image/jpeg' : 'image/png'
  );

  return { blob, dataUrl };
};
