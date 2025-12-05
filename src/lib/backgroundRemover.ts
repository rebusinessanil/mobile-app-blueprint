import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

// Mobile detection for adaptive processing
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

// Adaptive max dimension - 384px for mobile to prevent freezes, 1024px for desktop
const getMaxDimension = () => isMobile() ? 384 : 1024;

let model: any = null;
let processor: any = null;
let imageWorker: Worker | null = null;

// RAF-based yield to UI thread - yields every 20ms
const yieldToUI = async (): Promise<void> => {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
};

// Initialize web worker for heavy processing
const getImageWorker = (): Worker | null => {
  if (typeof Worker === 'undefined') return null;
  
  if (!imageWorker) {
    try {
      imageWorker = new Worker(
        new URL('../workers/imageProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (e) {
      console.warn('Web Worker not available, using main thread fallback');
      return null;
    }
  }
  return imageWorker;
};

// Load the RMBG model for high-precision person detection
async function loadModel(onProgress?: (stage: string, percent: number) => void) {
  if (model && processor) return { model, processor };
  
  onProgress?.('Loading AI model...', 10);
  
  try {
    // Use RMBG-1.4 - specifically designed for background removal with clean edges
    // fp16 on mobile for lower memory, fp32 on desktop for quality
    model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
      device: 'webgpu',
      dtype: isMobile() ? 'fp16' : 'fp32',
    });
    
    processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4');
    
    onProgress?.('Model loaded', 25);
    return { model, processor };
  } catch (error) {
    console.log('WebGPU not available, falling back to CPU...');
    
    model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
      device: 'cpu',
    });
    
    processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4');
    
    onProgress?.('Model loaded', 25);
    return { model, processor };
  }
}

function resizeImageIfNeeded(
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  image: HTMLImageElement
): { width: number; height: number } {
  const MAX_IMAGE_DIMENSION = getMaxDimension();
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  
  return { width, height };
}

// Apply edge refinement for smoother cutout edges - DESKTOP ONLY
async function refineEdges(imageData: ImageData, threshold: number = 0.5): Promise<void> {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const totalPixels = width * height;
  
  const alphaValues = new Float32Array(totalPixels);
  const smoothedAlpha = new Float32Array(totalPixels);
  
  for (let i = 0; i < totalPixels; i++) {
    alphaValues[i] = data[i * 4 + 3] / 255;
  }
  
  const kernelRadius = 1;
  let lastYield = performance.now();
  
  for (let idx = 0; idx < totalPixels; idx++) {
    // Yield every 20ms
    if (performance.now() - lastYield > 20) {
      await yieldToUI();
      lastYield = performance.now();
    }
    
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
  
  for (let i = 0; i < totalPixels; i++) {
    data[i * 4 + 3] = Math.round(smoothedAlpha[i] * 255);
  }
}

// Remove any stray pixels and artifacts - DESKTOP ONLY
async function removeArtifacts(imageData: ImageData): Promise<void> {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  const neighbors = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],          [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];
  
  let lastYield = performance.now();
  
  for (let y = 1; y < height - 1; y++) {
    // Yield every 20ms
    if (performance.now() - lastYield > 20) {
      await yieldToUI();
      lastYield = performance.now();
    }
    
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const currentAlpha = data[idx + 3];
      
      if (currentAlpha > 128) {
        let opaqueNeighbors = 0;
        
        for (const [dx, dy] of neighbors) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          if (data[nIdx + 3] > 128) opaqueNeighbors++;
        }
        
        if (opaqueNeighbors < 3) {
          data[idx + 3] = 0;
        }
      }
    }
  }
}

// Apply mask with bilinear interpolation - 3 async chunks for mobile
async function applyMaskChunked(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  maskData: Float32Array,
  maskWidth: number,
  maskHeight: number,
  onProgress?: (stage: string, percent: number) => void
): Promise<void> {
  const totalPixels = width * height;
  const mobile = isMobile();
  
  const numChunks = mobile ? 3 : 1;
  const chunkSize = Math.ceil(totalPixels / numChunks);
  
  for (let chunk = 0; chunk < numChunks; chunk++) {
    const startIdx = chunk * chunkSize;
    const endIdx = Math.min(startIdx + chunkSize, totalPixels);
    let lastYield = performance.now();
    
    for (let idx = startIdx; idx < endIdx; idx++) {
      // Yield every 20ms using RAF
      if (performance.now() - lastYield > 20) {
        await yieldToUI();
        lastYield = performance.now();
      }
      
      const y = Math.floor(idx / width);
      const x = idx % width;
      
      const maskX = (x / width) * maskWidth;
      const maskY = (y / height) * maskHeight;
      
      const x0 = Math.floor(maskX);
      const y0 = Math.floor(maskY);
      const x1 = Math.min(x0 + 1, maskWidth - 1);
      const y1 = Math.min(y0 + 1, maskHeight - 1);
      
      const fx = maskX - x0;
      const fy = maskY - y0;
      
      const v00 = maskData[y0 * maskWidth + x0];
      const v10 = maskData[y0 * maskWidth + x1];
      const v01 = maskData[y1 * maskWidth + x0];
      const v11 = maskData[y1 * maskWidth + x1];
      
      const alpha = (v00 * (1 - fx) * (1 - fy) +
                    v10 * fx * (1 - fy) +
                    v01 * (1 - fx) * fy +
                    v11 * fx * fy);
      
      const enhancedAlpha = Math.pow(alpha, 0.8);
      const pixelIdx = idx * 4;
      pixels[pixelIdx + 3] = Math.round(Math.min(1, Math.max(0, enhancedAlpha)) * 255);
    }
    
    if (mobile && chunk < numChunks - 1) {
      const progress = 55 + Math.round(((chunk + 1) / numChunks) * 25);
      onProgress?.('Creating mask...', progress);
      await yieldToUI();
    }
  }
}

// Simple fast mask cleanup for mobile - no heavy processing
function applySimpleMaskCleanup(imageData: ImageData): void {
  const data = imageData.data;
  const totalPixels = imageData.width * imageData.height;
  
  for (let i = 0; i < totalPixels; i++) {
    const alpha = data[i * 4 + 3];
    data[i * 4 + 3] = alpha > 128 ? 255 : 0;
  }
}

// Process image in Web Worker for mobile
async function processInWorker(
  imageData: ImageData,
  maskData: Float32Array,
  maskWidth: number,
  maskHeight: number,
  onProgress?: (stage: string, percent: number) => void
): Promise<string> {
  const worker = getImageWorker();
  
  if (!worker) {
    throw new Error('Worker not available');
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Worker timeout'));
    }, 60000); // 60 second timeout
    
    worker.onmessage = (e) => {
      clearTimeout(timeout);
      if (e.data.success) {
        onProgress?.('Complete!', 100);
        resolve(e.data.data);
      } else {
        reject(new Error(e.data.error || 'Worker processing failed'));
      }
    };
    
    worker.onerror = (e) => {
      clearTimeout(timeout);
      reject(new Error('Worker error: ' + e.message));
    };
    
    // Transfer image data to worker
    worker.postMessage({
      type: 'processAndConvert',
      imageData: new Uint8ClampedArray(imageData.data),
      maskData: maskData,
      width: imageData.width,
      height: imageData.height,
      maskWidth: maskWidth,
      maskHeight: maskHeight,
      maxOutputSize: 1024
    });
  });
}

export const removeBackground = async (
  imageElement: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> => {
  const mobile = isMobile();
  
  try {
    console.log('Starting background removal...', mobile ? '(mobile: 384px, fp16, worker)' : '(desktop: 1024px, fp32, full)');
    
    const { model: loadedModel, processor: loadedProcessor } = await loadModel(onProgress);
    
    onProgress?.('Preparing image...', 30);
    await yieldToUI();
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const { width, height } = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Processing image at ${width}x${height}`);
    
    const imageFormat = mobile ? 'image/jpeg' : 'image/png';
    const imageQuality = mobile ? 0.8 : 1.0;
    const imageUrl = canvas.toDataURL(imageFormat, imageQuality);
    
    await yieldToUI();
    const rawImage = await RawImage.fromURL(imageUrl);
    
    onProgress?.('Detecting person...', 45);
    await yieldToUI();
    
    const { pixel_values } = await loadedProcessor(rawImage);
    
    onProgress?.('Processing...', 50);
    await yieldToUI();
    
    const { output } = await loadedModel({ input: pixel_values });
    
    onProgress?.('Creating mask...', 55);
    await yieldToUI();
    
    const maskData = output[0][0].data;
    const maskHeight = output[0][0].dims[0];
    const maskWidth = output[0][0].dims[1];
    
    // Create output canvas at original size
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    outputCtx.drawImage(canvas, 0, 0);
    const outputImageData = outputCtx.getImageData(0, 0, width, height);
    
    // Try to use Web Worker on mobile for final processing
    if (mobile) {
      try {
        onProgress?.('Finalizing in background...', 85);
        
        const base64Result = await processInWorker(
          outputImageData,
          maskData,
          maskWidth,
          maskHeight,
          onProgress
        );
        
        // Convert base64 back to blob
        const response = await fetch(base64Result);
        return await response.blob();
      } catch (workerError) {
        console.warn('Worker failed, falling back to main thread:', workerError);
        // Fall through to main thread processing
      }
    }
    
    // Main thread fallback (or desktop path)
    const pixels = outputImageData.data;
    await applyMaskChunked(pixels, width, height, maskData, maskWidth, maskHeight, onProgress);
    
    if (mobile) {
      onProgress?.('Finalizing...', 90);
      await yieldToUI();
      applySimpleMaskCleanup(outputImageData);
    } else {
      onProgress?.('Refining edges...', 80);
      await refineEdges(outputImageData, 0.4);
      
      onProgress?.('Removing artifacts...', 90);
      await removeArtifacts(outputImageData);
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    
    onProgress?.('Finalizing...', 95);
    await yieldToUI();
    
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            onProgress?.('Complete!', 100);
            console.log('Background removal complete');
            resolve(blob);
          } else {
            reject(new Error('Failed to create output image'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Background removal error:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
};

// Clear cached model and worker to free memory
export const clearModel = () => {
  model = null;
  processor = null;
  if (imageWorker) {
    imageWorker.terminate();
    imageWorker = null;
  }
};
