/**
 * Fast Mobile-Optimized Background Remover
 * - Max size: 832px for high quality
 * - Direct alpha mask (no edge refinement)
 * - Flat iteration with TypedArrays
 * - CPU-safe WASM inference
 * - Reusable canvas for memory efficiency
 * - Preloaded model for instant processing
 */

import { AutoModel, AutoProcessor, env } from '@huggingface/transformers';

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
  const { pixel_values } = await processor({ image: canvas });
  const { output } = await model({ input: pixel_values });

  onProgress?.('Applying mask...', 70);

  const mask = output[0][0].data;
  const mw = output[0][0].dims[1];
  const mh = output[0][0].dims[0];

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const typedMask = new Uint8ClampedArray(mask);

  // Flat iteration for alpha mask
  for (let i = 0; i < w * h; i++) {
    const mx = Math.floor((i % w) / w * mw);
    const my = Math.floor(Math.floor(i / w) / h * mh);
    const alpha = typedMask[my * mw + mx];
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
