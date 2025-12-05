// Web Worker for heavy image processing operations
// This runs off the main thread to prevent UI freezes

interface ProcessImageMessage {
  type: 'composeMask' | 'processAndConvert';
  imageData?: Uint8ClampedArray;
  maskData?: Float32Array;
  width: number;
  height: number;
  maskWidth?: number;
  maskHeight?: number;
  maxOutputSize?: number;
}

interface ProcessImageResult {
  type: string;
  success: boolean;
  data?: string;
  error?: string;
}

// Yield to allow other operations every 20ms
const CHUNK_TIME_MS = 20;

async function yieldToMain(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

async function composeMaskAndConvert(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  maskData: Float32Array,
  maskWidth: number,
  maskHeight: number,
  maxOutputSize: number
): Promise<string> {
  const result = new Uint8ClampedArray(imageData);
  const totalPixels = width * height;
  
  let startTime = performance.now();
  
  // Apply mask with bilinear interpolation
  for (let idx = 0; idx < totalPixels; idx++) {
    // Yield every 20ms
    if (performance.now() - startTime > CHUNK_TIME_MS) {
      await yieldToMain();
      startTime = performance.now();
    }
    
    const y = Math.floor(idx / width);
    const x = idx % width;
    
    // Map output coordinates to mask coordinates
    const maskX = (x / width) * maskWidth;
    const maskY = (y / height) * maskHeight;
    
    // Bilinear interpolation
    const x0 = Math.floor(maskX);
    const y0 = Math.floor(maskY);
    const x1 = Math.min(x0 + 1, maskWidth - 1);
    const y1 = Math.min(y0 + 1, maskHeight - 1);
    
    const fx = maskX - x0;
    const fy = maskY - y0;
    
    const v00 = maskData[y0 * maskWidth + x0] || 0;
    const v10 = maskData[y0 * maskWidth + x1] || 0;
    const v01 = maskData[y1 * maskWidth + x0] || 0;
    const v11 = maskData[y1 * maskWidth + x1] || 0;
    
    const alpha = (v00 * (1 - fx) * (1 - fy) +
                  v10 * fx * (1 - fy) +
                  v01 * (1 - fx) * fy +
                  v11 * fx * fy);
    
    const enhancedAlpha = Math.pow(alpha, 0.8);
    result[idx * 4 + 3] = Math.round(Math.min(1, Math.max(0, enhancedAlpha)) * 255);
  }
  
  // Simple threshold cleanup
  for (let i = 0; i < totalPixels; i++) {
    const alpha = result[i * 4 + 3];
    result[i * 4 + 3] = alpha > 128 ? 255 : 0;
  }
  
  // Calculate output dimensions
  let outWidth = width;
  let outHeight = height;
  
  if (width > maxOutputSize || height > maxOutputSize) {
    if (width > height) {
      outWidth = maxOutputSize;
      outHeight = Math.round((height * maxOutputSize) / width);
    } else {
      outHeight = maxOutputSize;
      outWidth = Math.round((width * maxOutputSize) / height);
    }
  }
  
  // Create OffscreenCanvas for blob conversion
  const canvas = new OffscreenCanvas(outWidth, outHeight);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // If resizing needed, create temp canvas at original size first
  if (outWidth !== width || outHeight !== height) {
    const tempCanvas = new OffscreenCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Could not get temp canvas context');
    
    const newImageData = new ImageData(result, width, height);
    tempCtx.putImageData(newImageData, 0, 0);
    
    // Draw resized to output canvas
    ctx.drawImage(tempCanvas, 0, 0, outWidth, outHeight);
  } else {
    const newImageData = new ImageData(result, width, height);
    ctx.putImageData(newImageData, 0, 0);
  }
  
  // Convert to blob
  const blob = await canvas.convertToBlob({ type: 'image/png', quality: 0.9 });
  
  // Convert blob to base64
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 8192;
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
    
    // Yield periodically
    if (i % (chunkSize * 10) === 0) {
      await yieldToMain();
    }
  }
  
  return `data:image/png;base64,${btoa(binary)}`;
}

self.onmessage = async (e: MessageEvent<ProcessImageMessage>) => {
  const { type, imageData, maskData, width, height, maskWidth, maskHeight, maxOutputSize = 1024 } = e.data;
  
  try {
    if (type === 'processAndConvert' && imageData && maskData && maskWidth && maskHeight) {
      const base64 = await composeMaskAndConvert(
        imageData,
        width,
        height,
        maskData,
        maskWidth,
        maskHeight,
        maxOutputSize
      );
      
      const result: ProcessImageResult = {
        type: 'complete',
        success: true,
        data: base64
      };
      
      self.postMessage(result);
    }
  } catch (error) {
    const result: ProcessImageResult = {
      type: 'error',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    self.postMessage(result);
  }
};
