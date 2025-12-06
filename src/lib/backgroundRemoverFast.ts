/**
 * Fast Backend-Based Background Remover
 * Uses MODNet ONNX on edge function for sub-1-second processing
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

const MAX_SIZE = 512; // Resize to 512px for speed

export interface RemovalResult {
  blob: Blob;
  processingTime: number;
}

/**
 * Resize image to max dimension while maintaining aspect ratio
 */
function resizeImage(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement
): { width: number; height: number } {
  let { naturalWidth: width, naturalHeight: height } = img;
  
  if (width > MAX_SIZE || height > MAX_SIZE) {
    if (width > height) {
      height = Math.round((height * MAX_SIZE) / width);
      width = MAX_SIZE;
    } else {
      width = Math.round((width * MAX_SIZE) / height);
      height = MAX_SIZE;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  
  return { width, height };
}

/**
 * Extract pixel data from canvas
 */
function getPixelData(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): Uint8ClampedArray {
  const imageData = ctx.getImageData(0, 0, width, height);
  return imageData.data;
}

/**
 * Create PNG blob from RGBA pixel data
 */
function createPngBlob(
  pixelData: number[],
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < pixelData.length; i++) {
      imageData.data[i] = pixelData[i];
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Remove background using fast backend MODNet
 */
export async function removeBackgroundFast(
  image: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<RemovalResult> {
  const startTime = performance.now();
  
  try {
    onProgress?.('Preparing image...', 10);
    
    // Create canvas and resize
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    const { width, height } = resizeImage(canvas, ctx, image);
    logger.info(`Resized image to ${width}x${height}`);
    
    // Get pixel data
    const pixelData = getPixelData(ctx, width, height);
    
    onProgress?.('Sending to server...', 30);
    
    // Call edge function
    const { data, error } = await supabase.functions.invoke('remove-background', {
      body: {
        imageData: Array.from(pixelData),
        width,
        height,
      },
    });
    
    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Background removal failed');
    }
    
    onProgress?.('Processing result...', 80);
    
    // Create PNG from result
    const blob = await createPngBlob(data.resultData, data.width, data.height);
    
    const processingTime = performance.now() - startTime;
    logger.info(`Background removed in ${processingTime.toFixed(0)}ms (server: ${data.processingTime}ms)`);
    
    onProgress?.('Complete!', 100);
    
    return { blob, processingTime };
    
  } catch (error) {
    logger.error('Fast background removal failed:', error);
    throw error;
  }
}

/**
 * Load image from blob or URL
 */
export function loadImageElement(source: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(img.src);
      }
      resolve(img);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}
