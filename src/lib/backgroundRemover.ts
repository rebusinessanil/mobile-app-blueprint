/**
 * Ultra-fast background remover using TensorFlow.js Body Segmentation
 * - Runs fully client-side with no API keys
 * - 256px processing for maximum speed (<1 second)
 * - Web Worker compositing for smooth UI
 * - Color-threshold fallback if segmentation fails
 */

import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// Processing size - small for speed
const PROCESS_SIZE = 256;

let segmenter: bodySegmentation.BodySegmenter | null = null;
let segmenterLoading = false;
let compositorWorker: Worker | null = null;

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

// Initialize TensorFlow.js Body Segmentation
async function initSegmenter(): Promise<bodySegmentation.BodySegmenter> {
  if (segmenter) return segmenter;
  if (segmenterLoading) {
    // Wait for existing load
    while (segmenterLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (segmenter) return segmenter;
  }
  
  segmenterLoading = true;
  
  try {
    // Ensure WebGL backend is ready
    await tf.setBackend('webgl');
    await tf.ready();
    
    // Create segmenter with MediaPipe Selfie Segmentation model
    segmenter = await bodySegmentation.createSegmenter(
      bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
      {
        runtime: 'tfjs',
        modelType: 'general', // 'general' is faster than 'landscape'
      }
    );
    
    console.log('TensorFlow.js Body Segmentation ready');
    segmenterLoading = false;
    return segmenter;
    
  } catch (err) {
    segmenterLoading = false;
    throw err;
  }
}

// Resize image to processing size
function resizeToProcess(img: HTMLImageElement): HTMLCanvasElement {
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
  
  return canvas;
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

// Color threshold fallback
function colorThresholdFallback(canvas: HTMLCanvasElement): Uint8ClampedArray {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const mask = new Uint8ClampedArray(canvas.width * canvas.height);
  
  // Sample edge pixels for background color
  const edgePixels: number[][] = [];
  const w = canvas.width;
  const h = canvas.height;
  
  // Sample top and bottom edges
  for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 15))) {
    const topIdx = x * 4;
    const bottomIdx = ((h - 1) * w + x) * 4;
    edgePixels.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
    edgePixels.push([data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]]);
  }
  
  // Sample left and right edges
  for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 15))) {
    const leftIdx = y * w * 4;
    const rightIdx = (y * w + w - 1) * 4;
    edgePixels.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
    edgePixels.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
  }
  
  // Calculate average background color
  const avgBg = edgePixels.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0])
    .map(v => v / edgePixels.length);
  
  // Threshold based on color distance from background
  const threshold = 45;
  for (let i = 0; i < mask.length; i++) {
    const idx = i * 4;
    const dist = Math.sqrt(
      Math.pow(data[idx] - avgBg[0], 2) +
      Math.pow(data[idx + 1] - avgBg[1], 2) +
      Math.pow(data[idx + 2] - avgBg[2], 2)
    );
    mask[i] = dist > threshold ? 255 : 0;
  }
  
  return mask;
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
    
    // Initialize segmenter
    const seg = await initSegmenter();
    
    onProgress?.('Processing image...', 30);
    
    // Resize to processing size
    const canvas = resizeToProcess(imageElement);
    const width = canvas.width;
    const height = canvas.height;
    
    let maskUint8: Uint8ClampedArray;
    
    try {
      onProgress?.('Detecting person...', 50);
      
      // Run segmentation
      const segmentations = await seg.segmentPeople(canvas, {
        flipHorizontal: false,
        multiSegmentation: false,
        segmentBodyParts: false,
      });
      
      if (segmentations.length > 0 && segmentations[0].mask) {
        // Get mask as ImageData
        const maskImageData = await segmentations[0].mask.toImageData();
        
        // Extract alpha from mask (person = high value)
        maskUint8 = new Uint8ClampedArray(width * height);
        for (let i = 0; i < maskUint8.length; i++) {
          // Red channel contains person probability (0-255)
          maskUint8[i] = maskImageData.data[i * 4];
        }
      } else {
        throw new Error('No segmentation result');
      }
      
    } catch (segError) {
      console.warn('Segmentation failed, using color threshold fallback:', segError);
      onProgress?.('Using fallback...', 50);
      maskUint8 = colorThresholdFallback(canvas);
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
    segmenter.dispose();
    segmenter = null;
  }
  
  if (compositorWorker) {
    compositorWorker.terminate();
    compositorWorker = null;
  }
}
