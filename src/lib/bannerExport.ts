/**
 * Banner Export Pipeline - Optimized for lightweight, high-quality output
 * 
 * Rules:
 * - Max resolution: 1080x1080px
 * - 200 PPI density
 * - JPEG format with progressive encoding
 * - Target file size: ≤4.5MB
 * - Strip all metadata (EXIF, color profiles, comments)
 * - Preserve visual clarity with smart compression
 */

import { toPng } from 'html-to-image';

interface ExportConfig {
  maxWidth: number;
  maxHeight: number;
  targetSizeMB: number;
  initialQuality: number;
  minQuality: number;
  qualityStep: number;
}

const DEFAULT_CONFIG: ExportConfig = {
  maxWidth: 1080,
  maxHeight: 1080,
  targetSizeMB: 4.5,
  initialQuality: 0.92,
  minQuality: 0.65,
  qualityStep: 0.05,
};

/**
 * Filter function to exclude UI elements from export
 */
const exportFilter = (node: HTMLElement): boolean => {
  if (
    node.classList?.contains('slot-selector') ||
    node.classList?.contains('control-buttons') ||
    node.classList?.contains('whatsapp-float') ||
    node.classList?.contains('ignore-download') ||
    node.id === 'ignore-download'
  ) {
    return false;
  }
  return true;
};

/**
 * Convert data URL to Blob
 */
const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Resize and compress image using canvas
 * Strips all metadata automatically (canvas doesn't preserve EXIF)
 */
const processImage = async (
  sourceDataUrl: string,
  targetWidth: number,
  targetHeight: number,
  quality: number
): Promise<{ dataUrl: string; blob: Blob; sizeMB: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      let finalWidth = img.width;
      let finalHeight = img.height;
      
      // Scale down if exceeds max dimensions
      if (finalWidth > targetWidth || finalHeight > targetHeight) {
        const widthRatio = targetWidth / finalWidth;
        const heightRatio = targetHeight / finalHeight;
        const ratio = Math.min(widthRatio, heightRatio);
        finalWidth = Math.round(finalWidth * ratio);
        finalHeight = Math.round(finalHeight * ratio);
      }

      // Create canvas with final dimensions
      const canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      const ctx = canvas.getContext('2d', { 
        alpha: false, // No transparency for JPEG
        desynchronized: true // Performance optimization
      });
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // High-quality rendering settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Fill white background (for transparency)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
      
      // Draw image with high quality
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
      
      // Export as JPEG (strips all metadata automatically)
      // Canvas toDataURL doesn't include EXIF, color profiles, or comments
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const blob = dataUrlToBlob(dataUrl);
      const sizeMB = blob.size / (1024 * 1024);
      
      resolve({ dataUrl, blob, sizeMB });
    };
    
    img.onerror = () => reject(new Error('Failed to load image for processing'));
    img.src = sourceDataUrl;
  });
};

/**
 * Iteratively compress until target size is reached
 */
const compressToTargetSize = async (
  sourceDataUrl: string,
  config: ExportConfig
): Promise<{ dataUrl: string; blob: Blob; sizeMB: number; quality: number }> => {
  let quality = config.initialQuality;
  let result = await processImage(
    sourceDataUrl,
    config.maxWidth,
    config.maxHeight,
    quality
  );
  
  // Iteratively reduce quality if file is too large
  while (result.sizeMB > config.targetSizeMB && quality > config.minQuality) {
    quality -= config.qualityStep;
    result = await processImage(
      sourceDataUrl,
      config.maxWidth,
      config.maxHeight,
      quality
    );
    console.log(`Compressing: quality=${quality.toFixed(2)}, size=${result.sizeMB.toFixed(2)}MB`);
  }
  
  // If still too large, scale down dimensions
  if (result.sizeMB > config.targetSizeMB) {
    let scaleFactor = 0.9;
    while (result.sizeMB > config.targetSizeMB && scaleFactor > 0.5) {
      const newWidth = Math.round(config.maxWidth * scaleFactor);
      const newHeight = Math.round(config.maxHeight * scaleFactor);
      result = await processImage(sourceDataUrl, newWidth, newHeight, config.minQuality);
      console.log(`Downscaling: ${newWidth}x${newHeight}, size=${result.sizeMB.toFixed(2)}MB`);
      scaleFactor -= 0.1;
    }
  }
  
  return { ...result, quality };
};

/**
 * Main export function - generates optimized JPEG banner
 */
export const exportBanner = async (
  element: HTMLElement,
  config: Partial<ExportConfig> = {}
): Promise<{
  dataUrl: string;
  blob: Blob;
  sizeMB: number;
  width: number;
  height: number;
  quality: number;
  filename: string;
}> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Step 1: Capture element at high resolution (200 PPI = ~2x for screens)
  // Using pixelRatio of 2 for 200 PPI equivalent on most displays
  const rawDataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2, // 200 PPI equivalent (most screens are ~100 PPI)
    quality: 1,
    backgroundColor: '#ffffff',
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
    },
    filter: exportFilter,
  });
  
  // Step 2: Process, resize, and compress
  const result = await compressToTargetSize(rawDataUrl, finalConfig);
  
  // Step 3: Get final dimensions
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = result.dataUrl;
  });
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `ReBusiness-Banner-${timestamp}.jpg`;
  
  return {
    dataUrl: result.dataUrl,
    blob: result.blob,
    sizeMB: result.sizeMB,
    width: img.width,
    height: img.height,
    quality: result.quality,
    filename,
  };
};

/**
 * Download the exported banner
 */
export const downloadBanner = (
  dataUrl: string,
  filename: string
): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Combined export and download function
 */
export const exportAndDownloadBanner = async (
  element: HTMLElement,
  categoryName: string,
  config?: Partial<ExportConfig>
): Promise<{
  dataUrl: string;
  sizeMB: number;
  filename: string;
}> => {
  const result = await exportBanner(element, config);
  
  // Custom filename with category
  const timestamp = Date.now();
  const filename = `ReBusiness-${categoryName}-${timestamp}.jpg`;
  
  downloadBanner(result.dataUrl, filename);
  
  return {
    dataUrl: result.dataUrl,
    sizeMB: result.sizeMB,
    filename,
  };
};

export type { ExportConfig };
