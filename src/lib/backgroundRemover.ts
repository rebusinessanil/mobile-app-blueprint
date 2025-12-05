import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js for optimal performance
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 512; // Smaller for faster processing

let segmenter: any = null;
let isLoadingModel = false;

// Load the segmentation model once and cache it
async function getSegmenter(onProgress?: (stage: string, percent: number) => void) {
  if (segmenter) return segmenter;
  
  if (isLoadingModel) {
    // Wait for existing load to complete
    while (isLoadingModel) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return segmenter;
  }
  
  isLoadingModel = true;
  onProgress?.('Loading AI model...', 10);
  
  try {
    // Use segformer - fast and reliable for background removal
    segmenter = await pipeline(
      'image-segmentation',
      'Xenova/segformer-b0-finetuned-ade-512-512',
      { 
        device: 'webgpu',
      }
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

  // Resize for faster processing
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

export const removeBackground = async (
  imageElement: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> => {
  const startTime = performance.now();
  
  try {
    console.log('Starting fast background removal...');
    
    // Step 1: Load model (cached after first use)
    const model = await getSegmenter(onProgress);
    
    // Step 2: Prepare image quickly
    onProgress?.('Preparing image...', 30);
    const canvas = resizeImage(imageElement);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Step 3: Run segmentation
    onProgress?.('Detecting person...', 50);
    const results = await model(imageData);
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      throw new Error('No segmentation results');
    }
    
    onProgress?.('Creating mask...', 70);
    
    // Find person/human segments or use the largest foreground segment
    const personLabels = ['person', 'people', 'human', 'man', 'woman', 'child', 'boy', 'girl'];
    let personMask = results.find((r: any) => 
      personLabels.some(label => r.label?.toLowerCase().includes(label))
    );
    
    // If no person found, use any foreground segment (not wall, floor, ceiling, sky, etc.)
    if (!personMask) {
      const backgroundLabels = ['wall', 'floor', 'ceiling', 'sky', 'building', 'tree', 'grass', 'road', 'sidewalk', 'water'];
      personMask = results.find((r: any) => 
        !backgroundLabels.some(label => r.label?.toLowerCase().includes(label))
      );
    }
    
    // Fall back to first result if nothing else works
    if (!personMask && results[0]?.mask) {
      personMask = results[0];
    }
    
    if (!personMask?.mask) {
      throw new Error('Could not detect subject in image');
    }
    
    onProgress?.('Applying mask...', 85);
    
    // Create output canvas
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
    
    // Apply mask to alpha channel - INVERT to keep the subject
    for (let i = 0; i < maskData.length; i++) {
      // Invert: 1 - maskValue keeps the detected subject
      const alpha = Math.round((1 - maskData[i]) * 255);
      pixels[i * 4 + 3] = alpha;
    }
    
    // Quick edge smoothing
    smoothEdges(outputImageData);
    
    outputCtx.putImageData(outputImageData, 0, 0);
    
    onProgress?.('Complete!', 100);
    
    const elapsed = performance.now() - startTime;
    console.log(`Background removal completed in ${(elapsed / 1000).toFixed(2)}s`);
    
    // Convert to blob
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

// Simple edge smoothing - fast and effective
function smoothEdges(imageData: ImageData): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Single pass smoothing for speed
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      
      // Only smooth edge pixels (not fully transparent or opaque)
      if (alpha > 10 && alpha < 245) {
        // Average with neighbors
        const neighbors = [
          data[((y - 1) * width + x) * 4 + 3],
          data[((y + 1) * width + x) * 4 + 3],
          data[(y * width + x - 1) * 4 + 3],
          data[(y * width + x + 1) * 4 + 3],
        ];
        const avg = (alpha + neighbors.reduce((a, b) => a + b, 0)) / 5;
        data[idx + 3] = Math.round(avg);
      }
    }
  }
}

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
