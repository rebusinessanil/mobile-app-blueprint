/**
 * Mobile-Optimized Background Remover (1-3s target, 832px, High Quality)
 * - 832px max size for enhanced sharpness
 * - WASM inference (mobile/CPU-safe)
 * - Direct alpha mask with flat iteration (no nested loops)
 * - Fast image preloading with decode() and createImageBitmap()
 * - Reusable canvas elements
 * - Immediate memory cleanup
 * - Non-blocking, high quality output
 */

import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

// Configure transformers.js for mobile
env.allowLocalModels = false;
env.useBrowserCache = true;

// 832px for quality while maintaining 1-3s speed
const MAX_MOBILE_SIZE = 832;

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
  if (canvasPool.length < 3) {
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
  if (loadPromise) return loadPromise;
  
  isLoading = true;
  
  loadPromise = (async () => {
    try {
      onProgress?.('Loading AI model...', 10);
      
      const [loadedModel, loadedProcessor] = await Promise.all([
        AutoModel.from_pretrained('briaai/RMBG-1.4', { device: 'wasm' }),
        AutoProcessor.from_pretrained('briaai/RMBG-1.4')
      ]);
      
      model = loadedModel;
      processor = loadedProcessor;
      
      console.log('RMBG-1.4 loaded with WASM (832px max)');
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
  await img.decode();
  return img;
}

/**
 * High-quality resize using createImageBitmap
 */
async function resizeMobileFast(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  maxSize: number = MAX_MOBILE_SIZE
): Promise<{ w: number; h: number }> {
  const originalW = img.naturalWidth;
  const originalH = img.naturalHeight;
  let w = originalW;
  let h = originalH;

  if (w > maxSize || h > maxSize) {
    const scale = Math.min(maxSize / w, maxSize / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  canvas.width = w;
  canvas.height = h;
  
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
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
    }
  } else {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
  }
  
  return { w, h };
}

/**
 * Build lookup table for mask to image coordinate mapping
 * Pre-computes all mappings to avoid repeated calculations in the loop
 */
function buildCoordLookup(imgSize: number, maskSize: number): Uint16Array {
  const lookup = new Uint16Array(imgSize);
  const scale = maskSize / imgSize;
  for (let i = 0; i < imgSize; i++) {
    lookup[i] = Math.floor(i * scale);
  }
  return lookup;
}

/**
 * Apply alpha mask using flat iteration with TypedArrays
 * Optimized for mobile - no nested loops, direct memory access
 */
function applyAlphaMaskFast(
  data: Uint8ClampedArray,
  mask: Float32Array,
  w: number,
  h: number,
  mw: number,
  mh: number
): void {
  // Pre-compute coordinate lookup tables
  const xLookup = buildCoordLookup(w, mw);
  const yLookup = buildCoordLookup(h, mh);
  
  const pixelCount = w * h;
  
  // Flat iteration - single loop over all pixels
  for (let i = 0; i < pixelCount; i++) {
    const x = i % w;
    const y = (i / w) | 0; // Fast integer division
    
    // Get mask value using pre-computed lookup
    const mx = xLookup[x];
    const my = yLookup[y];
    const alpha = mask[my * mw + mx];
    
    // Simple threshold for clean edges (avoid complex math)
    const finalAlpha = alpha < 0.1 ? 0 : alpha > 0.9 ? 255 : (alpha * 255) | 0;
    
    // Direct alpha channel write (every 4th byte starting at offset 3)
    data[(i << 2) + 3] = finalAlpha;
  }
}

/**
 * Remove background with mobile-optimized flow (1-3s target, 832px, high quality)
 */
export async function removeBackgroundMobile(
  image: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> {
  const startTime = performance.now();
  
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
    
    const { w, h } = await resizeMobileFast(canvas, ctx, image, MAX_MOBILE_SIZE);
    console.log(`Resize to ${w}x${h}: ${(performance.now() - startTime).toFixed(0)}ms`);

    raw = await RawImage.fromCanvas(canvas);

    onProgress?.('Processing...', 50);
    
    const inferenceStart = performance.now();
    const { pixel_values } = await loadedProcessor(raw);
    const { output } = await loadedModel({ input: pixel_values });
    console.log(`Inference: ${(performance.now() - inferenceStart).toFixed(0)}ms`);

    onProgress?.('Applying mask...', 75);

    const maskData = output[0][0].data as Float32Array;
    const mw = output[0][0].dims[1];
    const mh = output[0][0].dims[0];

    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d', { willReadFrequently: true });
    if (!outCtx) throw new Error('Could not get output canvas context');
    
    outCtx.drawImage(canvas, 0, 0);

    const imgData = outCtx.getImageData(0, 0, w, h);
    
    // Use optimized flat iteration for alpha mask
    applyAlphaMaskFast(imgData.data, maskData, w, h, mw, mh);

    outCtx.putImageData(imgData, 0, 0);

    onProgress?.('Finalizing...', 90);

    return new Promise<Blob>((resolve, reject) => {
      outCanvas.toBlob((blob) => {
        returnCanvas(canvas);
        returnCanvas(outCanvas);
        raw = null;
        
        const totalTime = performance.now() - startTime;
        console.log(`Total background removal: ${totalTime.toFixed(0)}ms (${w}x${h})`);
        
        if (blob) {
          onProgress?.('Complete!', 100);
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png', 1.0);
    });
    
  } catch (error) {
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
