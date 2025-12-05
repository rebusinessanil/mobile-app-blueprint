import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js for optimal performance
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 512;
const FEATHER_RADIUS = 3;
const EDGE_THRESHOLD = 0.12;
const ALPHA_CUTOFF_LOW = 15;
const ALPHA_CUTOFF_HIGH = 240;

let segmenter: any = null;
let isLoadingModel = false;

// Load RMBG-1.4 model optimized for person/portrait detection
async function getSegmenter(onProgress?: (stage: string, percent: number) => void) {
  if (segmenter) return segmenter;
  
  if (isLoadingModel) {
    while (isLoadingModel) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return segmenter;
  }
  
  isLoadingModel = true;
  onProgress?.('Loading AI model...', 10);
  
  try {
    // RMBG-1.4 - purpose-built for background removal with person/portrait focus
    segmenter = await pipeline(
      'image-segmentation',
      'briaai/RMBG-1.4',
      { device: 'webgpu' }
    );
    onProgress?.('Model ready', 20);
  } catch (error) {
    console.log('WebGPU not available, trying CPU...');
    try {
      segmenter = await pipeline(
        'image-segmentation',
        'briaai/RMBG-1.4'
      );
    } catch (e) {
      console.log('RMBG failed, falling back to segformer...');
      segmenter = await pipeline(
        'image-segmentation',
        'Xenova/segformer-b0-finetuned-ade-512-512'
      );
    }
    onProgress?.('Model ready', 20);
  } finally {
    isLoadingModel = false;
  }
  
  return segmenter;
}

function resizeImage(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
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
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);
  
  return canvas;
}

// High-quality bilinear interpolation for mask scaling
function bilinearInterpolate(
  srcData: Float32Array | number[],
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): Float32Array {
  const dstData = new Float32Array(dstWidth * dstHeight);
  
  const xRatio = (srcWidth - 1) / Math.max(dstWidth - 1, 1);
  const yRatio = (srcHeight - 1) / Math.max(dstHeight - 1, 1);
  
  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = x * xRatio;
      const srcY = y * yRatio;
      
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, srcWidth - 1);
      const y1 = Math.min(y0 + 1, srcHeight - 1);
      
      const xFrac = srcX - x0;
      const yFrac = srcY - y0;
      
      const v00 = srcData[y0 * srcWidth + x0] || 0;
      const v10 = srcData[y0 * srcWidth + x1] || 0;
      const v01 = srcData[y1 * srcWidth + x0] || 0;
      const v11 = srcData[y1 * srcWidth + x1] || 0;
      
      const value = 
        v00 * (1 - xFrac) * (1 - yFrac) +
        v10 * xFrac * (1 - yFrac) +
        v01 * (1 - xFrac) * yFrac +
        v11 * xFrac * yFrac;
      
      dstData[y * dstWidth + x] = value;
    }
  }
  
  return dstData;
}

// Apply morphological closing to fill small holes in person region
function morphologicalClose(alpha: Float32Array, width: number, height: number, radius: number): Float32Array {
  const result = new Float32Array(alpha.length);
  const dilated = new Float32Array(alpha.length);
  
  // Dilation pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            maxVal = Math.max(maxVal, alpha[ny * width + nx]);
          }
        }
      }
      dilated[y * width + x] = maxVal;
    }
  }
  
  // Erosion pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minVal = 1;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            minVal = Math.min(minVal, dilated[ny * width + nx]);
          }
        }
      }
      result[y * width + x] = minVal;
    }
  }
  
  return result;
}

// Enhanced edge detection and refinement for portrait cutouts
function refineEdges(imageData: ImageData): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  const tempAlpha = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    tempAlpha[i] = data[i * 4 + 3] / 255;
  }
  
  // Apply morphological closing to fill small holes
  const closed = morphologicalClose(tempAlpha, width, height, 2);
  
  // Edge refinement with Sobel gradient-based sharpening
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const alpha = closed[idx];
      
      if (alpha > EDGE_THRESHOLD && alpha < (1 - EDGE_THRESHOLD)) {
        // Sobel gradient calculation
        const gx = 
          -closed[idx - width - 1] + closed[idx - width + 1] +
          -2 * closed[idx - 1] + 2 * closed[idx + 1] +
          -closed[idx + width - 1] + closed[idx + width + 1];
        
        const gy = 
          -closed[idx - width - 1] - 2 * closed[idx - width] - closed[idx - width + 1] +
          closed[idx + width - 1] + 2 * closed[idx + width] + closed[idx + width + 1];
        
        const gradMag = Math.sqrt(gx * gx + gy * gy);
        
        // Sharpen based on gradient magnitude
        if (gradMag > 0.35) {
          // Strong edge - make crisp
          data[idx * 4 + 3] = alpha > 0.5 ? 255 : 0;
        } else {
          // Smooth sigmoid transition for soft edges (hair, etc.)
          const smoothed = 1 / (1 + Math.exp(-14 * (alpha - 0.5)));
          data[idx * 4 + 3] = Math.round(smoothed * 255);
        }
      } else {
        data[idx * 4 + 3] = Math.round(closed[idx] * 255);
      }
    }
  }
}

// Remove stray artifacts and isolated pixels (background remnants)
function removeArtifacts(imageData: ImageData): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Hard threshold pass - eliminate very faint/strong alpha
  for (let i = 0; i < width * height; i++) {
    const alpha = data[i * 4 + 3];
    if (alpha < ALPHA_CUTOFF_LOW) data[i * 4 + 3] = 0;
    else if (alpha > ALPHA_CUTOFF_HIGH) data[i * 4 + 3] = 255;
  }
  
  // Copy alpha for neighborhood analysis
  const tempAlpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    tempAlpha[i] = data[i * 4 + 3];
  }
  
  // Remove isolated clusters (stray background pixels)
  for (let y = 3; y < height - 3; y++) {
    for (let x = 3; x < width - 3; x++) {
      const idx = y * width + x;
      const alpha = tempAlpha[idx];
      
      if (alpha > 0) {
        let opaqueNeighbors = 0;
        
        // Check 7x7 neighborhood
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = (y + dy) * width + (x + dx);
            if (tempAlpha[nIdx] > 128) opaqueNeighbors++;
          }
        }
        
        // Remove if too isolated
        if (opaqueNeighbors < 10 && alpha < 200) {
          data[idx * 4 + 3] = 0;
        }
      }
    }
  }
}

// Gaussian-like feathering for smooth portrait edges
function applyFeathering(imageData: ImageData, radius: number): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const alphaChannel = new Float32Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    alphaChannel[i] = data[i * 4 + 3] / 255;
  }
  
  // Two-pass box blur approximation of Gaussian
  const blurred = new Float32Array(width * height);
  
  for (let pass = 0; pass < 2; pass++) {
    const source = pass === 0 ? alphaChannel : blurred;
    const target = pass === 0 ? blurred : alphaChannel;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weight = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              // Gaussian-like weight based on distance
              const dist = Math.sqrt(dx * dx + dy * dy);
              const w = Math.exp(-(dist * dist) / (2 * radius * radius));
              sum += source[ny * width + nx] * w;
              weight += w;
            }
          }
        }
        
        target[y * width + x] = sum / weight;
      }
    }
  }
  
  // Blend feathered edges while preserving solid person regions
  for (let i = 0; i < width * height; i++) {
    const originalAlpha = data[i * 4 + 3] / 255;
    const featheredAlpha = alphaChannel[i];
    
    let finalAlpha;
    if (originalAlpha > 0.93) {
      // Keep solid foreground (person body)
      finalAlpha = originalAlpha;
    } else if (originalAlpha < 0.07) {
      // Aggressively remove background remnants
      finalAlpha = featheredAlpha * 0.15;
    } else {
      // Smooth transition zone (hair, edges)
      finalAlpha = featheredAlpha;
    }
    
    data[i * 4 + 3] = Math.round(Math.max(0, Math.min(1, finalAlpha)) * 255);
  }
}

// Fill holes inside the detected person region
function fillHoles(imageData: ImageData): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const idx = y * width + x;
      const alpha = data[idx * 4 + 3];
      
      if (alpha < 50) {
        let opaqueCount = 0;
        let totalCount = 0;
        
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            totalCount++;
            if (data[((y + dy) * width + (x + dx)) * 4 + 3] > 180) opaqueCount++;
          }
        }
        
        // Fill if surrounded by opaque pixels (inside person)
        if (opaqueCount > totalCount * 0.6) {
          data[idx * 4 + 3] = 255;
        }
      }
    }
  }
}

// Clean up mask edges to remove color bleeding from background
function cleanupMaskEdges(imageData: ImageData): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      
      // For semi-transparent edge pixels
      if (alpha > 0 && alpha < 200) {
        const neighbors = [
          data[((y - 1) * width + x) * 4 + 3],
          data[((y + 1) * width + x) * 4 + 3],
          data[(y * width + x - 1) * 4 + 3],
          data[(y * width + x + 1) * 4 + 3]
        ];
        
        const hasTransparentNeighbor = neighbors.some(n => n < 40);
        const hasOpaqueNeighbor = neighbors.some(n => n > 210);
        
        if (hasTransparentNeighbor && hasOpaqueNeighbor) {
          // Edge pixel - slightly boost alpha for cleaner cutout
          data[idx + 3] = Math.min(255, Math.round(alpha * 1.15));
        }
      }
    }
  }
}

// Final cleanup pass - remove any remaining background haze
function finalCleanup(imageData: ImageData): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Remove very low alpha values that appear as haze
  for (let i = 0; i < width * height; i++) {
    const alpha = data[i * 4 + 3];
    if (alpha > 0 && alpha < 25) {
      data[i * 4 + 3] = 0;
    }
  }
  
  // Edge pass - ensure clean transition at boundaries
  const tempAlpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    tempAlpha[i] = data[i * 4 + 3];
  }
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const alpha = tempAlpha[idx];
      
      if (alpha > 0 && alpha < 255) {
        // Count opaque vs transparent neighbors
        let transparentCount = 0;
        let opaqueCount = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nAlpha = tempAlpha[(y + dy) * width + (x + dx)];
            if (nAlpha < 30) transparentCount++;
            if (nAlpha > 225) opaqueCount++;
          }
        }
        
        // If mostly surrounded by transparent, make transparent
        if (transparentCount >= 5 && opaqueCount <= 2) {
          data[idx * 4 + 3] = 0;
        }
        // If mostly surrounded by opaque, make opaque
        else if (opaqueCount >= 5 && transparentCount <= 2) {
          data[idx * 4 + 3] = 255;
        }
      }
    }
  }
}

export const removeBackground = async (
  imageElement: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> => {
  const startTime = performance.now();
  
  try {
    console.log('Starting background removal with RMBG-1.4...');
    
    const model = await getSegmenter(onProgress);
    
    onProgress?.('Preparing image...', 30);
    const canvas = resizeImage(imageElement);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    onProgress?.('Detecting person...', 50);
    const results = await model(imageData);
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      throw new Error('No segmentation results');
    }
    
    onProgress?.('Creating mask...', 65);
    
    // RMBG-1.4 returns direct foreground mask
    let bestMask = results[0];
    
    // Find person-specific segment if available
    const personLabels = ['person', 'foreground', 'subject', 'human', 'portrait'];
    for (const result of results) {
      if (result.label && personLabels.some(l => result.label.toLowerCase().includes(l))) {
        bestMask = result;
        break;
      }
    }
    
    if (!bestMask?.mask) {
      throw new Error('Could not detect subject in image');
    }
    
    console.log('Using segment:', bestMask.label || 'foreground');
    
    onProgress?.('Processing mask...', 75);
    
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d')!;
    
    outputCtx.imageSmoothingEnabled = true;
    outputCtx.imageSmoothingQuality = 'high';
    outputCtx.drawImage(canvas, 0, 0);
    
    const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const pixels = outputImageData.data;
    const maskData = bestMask.mask.data;
    const maskWidth = bestMask.mask.width;
    const maskHeight = bestMask.mask.height;
    
    // Use bilinear interpolation if mask size differs
    let interpolatedMask: Float32Array;
    if (maskWidth !== outputCanvas.width || maskHeight !== outputCanvas.height) {
      interpolatedMask = bilinearInterpolate(
        maskData,
        maskWidth,
        maskHeight,
        outputCanvas.width,
        outputCanvas.height
      );
    } else {
      interpolatedMask = new Float32Array(maskData);
    }
    
    // Apply mask - RMBG outputs foreground directly (person = high value)
    for (let i = 0; i < interpolatedMask.length; i++) {
      const maskValue = interpolatedMask[i];
      pixels[i * 4 + 3] = Math.round(maskValue * 255);
    }
    
    onProgress?.('Refining edges...', 85);
    
    // Multi-pass post-processing for artifact-free portrait cutouts
    fillHoles(outputImageData);
    removeArtifacts(outputImageData);
    refineEdges(outputImageData);
    cleanupMaskEdges(outputImageData);
    applyFeathering(outputImageData, FEATHER_RADIUS);
    finalCleanup(outputImageData);
    
    outputCtx.putImageData(outputImageData, 0, 0);
    
    onProgress?.('Complete!', 100);
    
    const elapsed = performance.now() - startTime;
    console.log(`Background removal completed in ${(elapsed / 1000).toFixed(2)}s`);
    
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
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

export const clearModel = () => {
  segmenter = null;
};
