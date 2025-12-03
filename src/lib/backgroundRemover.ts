import { pipeline, env, RawImage } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 1024;

// Cache the model for reuse
let cachedSegmenter: any = null;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
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

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

// Stage 1: Global object detection and initial mask
async function getInitialMask(segmenter: any, imageData: string): Promise<any> {
  console.log('Stage 1: Global object detection...');
  const result = await segmenter(imageData);
  return result;
}

// Stage 2: Fine mask refinement for edges
function refineMaskEdges(maskData: Uint8Array, width: number, height: number): Uint8Array {
  console.log('Stage 2: Fine mask refinement for edges...');
  const refinedMask = new Uint8Array(maskData.length);
  
  // Apply adaptive threshold based on local neighborhood
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const rawAlpha = maskData[idx] / 255;
      
      // Hard threshold with smooth transition zone
      if (rawAlpha > 0.75) {
        refinedMask[idx] = 255;
      } else if (rawAlpha > 0.5) {
        // Smooth transition for semi-transparent areas
        refinedMask[idx] = Math.round((rawAlpha - 0.5) * 2 * 255);
      } else {
        refinedMask[idx] = 0;
      }
    }
  }
  
  return refinedMask;
}

// Stage 3: Shadow boundary cleanup with morphological operations
function cleanupShadowBoundaries(maskData: Uint8Array, width: number, height: number): Uint8Array {
  console.log('Stage 3: Shadow boundary cleanup...');
  const cleanedMask = new Uint8Array(maskData.length);
  const erosionRadius = 1;
  
  // Morphological erosion to remove edge fringing
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let minVal = 255;
      
      // Check neighborhood for erosion
      for (let dy = -erosionRadius; dy <= erosionRadius; dy++) {
        for (let dx = -erosionRadius; dx <= erosionRadius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            minVal = Math.min(minVal, maskData[nIdx]);
          }
        }
      }
      cleanedMask[idx] = minVal;
    }
  }
  
  // Apply slight dilation to recover some lost detail
  const finalMask = new Uint8Array(cleanedMask.length);
  const dilationRadius = 1;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let maxVal = 0;
      
      for (let dy = -dilationRadius; dy <= dilationRadius; dy++) {
        for (let dx = -dilationRadius; dx <= dilationRadius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            maxVal = Math.max(maxVal, cleanedMask[nIdx]);
          }
        }
      }
      
      // Blend original and dilated for natural edges
      finalMask[idx] = Math.round(cleanedMask[idx] * 0.7 + maxVal * 0.3);
    }
  }
  
  return finalMask;
}

// Stage 4: Final alpha channel application with natural edge smoothing
function applyFinalMask(imageData: ImageData, mask: Uint8Array, width: number, height: number): void {
  console.log('Stage 4: Applying final mask with natural edge smoothing...');
  const data = imageData.data;
  
  for (let i = 0; i < mask.length; i++) {
    const alpha = mask[i];
    
    // Apply alpha with slight feathering at edges only
    if (alpha === 0) {
      data[i * 4 + 3] = 0;
    } else if (alpha === 255) {
      data[i * 4 + 3] = 255;
    } else {
      // Slight smoothing for transition pixels only
      data[i * 4 + 3] = Math.min(255, Math.round(alpha * 1.1));
    }
  }
}

// Remove color fringing/halos from edges
function removeColorFringing(imageData: ImageData, mask: Uint8Array, width: number, height: number): void {
  console.log('Removing color fringing and halos...');
  const data = imageData.data;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const alpha = mask[idx];
      
      // Only process edge pixels (semi-transparent)
      if (alpha > 0 && alpha < 250) {
        const pixelIdx = idx * 4;
        
        // Find average color of fully opaque neighbors
        let totalR = 0, totalG = 0, totalB = 0, count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = (y + dy) * width + (x + dx);
            if (mask[nIdx] > 250) {
              const nPixelIdx = nIdx * 4;
              totalR += data[nPixelIdx];
              totalG += data[nPixelIdx + 1];
              totalB += data[nPixelIdx + 2];
              count++;
            }
          }
        }
        
        // Blend edge pixel with neighbor colors to reduce fringing
        if (count > 0) {
          const blendFactor = 0.3;
          data[pixelIdx] = Math.round(data[pixelIdx] * (1 - blendFactor) + (totalR / count) * blendFactor);
          data[pixelIdx + 1] = Math.round(data[pixelIdx + 1] * (1 - blendFactor) + (totalG / count) * blendFactor);
          data[pixelIdx + 2] = Math.round(data[pixelIdx + 2] * (1 - blendFactor) + (totalB / count) * blendFactor);
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
    console.log('Starting multi-stage background removal...');
    onProgress?.('Loading AI model...', 10);
    
    // Use cached segmenter or create new one
    if (!cachedSegmenter) {
      cachedSegmenter = await pipeline(
        'image-segmentation',
        'Xenova/segformer-b0-finetuned-ade-512-512',
        { device: 'webgpu' }
      );
    }
    
    onProgress?.('Preparing image...', 20);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Image dimensions: ${canvas.width}x${canvas.height} (resized: ${wasResized})`);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    // Stage 1: Global object detection
    onProgress?.('Detecting subject...', 30);
    const result = await getInitialMask(cachedSegmenter, imageData);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Invalid segmentation result');
    }
    
    onProgress?.('Refining edges...', 50);
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Create initial mask from segmentation result
    const initialMask = new Uint8Array(result[0].mask.data.length);
    for (let i = 0; i < result[0].mask.data.length; i++) {
      // Invert mask (1 - value) to keep subject
      initialMask[i] = Math.round((1 - result[0].mask.data[i]) * 255);
    }
    
    // Stage 2: Fine mask refinement
    onProgress?.('Fine-tuning mask...', 60);
    const refinedMask = refineMaskEdges(initialMask, width, height);
    
    // Stage 3: Shadow boundary cleanup
    onProgress?.('Cleaning boundaries...', 75);
    const cleanedMask = cleanupShadowBoundaries(refinedMask, width, height);
    
    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    outputCtx.drawImage(canvas, 0, 0);
    const outputImageData = outputCtx.getImageData(0, 0, width, height);
    
    // Stage 4: Apply final mask
    onProgress?.('Applying transparency...', 85);
    applyFinalMask(outputImageData, cleanedMask, width, height);
    
    // Remove color fringing
    onProgress?.('Removing halos...', 92);
    removeColorFringing(outputImageData, cleanedMask, width, height);
    
    outputCtx.putImageData(outputImageData, 0, 0);
    
    onProgress?.('Finalizing...', 98);
    console.log('Multi-stage background removal complete');
    
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            onProgress?.('Complete!', 100);
            console.log('Successfully created transparent PNG');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
