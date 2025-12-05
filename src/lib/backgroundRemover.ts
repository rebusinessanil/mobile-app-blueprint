import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 1024;

let model: any = null;
let processor: any = null;

// Load the RMBG model for high-precision person detection
async function loadModel(onProgress?: (stage: string, percent: number) => void) {
  if (model && processor) return { model, processor };
  
  onProgress?.('Loading AI model...', 10);
  
  try {
    // Use RMBG-1.4 - specifically designed for background removal with clean edges
    model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
      device: 'webgpu',
      dtype: 'fp32',
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

// Apply edge refinement for smoother cutout edges
function refineEdges(imageData: ImageData, threshold: number = 0.5): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Create a copy of alpha values for reference
  const alphaValues = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    alphaValues[i] = data[i * 4 + 3] / 255;
  }
  
  // Apply edge-aware smoothing
  const smoothedAlpha = new Float32Array(width * height);
  const kernelRadius = 1;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const currentAlpha = alphaValues[idx];
      
      // Check if this is an edge pixel (between 0.1 and 0.9)
      if (currentAlpha > 0.05 && currentAlpha < 0.95) {
        // Apply weighted averaging for edge pixels
        let sum = 0;
        let weightSum = 0;
        
        for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
          for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
            const nx = x + kx;
            const ny = y + ky;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              const neighborAlpha = alphaValues[nIdx];
              
              // Weight by distance
              const dist = Math.sqrt(kx * kx + ky * ky);
              const weight = 1 / (1 + dist);
              
              sum += neighborAlpha * weight;
              weightSum += weight;
            }
          }
        }
        
        // Apply threshold to create cleaner edges
        const smoothed = sum / weightSum;
        smoothedAlpha[idx] = smoothed > threshold ? 1 : (smoothed < (1 - threshold) ? 0 : smoothed);
      } else {
        // Keep solid areas unchanged
        smoothedAlpha[idx] = currentAlpha > 0.5 ? 1 : 0;
      }
    }
  }
  
  // Apply the smoothed alpha values
  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 3] = Math.round(smoothedAlpha[i] * 255);
  }
}

// Remove any stray pixels and artifacts
function removeArtifacts(imageData: ImageData, minRegionSize: number = 50): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Simple artifact removal: remove isolated pixels
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const currentAlpha = data[idx + 3];
      
      if (currentAlpha > 128) {
        // Count opaque neighbors
        let opaqueNeighbors = 0;
        const neighbors = [
          [-1, -1], [0, -1], [1, -1],
          [-1, 0],          [1, 0],
          [-1, 1],  [0, 1],  [1, 1]
        ];
        
        for (const [dx, dy] of neighbors) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          if (data[nIdx + 3] > 128) opaqueNeighbors++;
        }
        
        // Remove isolated pixels (less than 3 opaque neighbors)
        if (opaqueNeighbors < 3) {
          data[idx + 3] = 0;
        }
      }
    }
  }
}

export const removeBackground = async (
  imageElement: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> => {
  try {
    console.log('Starting high-precision background removal...');
    
    // Load the model
    const { model: loadedModel, processor: loadedProcessor } = await loadModel(onProgress);
    
    onProgress?.('Preparing image...', 30);
    
    // Create canvas and resize if needed
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const { width, height } = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Processing image at ${width}x${height}`);
    
    // Load image for the model
    const imageUrl = canvas.toDataURL('image/png');
    const rawImage = await RawImage.fromURL(imageUrl);
    
    onProgress?.('Detecting person...', 50);
    
    // Process with the model
    const { pixel_values } = await loadedProcessor(rawImage);
    const { output } = await loadedModel({ input: pixel_values });
    
    onProgress?.('Creating mask...', 70);
    
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
    
    // Apply the mask with bilinear interpolation for smoother edges
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
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
        const pixelIdx = (y * width + x) * 4;
        pixels[pixelIdx + 3] = Math.round(Math.min(1, Math.max(0, enhancedAlpha)) * 255);
      }
    }
    
    onProgress?.('Refining edges...', 85);
    
    // Refine edges for smoother cutout
    refineEdges(outputImageData, 0.4);
    
    // Remove artifacts
    removeArtifacts(outputImageData);
    
    // Apply the final processed image data
    outputCtx.putImageData(outputImageData, 0, 0);
    
    onProgress?.('Finalizing...', 95);
    
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
