import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js for speed
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 512; // Smaller for speed

let segmenter: any = null;
let isLoading = false;

// Load lightweight segmentation model once
async function getSegmenter(onProgress?: (stage: string, percent: number) => void) {
  if (segmenter) return segmenter;
  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return segmenter;
  }
  
  isLoading = true;
  onProgress?.('Loading AI model...', 10);
  
  try {
    // Use fast segmentation model optimized for people
    segmenter = await pipeline(
      'image-segmentation',
      'Xenova/segformer-b0-finetuned-ade-512-512',
      { device: 'webgpu' }
    );
    onProgress?.('Model ready', 25);
  } catch (error) {
    console.log('WebGPU unavailable, using CPU...');
    segmenter = await pipeline(
      'image-segmentation',
      'Xenova/segformer-b0-finetuned-ade-512-512'
    );
    onProgress?.('Model ready', 25);
  }
  
  isLoading = false;
  return segmenter;
}

function resizeImage(
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  image: HTMLImageElement
): { width: number; height: number; scale: number } {
  let width = image.naturalWidth;
  let height = image.naturalHeight;
  let scale = 1;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      scale = MAX_IMAGE_DIMENSION / width;
      height = Math.round(height * scale);
      width = MAX_IMAGE_DIMENSION;
    } else {
      scale = MAX_IMAGE_DIMENSION / height;
      width = Math.round(width * scale);
      height = MAX_IMAGE_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  
  return { width, height, scale };
}

// Fast mask application without heavy processing
function applyMaskFast(
  imageData: ImageData, 
  maskData: Float32Array | number[], 
  maskWidth: number, 
  maskHeight: number,
  invert: boolean = true
): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const maskX = Math.floor((x / width) * maskWidth);
      const maskY = Math.floor((y / height) * maskHeight);
      const maskIdx = maskY * maskWidth + maskX;
      
      let alpha = maskData[maskIdx] || 0;
      if (invert) alpha = 1 - alpha;
      
      // Simple threshold for clean edges
      alpha = alpha > 0.5 ? 1 : (alpha > 0.3 ? alpha * 2 : 0);
      
      const pixelIdx = (y * width + x) * 4;
      data[pixelIdx + 3] = Math.round(alpha * 255);
    }
  }
}

export const removeBackground = async (
  imageElement: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> => {
  try {
    console.log('Starting fast background removal...');
    const startTime = performance.now();
    
    // Load model (cached after first use)
    const seg = await getSegmenter(onProgress);
    
    onProgress?.('Processing image...', 35);
    
    // Create canvas and resize
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas context');
    
    const { width, height } = resizeImage(canvas, ctx, imageElement);
    console.log(`Processing at ${width}x${height}`);
    
    // Get image as data URL for the model
    const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    onProgress?.('Detecting person...', 50);
    
    // Run segmentation - returns array of segments
    const result = await seg(imageUrl);
    
    onProgress?.('Creating mask...', 70);
    
    // Find person segment (label contains 'person' or take largest non-background)
    let personMask = null;
    let maxScore = 0;
    
    for (const segment of result) {
      const label = segment.label?.toLowerCase() || '';
      // Prioritize person, human, or similar labels
      if (label.includes('person') || label.includes('human') || label.includes('people')) {
        if (segment.score > maxScore) {
          personMask = segment.mask;
          maxScore = segment.score;
        }
      }
    }
    
    // If no person found, use the segment with highest score that's not background/wall/floor
    if (!personMask) {
      const backgroundLabels = ['wall', 'floor', 'ceiling', 'sky', 'building', 'ground', 'grass'];
      for (const segment of result) {
        const label = segment.label?.toLowerCase() || '';
        const isBackground = backgroundLabels.some(bg => label.includes(bg));
        if (!isBackground && segment.score > maxScore && segment.mask) {
          personMask = segment.mask;
          maxScore = segment.score;
        }
      }
    }
    
    // Create output with mask applied
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d', { willReadFrequently: true });
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    outputCtx.drawImage(canvas, 0, 0);
    const outputImageData = outputCtx.getImageData(0, 0, width, height);
    
    if (personMask?.data) {
      onProgress?.('Applying mask...', 85);
      applyMaskFast(
        outputImageData, 
        personMask.data, 
        personMask.width || width, 
        personMask.height || height,
        true // Invert to keep person, remove background
      );
    } else {
      // No mask found - return original with slight transparency
      console.warn('No person detected, returning original');
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    
    onProgress?.('Finalizing...', 95);
    
    const elapsed = performance.now() - startTime;
    console.log(`Background removal completed in ${elapsed.toFixed(0)}ms`);
    
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            onProgress?.('Complete!', 100);
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
  segmenter = null;
};
