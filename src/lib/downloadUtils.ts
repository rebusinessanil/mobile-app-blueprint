/**
 * Robust download utilities with proper memory management
 * Handles large images without freezing UI on low-end devices
 */

/**
 * Download an image with proper memory cleanup
 * Uses fetch → blob → createObjectURL → revokeObjectURL pattern
 */
export const downloadImage = async (
  imageUrl: string,
  filename: string = 'banner.png'
): Promise<boolean> => {
  try {
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    // Fetch image as blob
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      mode: 'cors',
      cache: 'force-cache', // Use cached version if available
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Get blob in chunks to avoid memory spike
    const blob = await response.blob();

    // Create temporary URL
    const blobUrl = URL.createObjectURL(blob);

    // Use requestIdleCallback or setTimeout to not block UI
    await new Promise<void>((resolve) => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => resolve(), { timeout: 100 });
      } else {
        setTimeout(resolve, 0);
      }
    });

    // Create invisible anchor and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup immediately after click is processed
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        resolve();
      }, 100);
    });

    return true;
  } catch (error) {
    console.error('Download failed:', error);
    
    // Fallback: open in new tab for manual save
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Download timed out, opening in new tab');
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
 * Download image from canvas element
 * More memory-efficient for generated banners
 */
export const downloadFromCanvas = async (
  canvas: HTMLCanvasElement,
  filename: string = 'banner.png',
  quality: number = 0.92
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(false);
            return;
          }

          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();

          // Cleanup
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
            resolve(true);
          }, 100);
        },
        'image/png',
        quality
      );
    } catch {
      resolve(false);
    }
  });
};

/**
 * Download multiple images with controlled concurrency
 * Prevents memory overload on batch downloads
 */
export const downloadBatch = async (
  images: Array<{ url: string; filename: string }>,
  concurrency: number = 2
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  // Process in batches
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

    // Small delay between batches to let GC work
    if (i + concurrency < images.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return { success, failed };
};

/**
 * Share image using Web Share API (mobile-friendly)
 * Falls back to download if sharing not supported
 */
export const shareImage = async (
  imageUrl: string,
  title: string = 'Check out my banner!'
): Promise<boolean> => {
  try {
    // Check if Web Share API is available
    if (!navigator.share) {
      return downloadImage(imageUrl, 'banner.png');
    }

    // Fetch image as blob for sharing
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'banner.png', { type: blob.type });

    await navigator.share({
      title,
      files: [file],
    });

    return true;
  } catch (error) {
    // User cancelled or error
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
};
