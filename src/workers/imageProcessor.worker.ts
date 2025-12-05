// Web Worker for ALL heavy image processing operations
// This runs entirely off the main thread to prevent UI freezes

interface ProcessImageMessage {
  type: 'fullProcess' | 'compress';
  // For fullProcess
  imageData?: Uint8ClampedArray;
  maskData?: Float32Array;
  width?: number;
  height?: number;
  maskWidth?: number;
  maskHeight?: number;
  maxOutputSize?: number;
  isMobile?: boolean;
  // For compress
  dataUrl?: string;
  maxSizeBytes?: number;
  initialQuality?: number;
}

interface ProcessImageResult {
  type: string;
  success: boolean;
  data?: string;
  error?: string;
}

function applyMaskBilinear(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  maskData: Float32Array,
  maskWidth: number,
  maskHeight: number
): void {
  const totalPixels = width * height;
  
  for (let idx = 0; idx < totalPixels; idx++) {
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
    
    // Enhanced alpha with power curve for cleaner edges
    const enhancedAlpha = Math.pow(alpha, 0.8);
    pixels[idx * 4 + 3] = Math.round(Math.min(1, Math.max(0, enhancedAlpha)) * 255);
  }
}

function applyThresholdCleanup(pixels: Uint8ClampedArray, totalPixels: number): void {
  for (let i = 0; i < totalPixels; i++) {
    const alpha = pixels[i * 4 + 3];
    pixels[i * 4 + 3] = alpha > 128 ? 255 : 0;
  }
}

function refineEdges(pixels: Uint8ClampedArray, width: number, height: number): void {
  const totalPixels = width * height;
  const alphaValues = new Float32Array(totalPixels);
  const smoothedAlpha = new Float32Array(totalPixels);
  
  // Extract alpha values
  for (let i = 0; i < totalPixels; i++) {
    alphaValues[i] = pixels[i * 4 + 3] / 255;
  }
  
  const kernelRadius = 1;
  const threshold = 0.4;
  
  // Apply edge smoothing
  for (let idx = 0; idx < totalPixels; idx++) {
    const y = Math.floor(idx / width);
    const x = idx % width;
    const currentAlpha = alphaValues[idx];
    
    if (currentAlpha > 0.05 && currentAlpha < 0.95) {
      let sum = 0;
      let weightSum = 0;
      
      for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
        for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
          const nx = x + kx;
          const ny = y + ky;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            const neighborAlpha = alphaValues[nIdx];
            const dist = Math.sqrt(kx * kx + ky * ky);
            const weight = 1 / (1 + dist);
            sum += neighborAlpha * weight;
            weightSum += weight;
          }
        }
      }
      
      const smoothed = sum / weightSum;
      smoothedAlpha[idx] = smoothed > threshold ? 1 : (smoothed < (1 - threshold) ? 0 : smoothed);
    } else {
      smoothedAlpha[idx] = currentAlpha > 0.5 ? 1 : 0;
    }
  }
  
  // Write back smoothed alpha
  for (let i = 0; i < totalPixels; i++) {
    pixels[i * 4 + 3] = Math.round(smoothedAlpha[i] * 255);
  }
}

function removeArtifacts(pixels: Uint8ClampedArray, width: number, height: number): void {
  const neighbors = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],          [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const currentAlpha = pixels[idx + 3];
      
      if (currentAlpha > 128) {
        let opaqueNeighbors = 0;
        
        for (const [dx, dy] of neighbors) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          if (pixels[nIdx + 3] > 128) opaqueNeighbors++;
        }
        
        if (opaqueNeighbors < 3) {
          pixels[idx + 3] = 0;
        }
      }
    }
  }
}

async function processFullImage(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  maskData: Float32Array,
  maskWidth: number,
  maskHeight: number,
  maxOutputSize: number,
  isMobile: boolean
): Promise<string> {
  const pixels = new Uint8ClampedArray(imageData);
  const totalPixels = width * height;
  
  // Step 1: Apply mask with bilinear interpolation
  applyMaskBilinear(pixels, width, height, maskData, maskWidth, maskHeight);
  
  // Step 2: Edge refinement (desktop only)
  if (!isMobile) {
    refineEdges(pixels, width, height);
    removeArtifacts(pixels, width, height);
  } else {
    // Simple threshold for mobile
    applyThresholdCleanup(pixels, totalPixels);
  }
  
  // Step 3: Calculate output dimensions with compression
  let outWidth = width;
  let outHeight = height;
  
  // Aggressive resize for output
  const effectiveMax = isMobile ? Math.min(maxOutputSize, 800) : maxOutputSize;
  
  if (width > effectiveMax || height > effectiveMax) {
    if (width > height) {
      outWidth = effectiveMax;
      outHeight = Math.round((height * effectiveMax) / width);
    } else {
      outHeight = effectiveMax;
      outWidth = Math.round((width * effectiveMax) / height);
    }
  }
  
  // Step 4: Create canvas and render
  const canvas = new OffscreenCanvas(outWidth, outHeight);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Create temp canvas at original size if resize needed
  if (outWidth !== width || outHeight !== height) {
    const tempCanvas = new OffscreenCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Could not get temp canvas context');
    
    const newImageData = new ImageData(pixels, width, height);
    tempCtx.putImageData(newImageData, 0, 0);
    
    // Draw resized to output canvas
    ctx.drawImage(tempCanvas, 0, 0, outWidth, outHeight);
  } else {
    const newImageData = new ImageData(pixels, width, height);
    ctx.putImageData(newImageData, 0, 0);
  }
  
  // Step 5: Convert to compressed blob - use lower quality on mobile
  const quality = isMobile ? 0.85 : 0.92;
  const blob = await canvas.convertToBlob({ type: 'image/png', quality });
  
  // Step 6: Convert blob to base64 efficiently
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Build base64 string in chunks
  let binary = '';
  const chunkSize = 32768; // 32KB chunks
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return `data:image/png;base64,${btoa(binary)}`;
}

// Compress banner image to max 1000x1000 and 1.5MB
async function compressBannerImage(
  dataUrl: string,
  maxSizeBytes: number,
  initialQuality: number
): Promise<string> {
  const TARGET_SIZE = 1000; // Fixed 1000x1000 max
  
  // Decode base64 to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  
  // Create image bitmap
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  
  // Calculate dimensions to fit within 1000x1000
  let outWidth = width;
  let outHeight = height;
  
  if (width > TARGET_SIZE || height > TARGET_SIZE) {
    if (width > height) {
      outWidth = TARGET_SIZE;
      outHeight = Math.round((height * TARGET_SIZE) / width);
    } else {
      outHeight = TARGET_SIZE;
      outWidth = Math.round((width * TARGET_SIZE) / height);
    }
  }
  
  // Create canvas at target size
  const canvas = new OffscreenCanvas(outWidth, outHeight);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw with high-quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, outWidth, outHeight);
  
  // Always use JPEG for smaller file size
  let quality = initialQuality;
  let attempts = 0;
  const maxAttempts = 4;
  
  while (attempts < maxAttempts) {
    const compressedBlob = await canvas.convertToBlob({ 
      type: 'image/jpeg', 
      quality 
    });
    
    const arrayBuffer = await compressedBlob.arrayBuffer();
    
    if (arrayBuffer.byteLength <= maxSizeBytes) {
      // Convert to base64
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 32768;
      
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      return `data:image/jpeg;base64,${btoa(binary)}`;
    }
    
    // Reduce quality
    quality -= 0.15;
    attempts++;
  }
  
  // Final attempt with minimum quality
  const finalBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.5 });
  const finalBuffer = await finalBlob.arrayBuffer();
  const finalBytes = new Uint8Array(finalBuffer);
  
  let finalBinary = '';
  const chunkSize = 32768;
  
  for (let i = 0; i < finalBytes.length; i += chunkSize) {
    const chunk = finalBytes.subarray(i, Math.min(i + chunkSize, finalBytes.length));
    finalBinary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return `data:image/jpeg;base64,${btoa(finalBinary)}`;
}

self.onmessage = async (e: MessageEvent<ProcessImageMessage>) => {
  const { type } = e.data;
  
  try {
    if (type === 'fullProcess') {
      const { imageData, maskData, width, height, maskWidth, maskHeight, maxOutputSize, isMobile } = e.data;
      
      if (!imageData || !maskData || !width || !height || !maskWidth || !maskHeight) {
        throw new Error('Missing required data for fullProcess');
      }
      
      const base64 = await processFullImage(
        imageData,
        width,
        height,
        maskData,
        maskWidth,
        maskHeight,
        maxOutputSize || 1024,
        isMobile || false
      );
      
      const result: ProcessImageResult = {
        type: 'complete',
        success: true,
        data: base64
      };
      
      self.postMessage(result);
    } else if (type === 'compress') {
      const { dataUrl, maxSizeBytes, initialQuality } = e.data;
      
      if (!dataUrl || !maxSizeBytes) {
        throw new Error('Missing required data for compress');
      }
      
      const compressed = await compressBannerImage(
        dataUrl,
        maxSizeBytes,
        initialQuality || 0.92
      );
      
      const result: ProcessImageResult = {
        type: 'complete',
        success: true,
        data: compressed
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
