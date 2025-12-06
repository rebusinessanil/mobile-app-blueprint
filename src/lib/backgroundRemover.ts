/**
 * Ultra-fast background remover using MediaPipe Selfie Segmentation
 * - Runs fully client-side with no API keys
 * - 256px processing for maximum speed (<1 second)
 * - Web Worker compositing for smooth UI
 * - Color-threshold fallback if MediaPipe fails
 */

import { SelfieSegmentation, Results } from '@mediapipe/selfie_segmentation';

// Processing size - small for speed
const PROCESS_SIZE = 256;

let segmenter: SelfieSegmentation | null = null;
let segmenterReady = false;
let segmenterLoading = false;
let compositorWorker: Worker | null = null;

// Pending segmentation callback
let pendingResolve: ((mask: ImageData) => void) | null = null;
let pendingReject: ((err: Error) => void) | null = null;

// Initialize compositor worker
function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  
  if (!compositorWorker) {
    try {
      compositorWorker = new Worker(
        new URL('../workers/segmentation.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (e) {
      console.warn('Segmentation worker not available:', e);
      return null;
    }
  }
  return compositorWorker;
}

// Initialize MediaPipe Selfie Segmentation (Lite model - 2MB)
async function initSegmenter(): Promise<void> {
  if (segmenterReady || segmenterLoading) return;
  
  segmenterLoading = true;
  
  return new Promise((resolve, reject) => {
    try {
      segmenter = new SelfieSegmentation({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
        }
      });
      
      segmenter.setOptions({
        modelSelection: 0, // 0 = Lite model (faster), 1 = Full model
        selfieMode: false,
      });
      
      segmenter.onResults((results: Results) => {
        if (pendingResolve && results.segmentationMask) {
          // Create canvas to get mask as ImageData
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx && results.segmentationMask) {
            canvas.width = results.segmentationMask.width;
            canvas.height = results.segmentationMask.height;
            ctx.drawImage(results.segmentationMask, 0, 0);
            const maskData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            pendingResolve(maskData);
          } else {
            pendingReject?.(new Error('Failed to extract mask'));
          }
          pendingResolve = null;
          pendingReject = null;
        }
      });
      
      // Initialize the segmenter
      segmenter.initialize().then(() => {
        segmenterReady = true;
        segmenterLoading = false;
        console.log('MediaPipe Selfie Segmentation (Lite) ready');
        resolve();
      }).catch((err) => {
        segmenterLoading = false;
        reject(err);
      });
      
    } catch (err) {
      segmenterLoading = false;
      reject(err);
    }
  });
}

// Resize image to processing size
function resizeToProcess(img: HTMLImageElement): { canvas: HTMLCanvasElement; scale: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const scale = Math.min(PROCESS_SIZE / w, PROCESS_SIZE / h, 1);
  
  w = Math.round(w * scale);
  h = Math.round(h * scale);
  
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  
  return { canvas, scale };
}

// Run segmentation and get mask
async function runSegmentation(canvas: HTMLCanvasElement): Promise<ImageData> {
  if (!segmenter || !segmenterReady) {
    throw new Error('Segmenter not ready');
  }
  
  return new Promise((resolve, reject) => {
    pendingResolve = resolve;
    pendingReject = reject;
    
    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      pendingResolve = null;
      pendingReject = null;
      reject(new Error('Segmentation timeout'));
    }, 5000);
    
    const originalResolve = pendingResolve;
    pendingResolve = (mask: ImageData) => {
      clearTimeout(timeout);
      originalResolve(mask);
    };
    
    segmenter!.send({ image: canvas });
  });
}

// Apply mask using worker (off main thread)
async function applyMaskInWorker(
  imageData: Uint8ClampedArray,
  maskData: Uint8ClampedArray,
  width: number,
  height: number
): Promise<Blob> {
  const worker = getWorker();
  
  if (!worker) {
    // Fallback: apply mask on main thread
    return applyMaskOnMainThread(imageData, maskData, width, height);
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Worker timeout')), 10000);
    
    const handler = (ev: MessageEvent) => {
      clearTimeout(timeout);
      worker.removeEventListener('message', handler);
      
      if (ev.data.type === 'RESULT') {
        resolve(new Blob([ev.data.buffer], { type: 'image/png' }));
      } else if (ev.data.type === 'ERROR') {
        reject(new Error(ev.data.message));
      }
    };
    
    worker.addEventListener('message', handler);
    
    const imgBuffer = imageData.buffer.slice(0);
    const maskBuffer = maskData.buffer.slice(0);
    
    worker.postMessage({
      type: 'COMPOSE',
      payload: { imageData: imgBuffer, maskData: maskBuffer, width, height }
    }, [imgBuffer, maskBuffer]);
  });
}

// Main thread fallback for mask application
function applyMaskOnMainThread(
  imageData: Uint8ClampedArray,
  maskData: Uint8ClampedArray,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    const imgData = new ImageData(new Uint8ClampedArray(imageData), width, height);
    
    // Apply mask to alpha channel
    for (let i = 0; i < maskData.length; i++) {
      imgData.data[i * 4 + 3] = maskData[i];
    }
    
    ctx.putImageData(imgData, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png', 1.0);
  });
}

// Color threshold fallback using worker
async function colorThresholdFallback(
  canvas: HTMLCanvasElement
): Promise<Uint8ClampedArray> {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  const worker = getWorker();
  
  if (!worker) {
    // Simple inline threshold
    const mask = new Uint8ClampedArray(canvas.width * canvas.height);
    const data = imageData.data;
    
    // Sample edges for background color
    const bgSamples: number[][] = [];
    for (let x = 0; x < canvas.width; x += 20) {
      bgSamples.push([data[x * 4], data[x * 4 + 1], data[x * 4 + 2]]);
    }
    const avgBg = bgSamples.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0])
      .map(v => v / bgSamples.length);
    
    for (let i = 0; i < mask.length; i++) {
      const idx = i * 4;
      const dist = Math.sqrt(
        Math.pow(data[idx] - avgBg[0], 2) +
        Math.pow(data[idx + 1] - avgBg[1], 2) +
        Math.pow(data[idx + 2] - avgBg[2], 2)
      );
      mask[i] = dist > 40 ? 255 : 0;
    }
    
    return mask;
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Threshold timeout')), 5000);
    
    const handler = (ev: MessageEvent) => {
      clearTimeout(timeout);
      worker.removeEventListener('message', handler);
      
      if (ev.data.type === 'MASK_RESULT') {
        resolve(new Uint8ClampedArray(ev.data.mask));
      } else if (ev.data.type === 'ERROR') {
        reject(new Error(ev.data.message));
      }
    };
    
    worker.addEventListener('message', handler);
    
    const buffer = imageData.data.buffer.slice(0);
    worker.postMessage({
      type: 'THRESHOLD_MASK',
      payload: { imageData: buffer, width: canvas.width, height: canvas.height }
    }, [buffer]);
  });
}

/**
 * Remove background from image
 * @param imageElement - Source image element
 * @param onProgress - Progress callback (stage, percent)
 * @returns Transparent PNG blob
 */
export async function removeBackground(
  imageElement: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> {
  const startTime = performance.now();
  
  try {
    onProgress?.('Initializing...', 10);
    
    // Initialize segmenter if needed
    await initSegmenter();
    
    onProgress?.('Processing image...', 30);
    
    // Resize to processing size
    const { canvas } = resizeToProcess(imageElement);
    const width = canvas.width;
    const height = canvas.height;
    
    let maskUint8: Uint8ClampedArray;
    
    try {
      onProgress?.('Detecting person...', 50);
      
      // Run MediaPipe segmentation
      const maskData = await runSegmentation(canvas);
      
      // Convert mask to alpha values (red channel = person probability)
      maskUint8 = new Uint8ClampedArray(width * height);
      for (let i = 0; i < maskUint8.length; i++) {
        // MediaPipe mask: higher value = more likely person
        maskUint8[i] = maskData.data[i * 4]; // Use red channel
      }
      
    } catch (segError) {
      console.warn('MediaPipe failed, using color threshold fallback:', segError);
      onProgress?.('Using fallback...', 50);
      
      // Color threshold fallback
      maskUint8 = await colorThresholdFallback(canvas);
    }
    
    onProgress?.('Creating transparent image...', 80);
    
    // Get original image data at processing size
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Apply mask in worker
    const result = await applyMaskInWorker(
      imageData.data,
      maskUint8,
      width,
      height
    );
    
    const elapsed = Math.round(performance.now() - startTime);
    console.log(`Background removal complete in ${elapsed}ms`);
    
    onProgress?.('Complete!', 100);
    
    return result;
    
  } catch (error) {
    console.error('Background removal error:', error);
    throw error;
  }
}

/**
 * Load image from blob/file
 */
export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Clear segmenter and worker to free memory
 */
export function clearModel(): void {
  if (segmenter) {
    segmenter.close();
    segmenter = null;
    segmenterReady = false;
  }
  
  if (compositorWorker) {
    compositorWorker.terminate();
    compositorWorker = null;
  }
  
  pendingResolve = null;
  pendingReject = null;
}
