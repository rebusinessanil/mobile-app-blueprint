/**
 * Fast Mobile-Optimized Background Remover
 * - Max size: 832px for high quality sharp output
 * - Direct alpha mask (no edge refinement)
 * - Flat iteration with TypedArrays
 * - CPU-safe WASM inference
 * - Reusable canvas for memory efficiency
 * - Preloaded model for instant processing
 */

import { pipeline, env, RawImage } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_MOBILE_SIZE = 832;

let segmenter: any = null;
let isLoading = false;

// Reusable canvases for memory efficiency
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
const outCanvas = document.createElement('canvas');
const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;

/**
 * Preload model at app startup for instant processing
 */
export async function preloadMobileModel(): Promise<void> {
  if (segmenter) return;
  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return;
  }

  isLoading = true;
  try {
    segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device: 'wasm',
    });
    console.log('Mobile segmentation model preloaded');
  } catch (error) {
    console.error('Failed to preload model:', error);
    throw error;
  } finally {
    isLoading = false;
  }
}

/**
 * Resize image for mobile with max 832px dimension
 */
function resizeMobile(img: HTMLImageElement): { w: number; h: number } {
  let w = img.naturalWidth;
  let h = img.naturalHeight;

  if (w > MAX_MOBILE_SIZE || h > MAX_MOBILE_SIZE) {
    const scale = Math.min(MAX_MOBILE_SIZE / w, MAX_MOBILE_SIZE / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  outCanvas.width = w;
  outCanvas.height = h;

  return { w, h };
}

/**
 * Create blob from original image (fallback when model fails)
 */
function createOriginalBlob(w: number, h: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    outCanvas.width = w;
    outCanvas.height = h;
    outCtx.drawImage(canvas, 0, 0);
    outCanvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to create fallback blob')),
      'image/png',
      1.0
    );
  });
}

/**
 * Remove background fast (~1-3s) on mobile
 * Uses Xenova/segformer for reliable browser-based segmentation
 */
export async function removeBackgroundMobile(
  img: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> {
  try {
    // Ensure model is loaded
    if (!segmenter) {
      onProgress?.('Loading model...', 10);
      await preloadMobileModel();
    }

    onProgress?.('Preparing image...', 20);
    const { w, h } = resizeMobile(img);

    // Get image data as base64 for the model
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    onProgress?.('Processing...', 50);

    // Run segmentation
    const result = await segmenter(imageData);

    if (!result || !Array.isArray(result) || result.length === 0) {
      console.warn('Segmentation returned empty result, returning original');
      return createOriginalBlob(w, h);
    }

    onProgress?.('Applying mask...', 70);

    // Get original image data
    const originalImageData = ctx.getImageData(0, 0, w, h);
    const data = originalImageData.data;

    // Find the person/subject mask (typically labeled as 'person' or similar)
    // Combine all foreground masks
    let combinedMask: Float32Array | null = null;
    
    for (const segment of result) {
      if (segment.mask && segment.mask.data) {
        const maskData = segment.mask.data;
        const label = (segment.label || '').toLowerCase();
        
        // Include person, people, and similar foreground objects
        const isForeground = ['person', 'people', 'human', 'man', 'woman', 'child', 'boy', 'girl'].some(
          term => label.includes(term)
        );
        
        if (isForeground) {
          if (!combinedMask) {
            combinedMask = new Float32Array(maskData.length);
          }
          // Combine masks (take max value)
          for (let i = 0; i < maskData.length; i++) {
            combinedMask[i] = Math.max(combinedMask[i], maskData[i]);
          }
        }
      }
    }

    // If no person found, try to use any non-background mask or return original
    if (!combinedMask) {
      // Try inverse approach - remove background segments
      const bgLabels = ['wall', 'floor', 'ceiling', 'sky', 'ground', 'grass', 'road', 'building', 'tree', 'water'];
      let bgMask: Float32Array | null = null;
      
      for (const segment of result) {
        if (segment.mask && segment.mask.data) {
          const label = (segment.label || '').toLowerCase();
          const isBackground = bgLabels.some(term => label.includes(term));
          
          if (isBackground) {
            if (!bgMask) {
              bgMask = new Float32Array(segment.mask.data.length);
            }
            for (let i = 0; i < segment.mask.data.length; i++) {
              bgMask[i] = Math.max(bgMask[i], segment.mask.data[i]);
            }
          }
        }
      }
      
      // Invert background to get foreground
      if (bgMask) {
        combinedMask = new Float32Array(bgMask.length);
        for (let i = 0; i < bgMask.length; i++) {
          combinedMask[i] = 1 - bgMask[i];
        }
      }
    }

    // If still no mask, return original
    if (!combinedMask) {
      console.warn('No suitable mask found, returning original image');
      return createOriginalBlob(w, h);
    }

    // Get mask dimensions from first result
    const maskWidth = result[0].mask.width || w;
    const maskHeight = result[0].mask.height || h;

    // Apply mask with flat iteration using TypedArrays
    const pixelCount = w * h;
    const maskLen = combinedMask.length;

    for (let i = 0; i < pixelCount; i++) {
      const x = i % w;
      const y = Math.floor(i / w);
      
      // Map to mask coordinates
      const mx = Math.floor((x / w) * maskWidth);
      const my = Math.floor((y / h) * maskHeight);
      const maskIdx = my * maskWidth + mx;
      
      // Apply alpha with threshold
      const alpha = maskIdx < maskLen ? combinedMask[maskIdx] : 0;
      data[i * 4 + 3] = alpha > 0.3 ? 255 : 0;
    }

    outCtx.putImageData(originalImageData, 0, 0);

    onProgress?.('Finalizing...', 90);

    return new Promise<Blob>((resolve, reject) => {
      outCanvas.toBlob(
        (blob) => {
          if (blob) {
            onProgress?.('Complete!', 100);
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        0.92
      );
    });
  } catch (error) {
    console.error('Background removal error:', error);
    // Fallback to original image on any error
    const { w, h } = resizeMobile(img);
    return createOriginalBlob(w, h);
  }
}

/**
 * Fast image loading with decode()
 */
export async function loadImageMobileFast(file: Blob): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Fast image loading from URL
 */
export async function loadImageFromUrlFast(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  return img;
}

/**
 * Legacy loaders for compatibility
 */
export const loadImageMobile = loadImageMobileFast;
export const loadImageFromUrl = loadImageFromUrlFast;

/**
 * Clear model & memory
 */
export function clearMobileModel(): void {
  if (segmenter) {
    try {
      if (typeof segmenter.dispose === 'function') {
        segmenter.dispose();
      }
    } catch (e) {
      // Ignore disposal errors
    }
    segmenter = null;
  }
  
  // Clear canvas memory
  canvas.width = 1;
  canvas.height = 1;
  outCanvas.width = 1;
  outCanvas.height = 1;
  
  console.log('Mobile model cleared');
}
