import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

// Mobile detection for adaptive processing
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

// Quality-preserving max dimensions:
// - Only resize if image > 3000px (down to 2500px)
// - No resize for 1000-2500px range (full quality)
// - Mobile: slightly lower to prevent memory issues
const getMaxDimension = () => {
  if (isMobile()) {
    return 2000; // Mobile: max 2000px to prevent memory issues
  }
  return 2500; // Desktop: preserve full quality up to 2500px
};

const RESIZE_THRESHOLD = 3000; // Only resize if larger than this

let model: any = null;
let processor: any = null;
let compositorWorker: Worker | null = null;

// CPU fallback disabled by default - only WebGPU and WASM allowed
let allowCpuFallback = false;

export const setAllowCpuFallback = (allow: boolean) => {
  allowCpuFallback = allow;
};

// Initialize compositor web worker
const getCompositorWorker = (): Worker | null => {
  if (typeof Worker === 'undefined') return null;
  
  if (!compositorWorker) {
    try {
      compositorWorker = new Worker(
        new URL('../workers/backgroundCompositor.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (e) {
      console.warn('Compositor Worker not available');
      return null;
    }
  }
  return compositorWorker;
};

// Load the RMBG model - WebGPU → WASM fallback (CPU disabled unless explicitly allowed)
async function loadModel(onProgress?: (stage: string, percent: number) => void) {
  if (model && processor) return { model, processor };
  
  const mobile = isMobile();
  onProgress?.('Loading AI model...', 10);
  
  // Try WebGPU first with fp16 precision
  try {
    model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
      device: 'webgpu',
      dtype: 'fp16',
    });
    
    processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4');
    
    console.log('RMBG-1.4 loaded with WebGPU (fp16)');
    onProgress?.('Model loaded', 25);
    return { model, processor };
  } catch (webgpuError) {
    console.log('WebGPU not available, falling back to WASM...');
    
    // Try WASM fallback
    try {
      model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
        device: 'wasm',
      });
      
      processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4');
      
      console.log('RMBG-1.4 loaded with WASM');
      onProgress?.('Model loaded', 25);
      return { model, processor };
    } catch (wasmError) {
      // CPU fallback only if explicitly allowed
      if (allowCpuFallback) {
        console.log('WASM not available, falling back to CPU...');
        
        model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
          device: 'cpu',
        });
        
        processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4');
        
        console.log('RMBG-1.4 loaded with CPU fallback');
        onProgress?.('Model loaded', 25);
        return { model, processor };
      }
      
      throw new Error('WebGPU and WASM not available. CPU fallback is disabled.');
    }
  }
}

// Resize only if image exceeds threshold (>3000px)
function resizeImageIfNeeded(
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  image: HTMLImageElement
): { width: number; height: number; wasResized: boolean } {
  const maxDim = getMaxDimension();
  let width = image.naturalWidth;
  let height = image.naturalHeight;
  let wasResized = false;

  // Only resize if exceeds threshold (>3000px)
  const largestDim = Math.max(width, height);
  if (largestDim > RESIZE_THRESHOLD) {
    wasResized = true;
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
    console.log(`Image resized from ${image.naturalWidth}x${image.naturalHeight} to ${width}x${height}`);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  
  return { width, height, wasResized };
}

// Async chunked mask creation - yields to UI every chunk
async function createMaskChunked(
  maskData: Float32Array,
  maskWidth: number,
  maskHeight: number,
  targetWidth: number,
  targetHeight: number,
  onProgress?: (stage: string, percent: number) => void
): Promise<Uint8ClampedArray> {
  const maskLen = targetWidth * targetHeight;
  const result = new Uint8ClampedArray(maskLen);
  const chunkSize = isMobile() ? 10000 : 20000; // Smaller chunks on mobile
  
  const scaleX = maskWidth / targetWidth;
  const scaleY = maskHeight / targetHeight;
  
  let processed = 0;
  
  return new Promise((resolve) => {
    function processChunk() {
      const end = Math.min(maskLen, processed + chunkSize);
      
      for (let i = processed; i < end; i++) {
        const x = i % targetWidth;
        const y = Math.floor(i / targetWidth);
        
        // Bilinear interpolation for smoother mask
        const mx = x * scaleX;
        const my = y * scaleY;
        const mx0 = Math.floor(mx);
        const my0 = Math.floor(my);
        const mx1 = Math.min(mx0 + 1, maskWidth - 1);
        const my1 = Math.min(my0 + 1, maskHeight - 1);
        
        const fx = mx - mx0;
        const fy = my - my0;
        
        const v00 = maskData[my0 * maskWidth + mx0] || 0;
        const v10 = maskData[my0 * maskWidth + mx1] || 0;
        const v01 = maskData[my1 * maskWidth + mx0] || 0;
        const v11 = maskData[my1 * maskWidth + mx1] || 0;
        
        const maskValue = (1 - fx) * (1 - fy) * v00 +
                          fx * (1 - fy) * v10 +
                          (1 - fx) * fy * v01 +
                          fx * fy * v11;
        
        result[i] = Math.round(maskValue * 255);
      }
      
      processed = end;
      const progress = 60 + Math.round((processed / maskLen) * 20);
      onProgress?.('Creating mask...', progress);
      
      if (processed < maskLen) {
        // Yield to UI with requestAnimationFrame for smoother performance
        requestAnimationFrame(processChunk);
      } else {
        resolve(result);
      }
    }
    
    requestAnimationFrame(processChunk);
  });
}

// Compositor worker integration - returns transparent PNG blob
async function composeInWorker(
  imageBuffer: ArrayBuffer,
  imageMime: string,
  maskUint8: Uint8ClampedArray,
  width: number,
  height: number
): Promise<Blob> {
  const worker = getCompositorWorker();
  
  if (!worker) {
    throw new Error('Compositor worker not available');
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Compositor worker timeout'));
    }, 120000); // 2 minute timeout for large images
    
    function onMessage(ev: MessageEvent) {
      clearTimeout(timeout);
      worker.removeEventListener('message', onMessage);
      
      const { type, blobBuffer, mime, message } = ev.data;
      if (type === 'RESULT') {
        const blob = new Blob([blobBuffer], { type: 'image/png' });
        resolve(blob);
      } else if (type === 'ERROR') {
        reject(new Error(message || 'Compositor error'));
      }
    }
    
    worker.addEventListener('message', onMessage);
    
    try {
      // Clone buffers for transfer
      const maskBuffer = maskUint8.buffer.slice(0);
      const imgBuffer = imageBuffer.slice(0);
      
      worker.postMessage({
        type: 'COMPOSE',
        payload: {
          imageBuffer: imgBuffer,
          imageMime: imageMime || 'image/png',
          maskBuffer: maskBuffer,
          width,
          height,
          options: { mime: 'image/png', quality: 1.0 } // Full quality PNG
        }
      }, [imgBuffer, maskBuffer]);
    } catch (err) {
      worker.removeEventListener('message', onMessage);
      clearTimeout(timeout);
      reject(err);
    }
  });
}

export const removeBackground = async (
  imageElement: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> => {
  const mobile = isMobile();
  
  try {
    console.log(`Starting background removal... (${mobile ? 'mobile' : 'desktop'}, original: ${imageElement.naturalWidth}x${imageElement.naturalHeight})`);
    
    // Step 1: Load model with WebGPU → WASM fallback
    const { model: loadedModel, processor: loadedProcessor } = await loadModel(onProgress);
    
    onProgress?.('Preparing image...', 30);
    
    // Step 2: Resize image only if > 3000px (preserves quality for 1000-2500px)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const { width, height, wasResized } = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Processing at ${width}x${height}${wasResized ? ' (resized)' : ' (original quality)'}`);
    
    // Get image as PNG for lossless processing
    const imageUrl = canvas.toDataURL('image/png', 1.0);
    const rawImage = await RawImage.fromURL(imageUrl);
    
    onProgress?.('Detecting person...', 45);
    
    // Step 3: Run AI model inference
    const { pixel_values } = await loadedProcessor(rawImage);
    
    onProgress?.('Processing...', 55);
    
    const { output } = await loadedModel({ input: pixel_values });
    
    onProgress?.('Creating mask...', 60);
    
    const maskData = output[0][0].data;
    const maskHeight = output[0][0].dims[0];
    const maskWidth = output[0][0].dims[1];
    
    // Step 4: Create mask with async chunked processing (yields to UI)
    const maskUint8 = await createMaskChunked(
      maskData,
      maskWidth,
      maskHeight,
      width,
      height,
      onProgress
    );
    
    onProgress?.('Compositing...', 85);
    
    // Step 5: Get original image as PNG buffer for compositor worker
    const imageBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create image blob')),
        'image/png',
        1.0
      );
    });
    const imageBuffer = await imageBlob.arrayBuffer();
    
    // Step 6: Compose in worker using OffscreenCanvas - returns transparent PNG
    const result = await composeInWorker(imageBuffer, 'image/png', maskUint8, width, height);
    
    onProgress?.('Complete!', 100);
    console.log(`Background removal complete - ${width}x${height} transparent PNG`);
    
    return result;
    
  } catch (error) {
    console.error('Background removal error:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
};

// Clear cached model and worker to free memory - call after each job
export const clearModel = () => {
  // Clear model references
  if (model) {
    try {
      // Release any GPU tensors if available
      if (model.dispose) model.dispose();
    } catch (e) {
      // Ignore disposal errors
    }
    model = null;
  }
  
  if (processor) {
    processor = null;
  }
  
  // Terminate and recreate worker to fully release memory
  if (compositorWorker) {
    compositorWorker.terminate();
    compositorWorker = null;
  }
  
  // Force garbage collection hint
  if (typeof window !== 'undefined' && (window as any).gc) {
    try {
      (window as any).gc();
    } catch (e) {
      // GC not available
    }
  }
};
