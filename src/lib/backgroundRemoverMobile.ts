/**
 * Mobile-Optimized Background Remover
 * - Small max size (512px) for ultra-fast processing
 * - Direct alpha mask (no edge refinement)
 * - WASM inference (mobile-safe)
 * - Reusable canvas elements
 * - Immediate memory cleanup
 * - Fast image preloading with decode()
 */

import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

// Configure transformers.js for mobile
env.allowLocalModels = false;
env.useBrowserCache = true;

// Smaller size for faster mobile processing
const MAX_MOBILE_SIZE = 512;

let model: any = null;
let processor: any = null;
let isLoading = false;

// Reusable canvas elements to avoid allocation overhead
let reusableCanvas: HTMLCanvasElement | null = null;
let reusableOutCanvas: HTMLCanvasElement | null = null;

function getReusableCanvas(): HTMLCanvasElement {
  if (!reusableCanvas) {
    reusableCanvas = document.createElement('canvas');
  }
  return reusableCanvas;
}

function getReusableOutCanvas(): HTMLCanvasElement {
  if (!reusableOutCanvas) {
    reusableOutCanvas = document.createElement('canvas');
  }
  return reusableOutCanvas;
}

/**
 * Load model with WASM inference for mobile
 */
export async function loadMobileModel(onProgress?: (stage: string, percent: number) => void) {
  if (model && processor) return { model, processor };
  
  // Prevent concurrent loading
  if (isLoading) {
    while (isLoading) {
      await new Promise(r => setTimeout(r, 50));
    }
    if (model && processor) return { model, processor };
  }
  
  isLoading = true;
  
  try {
    onProgress?.('Loading AI model...', 10);
    
    // Use WASM for mobile-safe, predictable performance
    model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
      device: 'wasm',
    });
    
    processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4');
    
    console.log('RMBG-1.4 loaded with WASM (mobile-optimized)');
    onProgress?.('Model ready', 25);
    
    return { model, processor };
  } finally {
    isLoading = false;
  }
}

/**
 * Resize image to mobile-friendly dimensions (512px max)
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
 * - Reuses canvas elements
 * - Immediate cleanup after processing
 */
export async function removeBackgroundMobile(
  image: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> {
  let raw: any = null;
  
  try {
    onProgress?.('Initializing...', 5);
    const { model: loadedModel, processor: loadedProcessor } = await loadMobileModel(onProgress);

    onProgress?.('Preparing...', 30);
    
    const canvas = getReusableCanvas();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas context');
    
    const { w, h } = resizeMobile(canvas, ctx, image);

    raw = await RawImage.fromCanvas(canvas);

    onProgress?.('Processing...', 50);
    
    const { pixel_values } = await loadedProcessor(raw);
    const { output } = await loadedModel({ input: pixel_values });

    onProgress?.('Applying mask...', 75);

    const mask = output[0][0].data;
    const mw = output[0][0].dims[1];
    const mh = output[0][0].dims[0];

    const outCanvas = getReusableOutCanvas();
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d', { willReadFrequently: true });
    if (!outCtx) throw new Error('Could not get output canvas context');
    
    outCtx.drawImage(canvas, 0, 0);

    const imgData = outCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Simple direct alpha mask - no edge refinement for speed
    const wRatio = mw / w;
    const hRatio = mh / h;
    
    for (let y = 0; y < h; y++) {
      const my = Math.floor(y * hRatio);
      const rowOffset = my * mw;
      const pixelRowOffset = y * w;
      
      for (let x = 0; x < w; x++) {
        const mx = Math.floor(x * wRatio);
        const alpha = mask[rowOffset + mx];
        // Simple threshold for clean edges
        data[(pixelRowOffset + x) * 4 + 3] = alpha > 0.5 ? 255 : 0;
      }
    }

    outCtx.putImageData(imgData, 0, 0);

    onProgress?.('Finalizing...', 90);

    return new Promise<Blob>((resolve, reject) => {
      outCanvas.toBlob((blob) => {
        // Clear raw reference
        raw = null;
        
        if (blob) {
          onProgress?.('Complete!', 100);
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    });
    
  } catch (error) {
    raw = null;
    console.error('Mobile background removal error:', error);
    throw error;
  }
}

/**
 * Fast image loading with decode() for quick display
 * Uses createImageBitmap when available for faster decoding
 */
export async function loadImageMobile(file: Blob): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  
  try {
    const img = new Image();
    img.src = objectUrl;
    
    // Use decode() for faster image decoding
    await img.decode();
    
    URL.revokeObjectURL(objectUrl);
    return img;
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Failed to load image');
  }
}

/**
 * Fast image loading from URL with decode()
 */
export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  
  // Use decode() for faster image decoding
  await img.decode();
  
  return img;
}

/**
 * Preload image quickly - returns immediately after decode
 * Minimizes "Loading image..." time
 */
export async function preloadImageFast(file: Blob): Promise<HTMLImageElement> {
  // Use createImageBitmap for faster decoding if available
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file);
      
      // Convert bitmap to img element
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        
        const dataUrl = canvas.toDataURL('image/png');
        canvas.width = canvas.height = 0;
        
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        return img;
      }
      bitmap.close();
    } catch (e) {
      // Fallback to regular loading
    }
  }
  
  return loadImageMobile(file);
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
  
  processor = null;
  
  // Clear reusable canvases
  if (reusableCanvas) {
    reusableCanvas.width = reusableCanvas.height = 0;
    reusableCanvas = null;
  }
  if (reusableOutCanvas) {
    reusableOutCanvas.width = reusableOutCanvas.height = 0;
    reusableOutCanvas = null;
  }
}
