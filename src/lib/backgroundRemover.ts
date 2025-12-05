import { pipeline, env, RawImage } from '@huggingface/transformers';

// Configure transformers.js for optimal performance
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 512;
const FEATHER_RADIUS = 3;

let segmenter: any = null;
let isLoadingModel = false;

// Load the RMBG-1.4 model (optimized for person detection)
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
    // Use briaai/RMBG-1.4 - purpose-built for background removal with person focus
    segmenter = await pipeline(
      'image-segmentation',
      'briaai/RMBG-1.4',
      { device: 'webgpu' }
    );
    onProgress?.('Model ready', 20);
  } catch (error) {
    console.log('WebGPU not available, trying CPU with RMBG...');
    try {
      segmenter = await pipeline(
        'image-segmentation',
        'briaai/RMBG-1.4'
      );
    } catch (e) {
      // Fallback to segformer if RMBG fails
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
  
  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);
  
  return canvas;
}

// Bilinear interpolation for smoother mask scaling
function bilinearInterpolate(
  srcData: Float32Array | number[],
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): Float32Array {
  const dstData = new Float32Array(dstWidth * dstHeight);
  
  const xRatio = srcWidth / dstWidth;
  const yRatio = srcHeight / dstHeight;
  
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
      
      // Bilinear interpolation formula
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

// Apply edge refinement for cleaner cutouts
function refineEdges(imageData: ImageData): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Find edge pixels and refine them
  const tempAlpha = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    tempAlpha[i] = data[i * 4 + 3] / 255;
  }
  
  // Edge detection and refinement pass
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const alpha = tempAlpha[idx];
      
      // Check if this is an edge pixel (partial transparency)
      if (alpha > 0.1 && alpha < 0.9) {
        // Calculate gradient magnitude
        const left = tempAlpha[idx - 1];
        const right = tempAlpha[idx + 1];
        const top = tempAlpha[idx - width];
        const bottom = tempAlpha[idx + width];
        
        const gradX = right - left;
        const gradY = bottom - top;
        const gradMag = Math.sqrt(gradX * gradX + gradY * gradY);
        
        // Sharpen edges based on gradient
        if (gradMag > 0.3) {
          // This is a strong edge - keep it sharp
          data[idx * 4 + 3] = alpha > 0.5 ? 255 : 0;
        } else {
          // Smooth transition - apply sigmoid for smoother falloff
          const smoothed = 1 / (1 + Math.exp(-10 * (alpha - 0.5)));
          data[idx * 4 + 3] = Math.round(smoothed * 255);
        }
      }
    }
  }
}

// Remove artifacts and stray pixels
function removeArtifacts(imageData: ImageData): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // First pass: threshold very low/high alpha
  for (let i = 0; i < width * height; i++) {
    const alpha = data[i * 4 + 3];
    if (alpha < 25) {
      data[i * 4 + 3] = 0;
    } else if (alpha > 230) {
      data[i * 4 + 3] = 255;
    }
  }
  
  // Second pass: remove isolated pixels
  const tempAlpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    tempAlpha[i] = data[i * 4 + 3];
  }
  
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const idx = y * width + x;
      const alpha = tempAlpha[idx];
      
      if (alpha > 0) {
        let opaqueNeighbors = 0;
        let totalChecked = 0;
        
        // Check 5x5 neighborhood
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = (y + dy) * width + (x + dx);
            totalChecked++;
            if (tempAlpha[nIdx] > 100) opaqueNeighbors++;
          }
        }
        
        // Remove if too isolated
        if (opaqueNeighbors < 6 && alpha < 180) {
          data[idx * 4 + 3] = 0;
        }
      }
    }
  }
}

// Apply Gaussian-like feathering for smooth edges
function applyFeathering(imageData: ImageData, radius: number): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const alphaChannel = new Float32Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    alphaChannel[i] = data[i * 4 + 3] / 255;
  }
  
  // Box blur approximation (2 passes)
  const blurred = new Float32Array(width * height);
  
  for (let pass = 0; pass < 2; pass++) {
    const source = pass === 0 ? alphaChannel : blurred;
    const target = pass === 0 ? blurred : alphaChannel;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += source[ny * width + nx];
              count++;
            }
          }
        }
        
        target[y * width + x] = sum / count;
      }
    }
  }
  
  // Blend feathered edges while preserving solid areas
  for (let i = 0; i < width * height; i++) {
    const originalAlpha = data[i * 4 + 3] / 255;
    const featheredAlpha = alphaChannel[i];
    
    let finalAlpha;
    if (originalAlpha > 0.9) {
      finalAlpha = originalAlpha;
    } else if (originalAlpha < 0.1) {
      finalAlpha = featheredAlpha * 0.3;
    } else {
      finalAlpha = featheredAlpha;
    }
    
    data[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, finalAlpha)) * 255);
  }
}

// Fill small holes in the mask
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
            const nIdx = (y + dy) * width + (x + dx);
            totalCount++;
            if (data[nIdx * 4 + 3] > 200) opaqueCount++;
          }
        }
        
        if (opaqueCount > totalCount * 0.7) {
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
    
    // Step 1: Load model (cached after first use)
    const model = await getSegmenter(onProgress);
    
    // Step 2: Prepare image
    onProgress?.('Preparing image...', 30);
    const canvas = resizeImage(imageElement);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    // Step 3: Run segmentation
    onProgress?.('Detecting person...', 50);
    const results = await model(imageData);
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      throw new Error('No segmentation results');
    }
    
    onProgress?.('Creating mask...', 65);
    
    // RMBG-1.4 returns direct mask for foreground (person)
    let bestMask = results[0];
    
    // Try to find person-specific segment if available
    const personLabels = ['person', 'foreground', 'subject', 'human'];
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
    
    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d')!;
    
    // Draw original image with high quality
    outputCtx.imageSmoothingEnabled = true;
    outputCtx.imageSmoothingQuality = 'high';
    outputCtx.drawImage(canvas, 0, 0);
    
    // Get image data and apply mask
    const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const pixels = outputImageData.data;
    const maskData = bestMask.mask.data;
    const maskWidth = bestMask.mask.width;
    const maskHeight = bestMask.mask.height;
    
    // Use bilinear interpolation if mask size differs from output
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
    
    // Apply mask - RMBG outputs foreground mask directly (person = white)
    for (let i = 0; i < interpolatedMask.length; i++) {
      const maskValue = interpolatedMask[i];
      // RMBG mask: high value = foreground (keep), low value = background (remove)
      pixels[i * 4 + 3] = Math.round(maskValue * 255);
    }
    
    onProgress?.('Smoothing edges...', 85);
    
    // Apply post-processing for clean edges
    fillHoles(outputImageData);
    removeArtifacts(outputImageData);
    refineEdges(outputImageData);
    applyFeathering(outputImageData, FEATHER_RADIUS);
    
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
