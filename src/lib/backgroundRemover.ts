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
const getMaxDimension = () => isMobile() ? 384 : 1024;

let model: any = null;
let processor: any = null;
let imageWorker: Worker | null = null;

// Initialize web worker
const getImageWorker = (): Worker | null => {
  if (typeof Worker === 'undefined') return null;
  
  if (!imageWorker) {
    try {
      imageWorker = new Worker(
        new URL('../workers/imageProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (e) {
      console.warn('Web Worker not available');
      return null;
    }
  }
  return imageWorker;
};

// Load the RMBG model
async function loadModel(onProgress?: (stage: string, percent: number) => void) {
  if (model && processor) return { model, processor };
  
  onProgress?.('Loading AI model...', 10);
  
  try {
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

// Process entirely in Web Worker
async function processInWorker(
  imageData: ImageData,
  maskData: Float32Array,
  maskWidth: number,
  maskHeight: number,
  mobile: boolean,
  onProgress?: (stage: string, percent: number) => void
): Promise<string> {
  const worker = getImageWorker();
  
  if (!worker) {
    throw new Error('Worker not available');
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Worker timeout'));
    }, 90000); // 90 second timeout
    
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
    
    onProgress?.('Processing image...', 70);
    
    // Send all data to worker for full processing
    worker.postMessage({
      type: 'fullProcess',
      imageData: new Uint8ClampedArray(imageData.data),
      maskData: maskData,
      width: imageData.width,
      height: imageData.height,
      maskWidth: maskWidth,
      maskHeight: maskHeight,
      maxOutputSize: 1024,
      isMobile: mobile
    });
  });
}

export const removeBackground = async (
  imageElement: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> => {
  const mobile = isMobile();
  
  try {
    console.log('Starting background removal...', mobile ? '(mobile mode)' : '(desktop mode)');
    
    // Step 1: Load model (main thread - GPU accelerated)
    const { model: loadedModel, processor: loadedProcessor } = await loadModel(onProgress);
    
    onProgress?.('Preparing image...', 30);
    
    // Step 2: Resize image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const { width, height } = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Processing image at ${width}x${height}`);
    
    // Use JPEG for mobile to reduce memory
    const imageFormat = mobile ? 'image/jpeg' : 'image/png';
    const imageQuality = mobile ? 0.75 : 0.9;
    const imageUrl = canvas.toDataURL(imageFormat, imageQuality);
    
    const rawImage = await RawImage.fromURL(imageUrl);
    
    onProgress?.('Detecting person...', 45);
    
    // Step 3: Run AI model (main thread - GPU)
    const { pixel_values } = await loadedProcessor(rawImage);
    
    onProgress?.('Processing...', 55);
    
    const { output } = await loadedModel({ input: pixel_values });
    
    onProgress?.('Creating mask...', 60);
    
    const maskData = output[0][0].data;
    const maskHeight = output[0][0].dims[0];
    const maskWidth = output[0][0].dims[1];
    
    // Step 4: Get image data for worker
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Step 5: Process everything in worker (mask, refinement, compression)
    const base64Result = await processInWorker(
      imageData,
      maskData,
      maskWidth,
      maskHeight,
      mobile,
      onProgress
    );
    
    // Step 6: Convert base64 to blob
    const response = await fetch(base64Result);
    return await response.blob();
    
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
