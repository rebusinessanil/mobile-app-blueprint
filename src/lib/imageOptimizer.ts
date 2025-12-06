/**
 * Image optimization utilities for mobile performance
 * - Compression
 * - WebP conversion
 * - Blur-up placeholders
 * - Lazy loading helpers
 */

// Generate a tiny blur placeholder (20px wide)
export const generateBlurPlaceholder = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }
      
      // Tiny thumbnail for blur
      const size = 20;
      const aspectRatio = img.width / img.height;
      canvas.width = size;
      canvas.height = Math.round(size / aspectRatio);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Return as low-quality base64
      resolve(canvas.toDataURL('image/jpeg', 0.1));
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
};

// Compress and optionally convert to WebP
export const compressImage = async (
  file: File | Blob,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): Promise<Blob> => {
  const {
    maxWidth = 1080,
    maxHeight = 1080,
    quality = 0.8,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Check WebP support
      const mimeType = format === 'webp' && supportsWebP() 
        ? 'image/webp' 
        : format === 'jpeg' 
          ? 'image/jpeg' 
          : 'image/png';

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        mimeType,
        quality
      );

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

// Check WebP support (cached)
let webpSupported: boolean | null = null;
export const supportsWebP = (): boolean => {
  if (webpSupported !== null) return webpSupported;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  return webpSupported;
};

// Get optimized image URL with Supabase transformations
export const getOptimizedImageUrl = (
  url: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string => {
  if (!url || !url.includes('supabase.co/storage')) {
    return url;
  }

  const { width = 400, quality = 75 } = options;
  
  // Supabase image transformation
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}&quality=${quality}`;
};

// Preload critical images
export const preloadImages = (urls: string[]): void => {
  urls.forEach(url => {
    if (!url) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

// Create low-res thumbnail URL for blur-up
export const getThumbnailUrl = (url: string, size: number = 40): string => {
  if (!url) return '';
  
  if (url.includes('supabase.co/storage')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${size}&quality=20`;
  }
  
  return url;
};
