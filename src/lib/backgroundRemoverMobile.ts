/**
 * Mobile-Optimized Background Remover (~3s target)
 * - 640px max size for fast processing
 * - WASM inference (mobile-safe)
 * - Direct alpha mask (no edge refinement)
 * - Fast image preloading with decode() and createImageBitmap()
 * - Reusable canvas elements
 * - Immediate memory cleanup
 * - Non-blocking, high quality output
 */

import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

// Configure transformers.js for mobile
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_MOBILE_SIZE = 640;

let model: any = null;
let processor: any = null;
let isLoading = false;
let loadPromise: Promise<{ model: any; processor: any }> | null = null;

// Reusable canvas pool for performance
const canvasPool: HTMLCanvasElement[] = [];

function getCanvas(): HTMLCanvasElement {
  return canvasPool.pop() || document.createElement('canvas');
}

function returnCanvas(canvas: HTMLCanvasElement) {
  // Reset and return to pool (max 2 canvases)
  if (canvasPool.length < 2) {
    canvas.width = 1;
    canvas.height = 1;
    canvasPool.push(canvas);
  } else {
    canvas.width = canvas.height = 0;
  }
}

/**
 * Load model with WASM inference - cached for reuse
 */
async function loadMobileModel(onProgress?: (stage: string, percent: number) => void) {
  if (model && processor) return { model, processor };
  
  // Return existing promise if already loading
  if (loadPromise) return loadPromise;
  
  isLoading = true;
  
  loadPromise = (async () => {
    try {
      onProgress?.('Loading AI model...', 10);
      
      // Load model and processor in parallel
      const [loadedModel, loadedProcessor] = await Promise.all([
        AutoModel.from_pretrained('briaai/RMBG-1.4', {
          device: 'wasm',
        }),
        AutoProcessor.from_pretrained('briaai/RMBG-1.4')
      ]);
      
      model = loadedModel;
      processor = loadedProcessor;
      
      console.log('RMBG-1.4 loaded with WASM (mobile-optimized)');
      onProgress?.('Model ready', 25);
      
      return { model, processor };
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();
  
  return loadPromise;
}

/**
 * Fast image loading with decode() for non-blocking performance
 */
export async function loadImageMobileFast(file: Blob): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  
  try {
    const img = new Image();
    img.src = objectUrl;
    
    // Use decode() for non-blocking image decoding
    await img.decode();
    
    return img;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Fast image loading from URL with decode()
 */
export async function loadImageFromUrlFast(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  
  // Use decode() for non-blocking image decoding
  await img.decode();
  
  return img;
}

/**
 * Resize image using createImageBitmap for speed
 */
async function resizeMobileFast(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement
): Promise<{ w: number; h: number }> {
  let w = img.naturalWidth;
  let h = img.naturalHeight;

  if (w > MAX_MOBILE_SIZE || h > MAX_MOBILE_SIZE) {
    const scale = Math.min(MAX_MOBILE_SIZE / w, MAX_MOBILE_SIZE / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  canvas.width = w;
  canvas.height = h;
  
  // Use createImageBitmap for faster rendering when available
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(img, {
        resizeWidth: w,
        resizeHeight: h,
        resizeQuality: 'high'
      });
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
    } catch {
      // Fallback to regular drawImage
      ctx.drawImage(img, 0, 0, w, h);
    }
  } else {
    ctx.drawImage(img, 0, 0, w, h);
  }
  
  return { w, h };
}

/**
 * Remove background with mobile-optimized flow (~3s target)
 * - Fast image preloading
 * - Canvas reuse
 * - Direct alpha mask (no edge refinement)
 * - High quality output
 */
export async function removeBackgroundMobile(
  image: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> {
  const startTime = performance.now();
  
  // Get reusable canvases
  const canvas = getCanvas();
  const outCanvas = getCanvas();
  let raw: any = null;
  
  try {
    onProgress?.('Loading model...', 5);
    const { model: loadedModel, processor: loadedProcessor } = await loadMobileModel(onProgress);
    console.log(`Model load: ${(performance.now() - startTime).toFixed(0)}ms`);

    onProgress?.('Preparing image...', 30);
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Use fast resize with createImageBitmap
    const { w, h } = await resizeMobileFast(canvas, ctx, image);
    console.log(`Resize to ${w}x${h}: ${(performance.now() - startTime).toFixed(0)}ms`);

    raw = await RawImage.fromCanvas(canvas);

    onProgress?.('Processing...', 50);
    
    const inferenceStart = performance.now();
    const { pixel_values } = await loadedProcessor(raw);
    const { output } = await loadedModel({ input: pixel_values });
    console.log(`Inference: ${(performance.now() - inferenceStart).toFixed(0)}ms`);

    onProgress?.('Applying mask...', 75);

    const mask = output[0][0].data;
    const mw = output[0][0].dims[1];
    const mh = output[0][0].dims[0];

    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d', { willReadFrequently: true });
    if (!outCtx) throw new Error('Could not get output canvas context');
    
    outCtx.drawImage(canvas, 0, 0);

    const imgData = outCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Optimized alpha mask loop with typed array access
    const maskLen = mask.length;
    const scaleX = mw / w;
    const scaleY = mh / h;
    
    for (let y = 0; y < h; y++) {
      const rowOffset = y * w;
      const maskRowBase = Math.floor(y * scaleY) * mw;
      
      for (let x = 0; x < w; x++) {
        const mx = Math.floor(x * scaleX);
        const alpha = mask[maskRowBase + mx];
        // Binary threshold for sharp edges
        data[(rowOffset + x) * 4 + 3] = alpha > 0.5 ? 255 : 0;
      }
    }

    outCtx.putImageData(imgData, 0, 0);

    onProgress?.('Finalizing...', 90);

    return new Promise<Blob>((resolve, reject) => {
      outCanvas.toBlob((blob) => {
        // Return canvases to pool
        returnCanvas(canvas);
        returnCanvas(outCanvas);
        raw = null;
        
        const totalTime = performance.now() - startTime;
        console.log(`Total background removal: ${totalTime.toFixed(0)}ms`);
        
        if (blob) {
          onProgress?.('Complete!', 100);
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png', 1.0); // Full quality PNG
    });
    
  } catch (error) {
    // Return canvases to pool on error
    returnCanvas(canvas);
    returnCanvas(outCanvas);
    console.error('Mobile background removal error:', error);
    throw error;
  }
}

/**
 * Legacy loader for compatibility
 */
export function loadImageMobile(file: Blob): Promise<HTMLImageElement> {
  return loadImageMobileFast(file);
}

/**
 * Legacy URL loader for compatibility
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return loadImageFromUrlFast(url);
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
  loadPromise = null;
  
  // Clear canvas pool
  canvasPool.forEach(c => { c.width = c.height = 0; });
  canvasPool.length = 0;
  
  console.log('Mobile model cleared from memory');
}

/**
 * Preload model for faster first use
 */
export async function preloadMobileModel(): Promise<void> {
  try {
    await loadMobileModel();
    console.log('Mobile model preloaded');
  } catch (e) {
    console.warn('Failed to preload mobile model:', e);
  }
}
