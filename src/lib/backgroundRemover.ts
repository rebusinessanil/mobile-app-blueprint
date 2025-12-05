import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

// Mobile detection for adaptive processing
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

// Adaptive max dimension - smaller for mobile to prevent memory issues
const getMaxDimension = () => isMobile() ? 512 : 1024;

let model: any = null;
let processor: any = null;

// Yield to UI thread to prevent freezing
const yieldToUI = () => new Promise<void>(resolve => setTimeout(resolve, 0));

// Load the RMBG model for high-precision person detection
async function loadModel(onProgress?: (stage: string, percent: number) => void) {
  if (model && processor) return { model, processor };
  
  onProgress?.('Loading AI model...', 10);
  
  try {
    // Use RMBG-1.4 - specifically designed for background removal with clean edges
    // Use fp16 on mobile for lower memory, fp32 on desktop for quality
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

// Apply edge refinement for smoother cutout edges - optimized for mobile
async function refineEdges(imageData: ImageData, threshold: number = 0.5): Promise<void> {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const totalPixels = width * height;
  
  // Pre-allocate arrays
  const alphaValues = new Float32Array(totalPixels);
  const smoothedAlpha = new Float32Array(totalPixels);
  
  // Extract alpha values
  for (let i = 0; i < totalPixels; i++) {
    alphaValues[i] = data[i * 4 + 3] / 255;
  }
  
  // Process in chunks for mobile
  const chunkSize = isMobile() ? 5000 : 20000;
  const kernelRadius = 1;
  
  for (let startIdx = 0; startIdx < totalPixels; startIdx += chunkSize) {
    const endIdx = Math.min(startIdx + chunkSize, totalPixels);
    
    for (let idx = startIdx; idx < endIdx; idx++) {
      const y = Math.floor(idx / width);
      const x = idx % width;
      const currentAlpha = alphaValues[idx];
      
      // Check if this is an edge pixel (between 0.1 and 0.9)
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
    
    // Yield to UI on mobile to prevent freezing
    if (isMobile() && startIdx % (chunkSize * 2) === 0) {
      await yieldToUI();
    }
  }
  
  // Apply smoothed alpha values
  for (let i = 0; i < totalPixels; i++) {
    data[i * 4 + 3] = Math.round(smoothedAlpha[i] * 255);
  }
}

// Remove any stray pixels and artifacts - optimized
async function removeArtifacts(imageData: ImageData): Promise<void> {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Process in chunks for mobile
  const chunkSize = isMobile() ? 5000 : 20000;
  const neighbors = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],          [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];
  
  for (let startY = 1; startY < height - 1; startY += Math.ceil(chunkSize / width)) {
    const endY = Math.min(startY + Math.ceil(chunkSize / width), height - 1);
    
    for (let y = startY; y < endY; y++) {
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
    
    // Yield to UI on mobile
    if (isMobile()) {
      await yieldToUI();
    }
  }
}

// Apply mask with bilinear interpolation - chunked for mobile
async function applyMask(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  maskData: Float32Array,
  maskWidth: number,
  maskHeight: number,
  onProgress?: (stage: string, percent: number) => void
): Promise<void> {
  const totalPixels = width * height;
  const chunkSize = isMobile() ? 10000 : 50000;
  
  for (let startIdx = 0; startIdx < totalPixels; startIdx += chunkSize) {
    const endIdx = Math.min(startIdx + chunkSize, totalPixels);
    
    for (let idx = startIdx; idx < endIdx; idx++) {
      const y = Math.floor(idx / width);
      const x = idx % width;
      
      // Map output coordinates to mask coordinates
      const maskX = (x / width) * maskWidth;
      const maskY = (y / height) * maskHeight;
      
      // Bilinear interpolation for smoother edges
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
      
      // Bilinear interpolation
      const alpha = (v00 * (1 - fx) * (1 - fy) +
                    v10 * fx * (1 - fy) +
                    v01 * (1 - fx) * fy +
                    v11 * fx * fy);
      
      // Apply alpha with slight contrast enhancement for cleaner edges
      const enhancedAlpha = Math.pow(alpha, 0.8);
      const pixelIdx = idx * 4;
      pixels[pixelIdx + 3] = Math.round(Math.min(1, Math.max(0, enhancedAlpha)) * 255);
    }
    
    // Yield to UI and update progress on mobile
    if (isMobile()) {
      const progress = 50 + Math.round((startIdx / totalPixels) * 20);
      onProgress?.('Creating mask...', progress);
      await yieldToUI();
    }
  }
}

export const removeBackground = async (
  imageElement: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> => {
  try {
    console.log('Starting high-precision background removal...', isMobile() ? '(mobile mode)' : '(desktop mode)');
    
    // Load the model
    const { model: loadedModel, processor: loadedProcessor } = await loadModel(onProgress);
    
    onProgress?.('Preparing image...', 30);
    await yieldToUI();
    
    // Create canvas and resize if needed
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const { width, height } = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Processing image at ${width}x${height}`);
    
    // Load image for the model - use JPEG on mobile for smaller size
    const imageFormat = isMobile() ? 'image/jpeg' : 'image/png';
    const imageQuality = isMobile() ? 0.85 : 1.0;
    const imageUrl = canvas.toDataURL(imageFormat, imageQuality);
    
    await yieldToUI();
    const rawImage = await RawImage.fromURL(imageUrl);
    
    onProgress?.('Detecting person...', 45);
    await yieldToUI();
    
    // Process with the model
    const { pixel_values } = await loadedProcessor(rawImage);
    
    onProgress?.('Processing...', 50);
    await yieldToUI();
    
    const { output } = await loadedModel({ input: pixel_values });
    
    onProgress?.('Creating mask...', 55);
    await yieldToUI();
    
    // Get the mask from model output
    const maskData = output[0][0].data;
    const maskHeight = output[0][0].dims[0];
    const maskWidth = output[0][0].dims[1];
    
    // Create output canvas at original size
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw the original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Get image data to apply mask
    const outputImageData = outputCtx.getImageData(0, 0, width, height);
    const pixels = outputImageData.data;
    
    // Apply the mask with chunked processing for mobile
    await applyMask(pixels, width, height, maskData, maskWidth, maskHeight, onProgress);
    
    onProgress?.('Refining edges...', 80);
    await yieldToUI();
    
    // Refine edges for smoother cutout
    await refineEdges(outputImageData, 0.4);
    
    onProgress?.('Removing artifacts...', 90);
    await yieldToUI();
    
    // Remove artifacts
    await removeArtifacts(outputImageData);
    
    // Apply the final processed image data
    outputCtx.putImageData(outputImageData, 0, 0);
    
    onProgress?.('Finalizing...', 95);
    await yieldToUI();
    
    // Convert to blob with high quality
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

// Clear cached model to free memory
export const clearModel = () => {
  model = null;
  processor = null;
};
