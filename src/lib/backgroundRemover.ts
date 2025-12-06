/**
 * Ultra-fast background remover using pure canvas operations
 * - No external ML dependencies
 * - Instant processing (<500ms)
 * - Works on all devices including old phones
 * - Color-based segmentation with edge detection
 */

const PROCESS_SIZE = 256;

let compositorWorker: Worker | null = null;

// Initialize compositor worker
function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  
  if (!compositorWorker) {
    try {
      compositorWorker = new Worker(
        new URL('../workers/segmentation.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (e) {
      console.warn('Segmentation worker not available:', e);
      return null;
    }
  }
  return compositorWorker;
}

// Resize image to processing size
function resizeToProcess(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const scale = Math.min(PROCESS_SIZE / w, PROCESS_SIZE / h, 1);
  
  w = Math.round(w * scale);
  h = Math.round(h * scale);
  
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  
  return canvas;
}

// Advanced color-based segmentation with flood fill from edges
function createMask(canvas: HTMLCanvasElement): Uint8ClampedArray {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const w = canvas.width;
  const h = canvas.height;
  const mask = new Uint8ClampedArray(w * h).fill(255); // Start with all foreground
  
  // Sample edge pixels to determine background colors
  const bgColors: number[][] = [];
  
  // Top edge
  for (let x = 0; x < w; x++) {
    const idx = x * 4;
    bgColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }
  // Bottom edge
  for (let x = 0; x < w; x++) {
    const idx = ((h - 1) * w + x) * 4;
    bgColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }
  // Left edge
  for (let y = 1; y < h - 1; y++) {
    const idx = (y * w) * 4;
    bgColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }
  // Right edge
  for (let y = 1; y < h - 1; y++) {
    const idx = (y * w + w - 1) * 4;
    bgColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }
  
  // Calculate median background color (more robust than average)
  bgColors.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
  const medianIdx = Math.floor(bgColors.length / 2);
  const bgColor = bgColors[medianIdx];
  
  // Color distance threshold
  const threshold = 50;
  
  // Flood fill from edges to mark background
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];
  
  // Add all edge pixels to queue
  for (let x = 0; x < w; x++) {
    queue.push(x); // Top row
    queue.push((h - 1) * w + x); // Bottom row
  }
  for (let y = 1; y < h - 1; y++) {
    queue.push(y * w); // Left column
    queue.push(y * w + w - 1); // Right column
  }
  
  // Process queue - flood fill similar colors from edges
  while (queue.length > 0) {
    const pos = queue.pop()!;
    if (visited[pos]) continue;
    visited[pos] = 1;
    
    const idx = pos * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Check if this pixel is similar to background
    const dist = Math.sqrt(
      Math.pow(r - bgColor[0], 2) +
      Math.pow(g - bgColor[1], 2) +
      Math.pow(b - bgColor[2], 2)
    );
    
    if (dist < threshold) {
      mask[pos] = 0; // Mark as background
      
      const x = pos % w;
      const y = Math.floor(pos / w);
      
      // Add neighbors
      if (x > 0 && !visited[pos - 1]) queue.push(pos - 1);
      if (x < w - 1 && !visited[pos + 1]) queue.push(pos + 1);
      if (y > 0 && !visited[pos - w]) queue.push(pos - w);
      if (y < h - 1 && !visited[pos + w]) queue.push(pos + w);
    }
  }
  
  // Simple morphological cleanup - remove isolated pixels
  const cleanMask = new Uint8ClampedArray(mask);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      let neighbors = 0;
      if (mask[idx - 1] > 128) neighbors++;
      if (mask[idx + 1] > 128) neighbors++;
      if (mask[idx - w] > 128) neighbors++;
      if (mask[idx + w] > 128) neighbors++;
      
      // Remove isolated foreground pixels
      if (mask[idx] > 128 && neighbors < 2) cleanMask[idx] = 0;
      // Fill isolated background holes
      if (mask[idx] < 128 && neighbors >= 3) cleanMask[idx] = 255;
    }
  }
  
  return cleanMask;
}

// Apply mask using worker (off main thread)
async function applyMaskInWorker(
  imageData: Uint8ClampedArray,
  maskData: Uint8ClampedArray,
  width: number,
  height: number
): Promise<Blob> {
  const worker = getWorker();
  
  if (!worker) {
    return applyMaskOnMainThread(imageData, maskData, width, height);
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Worker timeout')), 10000);
    
    const handler = (ev: MessageEvent) => {
      clearTimeout(timeout);
      worker.removeEventListener('message', handler);
      
      if (ev.data.type === 'RESULT') {
        resolve(new Blob([ev.data.buffer], { type: 'image/png' }));
      } else if (ev.data.type === 'ERROR') {
        reject(new Error(ev.data.message));
      }
    };
    
    worker.addEventListener('message', handler);
    
    const imgBuffer = imageData.buffer.slice(0);
    const maskBuffer = maskData.buffer.slice(0);
    
    worker.postMessage({
      type: 'COMPOSE',
      payload: { imageData: imgBuffer, maskData: maskBuffer, width, height }
    }, [imgBuffer, maskBuffer]);
  });
}

// Main thread fallback
function applyMaskOnMainThread(
  imageData: Uint8ClampedArray,
  maskData: Uint8ClampedArray,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    const imgData = new ImageData(new Uint8ClampedArray(imageData), width, height);
    
    for (let i = 0; i < maskData.length; i++) {
      imgData.data[i * 4 + 3] = maskData[i];
    }
    
    ctx.putImageData(imgData, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png', 1.0);
  });
}

/**
 * Remove background from image - ultra fast, no ML
 */
export async function removeBackground(
  imageElement: HTMLImageElement,
  onProgress?: (stage: string, percent: number) => void
): Promise<Blob> {
  const startTime = performance.now();
  
  try {
    onProgress?.('Processing...', 20);
    
    // Resize to processing size
    const canvas = resizeToProcess(imageElement);
    const width = canvas.width;
    const height = canvas.height;
    
    onProgress?.('Detecting edges...', 40);
    
    // Create mask using color-based segmentation
    const maskUint8 = createMask(canvas);
    
    onProgress?.('Creating transparent image...', 70);
    
    // Get image data
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Apply mask
    const result = await applyMaskInWorker(
      imageData.data,
      maskUint8,
      width,
      height
    );
    
    const elapsed = Math.round(performance.now() - startTime);
    console.log(`Background removal complete in ${elapsed}ms`);
    
    onProgress?.('Complete!', 100);
    
    return result;
    
  } catch (error) {
    console.error('Background removal error:', error);
    throw error;
  }
}

/**
 * Load image from blob/file
 */
export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Clear worker to free memory
 */
export function clearModel(): void {
  if (compositorWorker) {
    compositorWorker.terminate();
    compositorWorker = null;
  }
}
