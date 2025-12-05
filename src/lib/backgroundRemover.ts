import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js for optimal performance
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 512;
const FEATHER_RADIUS = 3; // Feather pixels for smooth edges

let segmenter: any = null;
let isLoadingModel = false;

// Load the segmentation model once and cache it
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
    segmenter = await pipeline(
      'image-segmentation',
      'Xenova/segformer-b0-finetuned-ade-512-512',
      { device: 'webgpu' }
    );
    onProgress?.('Model ready', 20);
  } catch (error) {
    console.log('WebGPU not available, using CPU...');
    segmenter = await pipeline(
      'image-segmentation',
      'Xenova/segformer-b0-finetuned-ade-512-512'
    );
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
  ctx.drawImage(image, 0, 0, width, height);
  
  return canvas;
}

// Apply Gaussian-like feathering for smooth edges
function applyFeathering(imageData: ImageData, radius: number): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const alphaChannel = new Float32Array(width * height);
  
  // Extract alpha channel
  for (let i = 0; i < width * height; i++) {
    alphaChannel[i] = data[i * 4 + 3] / 255;
  }
  
  // Apply box blur to alpha channel (faster approximation of Gaussian)
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
  
  // Write back feathered alpha
  for (let i = 0; i < width * height; i++) {
    const originalAlpha = data[i * 4 + 3] / 255;
    // Blend feathered edges while preserving solid areas
    const featheredAlpha = alphaChannel[i];
    
    // Use original alpha for solid areas, feathered for edges
    let finalAlpha;
    if (originalAlpha > 0.9) {
      finalAlpha = originalAlpha; // Keep solid
    } else if (originalAlpha < 0.1) {
      finalAlpha = featheredAlpha * 0.5; // Reduce stray pixels
    } else {
      finalAlpha = featheredAlpha; // Smooth edges
    }
    
    data[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, finalAlpha)) * 255);
  }
}

// Remove stray pixels and clean up mask
function cleanupMask(imageData: ImageData): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Threshold very low alpha values to remove noise
  for (let i = 0; i < width * height; i++) {
    const alpha = data[i * 4 + 3];
    if (alpha < 30) {
      data[i * 4 + 3] = 0; // Remove very faint pixels
    } else if (alpha > 225) {
      data[i * 4 + 3] = 255; // Solidify nearly opaque pixels
    }
  }
  
  // Remove isolated pixels (noise cleanup)
  const tempAlpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    tempAlpha[i] = data[i * 4 + 3];
  }
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const alpha = tempAlpha[idx];
      
      if (alpha > 0) {
        // Count opaque neighbors
        let opaqueNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = (y + dy) * width + (x + dx);
            if (tempAlpha[nIdx] > 128) opaqueNeighbors++;
          }
        }
        
        // Remove isolated pixels (less than 3 neighbors)
        if (opaqueNeighbors < 3 && alpha < 200) {
          data[idx * 4 + 3] = 0;
        }
      }
    }
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
        // Count surrounding opaque pixels in a larger area
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
        
        // Fill if surrounded by mostly opaque pixels (hole filling)
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
    console.log('Starting background removal...');
    
    // Step 1: Load model (cached after first use)
    const model = await getSegmenter(onProgress);
    
    // Step 2: Prepare image
    onProgress?.('Preparing image...', 30);
    const canvas = resizeImage(imageElement);
    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    
    // Step 3: Run segmentation
    onProgress?.('Detecting person...', 50);
    const results = await model(imageData);
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      throw new Error('No segmentation results');
    }
    
    onProgress?.('Creating mask...', 65);
    
    // Find person segments
    const personLabels = ['person', 'people', 'human', 'man', 'woman', 'child', 'boy', 'girl'];
    let personMask = results.find((r: any) => 
      personLabels.some(label => r.label?.toLowerCase().includes(label))
    );
    
    let isPersonMask = !!personMask;
    
    // Fallback to foreground segments
    if (!personMask) {
      const backgroundLabels = ['wall', 'floor', 'ceiling', 'sky', 'building', 'tree', 'grass', 'road', 'sidewalk', 'water', 'ground', 'field', 'mountain', 'sea', 'river'];
      personMask = results.find((r: any) => 
        !backgroundLabels.some(label => r.label?.toLowerCase().includes(label))
      );
    }
    
    if (!personMask && results[0]?.mask) {
      personMask = results[0];
    }
    
    if (!personMask?.mask) {
      throw new Error('Could not detect subject in image');
    }
    
    console.log('Using segment:', personMask.label, 'isPerson:', isPersonMask);
    
    onProgress?.('Processing mask...', 75);
    
    // Create output canvas at original size for quality
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d')!;
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Get image data and apply mask
    const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const pixels = outputImageData.data;
    const maskData = personMask.mask.data;
    
    // Apply mask to alpha channel
    for (let i = 0; i < maskData.length; i++) {
      const maskValue = maskData[i];
      const alpha = isPersonMask 
        ? Math.round(maskValue * 255)
        : Math.round((1 - maskValue) * 255);
      pixels[i * 4 + 3] = alpha;
    }
    
    onProgress?.('Smoothing edges...', 85);
    
    // Apply post-processing for clean edges
    fillHoles(outputImageData);
    cleanupMask(outputImageData);
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
