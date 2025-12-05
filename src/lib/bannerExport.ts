/**
 * Strict Banner Export System
 * - Fixed output: 1080×1080px (square)
 * - Resolution: 100 PPI
 * - JPEG compression: 3-4.5MB target
 * - No metadata, no upscaling
 * - Internal canvas: 1350px, export scaled to 1080px
 */

import { toJpeg } from 'html-to-image';

// Fixed export dimensions
export const BANNER_SIZE = 1080;
export const INTERNAL_CANVAS_SIZE = 1350; // Design canvas
export const BANNER_RESOLUTION_PPI = 100;
export const TARGET_SIZE_MIN_MB = 3;
export const TARGET_SIZE_MAX_MB = 4.5;

interface ExportOptions {
  element: HTMLElement;
  onProgress?: (progress: number) => void;
}

interface ExportResult {
  dataUrl: string;
  sizeMB: number;
  width: number;
  height: number;
}

/**
 * Calculate optimal JPEG quality to hit target file size (3-4.5MB)
 */
function calculateOptimalQuality(estimatedSize: number): number {
  const estimatedSizeMB = estimatedSize / (1024 * 1024);
  
  // Start with quality 0.92 for optimal clarity
  if (estimatedSizeMB <= TARGET_SIZE_MAX_MB) {
    return 0.92;
  }
  
  // Calculate quality reduction factor
  const targetMB = (TARGET_SIZE_MIN_MB + TARGET_SIZE_MAX_MB) / 2; // 3.75MB target
  const qualityFactor = targetMB / estimatedSizeMB;
  
  // Clamp quality between 0.75 and 0.95 for good clarity
  return Math.max(0.75, Math.min(0.95, qualityFactor * 0.92));
}

/**
 * Get actual size of base64 data URL in bytes
 */
function getDataUrlSize(dataUrl: string): number {
  const base64Length = dataUrl.split(',')[1]?.length || 0;
  return Math.floor(base64Length * 0.75);
}

/**
 * Export banner as optimized JPEG with strict 1080×1080 dimensions
 * Internal canvas is 1350px, scaled down to 1080px for export
 */
export async function exportBanner(options: ExportOptions): Promise<ExportResult> {
  const { element, onProgress } = options;
  
  onProgress?.(10);
  
  // Filter function to exclude UI elements from export
  const filterNode = (node: HTMLElement): boolean => {
    if (!node.classList) return true;
    
    // Exclude UI elements
    if (
      node.classList.contains('slot-selector') ||
      node.classList.contains('control-buttons') ||
      node.classList.contains('whatsapp-float') ||
      node.classList.contains('ignore-download') ||
      node.id === 'ignore-download'
    ) {
      return false;
    }
    return true;
  };
  
  // Calculate pixel ratio to scale from 1350px to 1080px
  // pixelRatio = targetSize / currentSize = 1080 / 1350 = 0.8
  const scaleFactor = BANNER_SIZE / INTERNAL_CANVAS_SIZE;
  
  onProgress?.(30);
  
  // Estimate initial size at high quality
  const estimatedSize = BANNER_SIZE * BANNER_SIZE * 3; // RGB bytes estimate
  const optimalQuality = calculateOptimalQuality(estimatedSize);
  
  onProgress?.(50);
  
  // Export as JPEG with optimal quality, scaled to exact 1080×1080
  let jpegDataUrl = await toJpeg(element, {
    cacheBust: true,
    pixelRatio: scaleFactor, // Scale 1350 -> 1080
    quality: optimalQuality,
    backgroundColor: '#000000', // Black background for JPEG (no transparency)
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
    },
    filter: filterNode,
  });
  
  onProgress?.(70);
  
  // Verify size and adjust if needed
  let finalDataUrl = jpegDataUrl;
  let finalSize = getDataUrlSize(jpegDataUrl);
  let finalSizeMB = finalSize / (1024 * 1024);
  
  // If still too large, reduce quality iteratively
  if (finalSizeMB > TARGET_SIZE_MAX_MB) {
    let quality = optimalQuality - 0.1;
    while (finalSizeMB > TARGET_SIZE_MAX_MB && quality >= 0.6) {
      finalDataUrl = await toJpeg(element, {
        cacheBust: true,
        pixelRatio: scaleFactor,
        quality: quality,
        backgroundColor: '#000000',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
        filter: filterNode,
      });
      finalSize = getDataUrlSize(finalDataUrl);
      finalSizeMB = finalSize / (1024 * 1024);
      quality -= 0.05;
    }
  }
  
  // If too small (under 3MB), increase quality for better clarity
  if (finalSizeMB < TARGET_SIZE_MIN_MB && optimalQuality < 0.95) {
    finalDataUrl = await toJpeg(element, {
      cacheBust: true,
      pixelRatio: scaleFactor,
      quality: 0.95,
      backgroundColor: '#000000',
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
      filter: filterNode,
    });
    finalSize = getDataUrlSize(finalDataUrl);
    finalSizeMB = finalSize / (1024 * 1024);
  }
  
  onProgress?.(100);
  
  return {
    dataUrl: finalDataUrl,
    sizeMB: parseFloat(finalSizeMB.toFixed(2)),
    width: BANNER_SIZE,
    height: BANNER_SIZE,
  };
}

/**
 * Quick export for preview generation (lower quality, faster)
 */
export async function exportBannerQuick(element: HTMLElement): Promise<string> {
  const scaleFactor = BANNER_SIZE / INTERNAL_CANVAS_SIZE;
  
  return toJpeg(element, {
    cacheBust: true,
    pixelRatio: scaleFactor,
    quality: 0.8,
    backgroundColor: '#000000',
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
    },
  });
}
