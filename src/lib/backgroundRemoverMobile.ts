/**
 * Mobile-Optimized Background Remover
 * - Small max size (640px) for fast processing
 * - Direct alpha mask (no edge refinement)
 * - CPU-safe inference
 * - Immediate memory cleanup
 * - Non-blocking performance
 */

import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

// Configure transformers.js for mobile
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_MOBILE_SIZE = 640;

let model: any = null;
let processor: any = null;
let isLoading = false;

/**
 * Load model with CPU-safe inference for mobile
 */
async function loadMobileModel(onProgress?: (stage: string, percent: number) => void) {
  if (model && processor) return { model, processor };
  
  // Prevent concurrent loading
  if (isLoading) {
    // Wait for existing load
    while (isLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (model && processor) return { model, processor };
  }
  
  isLoading = true;
  
  try {
    onProgress?.('Loading AI model...', 10);
    
    // Use CPU for mobile-safe, predictable performance
    model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
      device: 'cpu', // CPU-safe for all mobile devices
    });
    
    processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4');
    
    console.log('RMBG-1.4 loaded with CPU (mobile-optimized)');
    onProgress?.('Model loaded', 25);
    
    return { model, processor };
  } finally {
    isLoading = false;
  }
}

/**
 * Resize image to mobile-friendly dimensions
 */
function resizeMobile(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement
): { w: number; h: number } {
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
  
  return { w, h };
}

/**
 * Remove background with mobile-optimized flow
 * - Simple direct alpha mask
 * - No edge refinement or heavy processing
 * - Immediate memory cleanup
 */
export async function removeBackgroundMobile(
  image: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> {
  // Local references for cleanup
  let canvas: HTMLCanvasElement | null = null;
  let outCanvas: HTMLCanvasElement | null = null;
  let raw: any = null;
  
  try {
    onProgress?.('Loading model...', 5);
    const { model: loadedModel, processor: loadedProcessor } = await loadMobileModel(onProgress);

    onProgress?.('Preparing image...', 30);
    
    canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const { w, h } = resizeMobile(canvas, ctx, image);
    console.log(`Mobile processing at ${w}x${h}`);

    raw = await RawImage.fromCanvas(canvas);

    onProgress?.('Processing...', 50);
    
    const { pixel_values } = await loadedProcessor(raw);
    const { output } = await loadedModel({ input: pixel_values });

    onProgress?.('Applying mask...', 75);

    const mask = output[0][0].data;
    const mw = output[0][0].dims[1];
    const mh = output[0][0].dims[0];

    outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) throw new Error('Could not get output canvas context');
    
    outCtx.drawImage(canvas, 0, 0);

    const imgData = outCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Simple direct alpha mask - no edge refinement
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const mx = Math.floor((x / w) * mw);
        const my = Math.floor((y / h) * mh);
        const alpha = mask[my * mw + mx];
        // Simple threshold for clean edges
        data[(y * w + x) * 4 + 3] = alpha > 0.5 ? 255 : 0;
      }
    }

    outCtx.putImageData(imgData, 0, 0);

    onProgress?.('Finalizing...', 90);

    return new Promise<Blob>((resolve, reject) => {
      outCanvas!.toBlob((blob) => {
        // Immediate memory cleanup
        if (canvas) {
          canvas.width = canvas.height = 0;
          canvas = null;
        }
        if (outCanvas) {
          outCanvas.width = outCanvas.height = 0;
          outCanvas = null;
        }
        raw = null;
        
        if (blob) {
          onProgress?.('Complete!', 100);
          console.log('Mobile background removal complete');
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png', 0.92);
    });
    
  } catch (error) {
    // Cleanup on error
    if (canvas) {
      canvas.width = canvas.height = 0;
    }
    if (outCanvas) {
      outCanvas.width = outCanvas.height = 0;
    }
    console.error('Mobile background removal error:', error);
    throw error;
  }
}

/**
 * Load image from blob
 */
export function loadImageMobile(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

/**
 * Load image from URL
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Clear model from memory
 */
export function clearMobileModel() {
  if (model) {
    try {
      if (model.dispose) model.dispose();
    } catch (e) {
      // Ignore disposal errors
    }
    model = null;
  }
  
  if (processor) {
    processor = null;
  }
  
  // Force GC hint
  if (typeof window !== 'undefined' && (window as any).gc) {
    try {
      (window as any).gc();
    } catch (e) {
      // GC not available
    }
  }
  
  console.log('Mobile model cleared from memory');
}
