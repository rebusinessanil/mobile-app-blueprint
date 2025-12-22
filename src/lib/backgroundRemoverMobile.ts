/**
 * Fast Mobile-Optimized Background Remover
 * - Max size: 832px for high quality
 * - Direct alpha mask (no edge refinement)
 * - Flat iteration with TypedArrays
 * - CPU-safe WASM inference
 * - Reusable canvas for memory efficiency
 * - Preloaded model for instant processing
 */

import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_MOBILE_SIZE = 832;

let model: any = null;
let processor: any = null;
let isLoading = false;

// Reusable canvas
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;
const outCanvas = document.createElement('canvas');
const outCtx = outCanvas.getContext('2d')!;

/**
 * Preload model at app startup for instant processing
 */
export async function preloadMobileModel() {
  if (model && processor) return;
  if (isLoading) return;

  isLoading = true;
  try {
    model = await AutoModel.from_pretrained('briaai/RMBG-1.4', { device: 'wasm' });
    processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4');
    console.log('Mobile model preloaded');
  } finally {
    isLoading = false;
  }
}

/**
 * Resize image for mobile
 */
function resizeMobile(img: HTMLImageElement) {
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
 */
export async function removeBackgroundMobile(
  img: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> {
  if (!model || !processor) await preloadMobileModel();

  onProgress?.('Preparing image...', 20);
  const { w, h } = resizeMobile(img);

  // Process through model
  onProgress?.('Processing...', 50);

  // AutoProcessor expects a RawImage (passing a canvas object can crash preprocess)
  const imageUrl = canvas.toDataURL('image/png', 1.0);
  const rawImage = await RawImage.fromURL(imageUrl);

  const processorResult = await processor(rawImage);

  if (!processorResult || !processorResult.pixel_values) {
    console.warn('Processor returned invalid result, returning original image');
    return createOriginalBlob(w, h);
  }

  const modelResult = await model({ input: processorResult.pixel_values });
  
  // Check model output before destructuring
  if (!modelResult?.output?.[0]?.[0]?.data) {
    console.warn('Model returned invalid output, returning original image');
    return createOriginalBlob(w, h);
  }

  onProgress?.('Applying mask...', 70);

  const maskData = modelResult.output[0][0];
  const mask = maskData.data;
  const mw = maskData.dims?.[1] || w;
  const mh = maskData.dims?.[0] || h;

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  
  // Convert to typed array for fast iteration
  const maskLen = mask.length;
  const typedMask = mask instanceof Uint8ClampedArray ? mask : new Float32Array(mask);

  // Flat iteration for alpha mask with bounds checking
  const pixelCount = w * h;
  for (let i = 0; i < pixelCount; i++) {
    const x = i % w;
    const y = Math.floor(i / w);
    const mx = Math.floor(x / w * mw);
    const my = Math.floor(y / h * mh);
    const maskIdx = my * mw + mx;
    const alpha = maskIdx < maskLen ? typedMask[maskIdx] : 0;
    data[i * 4 + 3] = alpha > 0.5 ? 255 : 0;
  }

  outCtx.putImageData(imgData, 0, 0);

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
export function clearMobileModel() {
  if (model?.dispose) model.dispose();
  model = null;
  processor = null;
  console.log('Mobile model cleared');
}
