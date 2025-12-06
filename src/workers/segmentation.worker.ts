// Lightweight Web Worker for selfie segmentation compositing
// Applies mask to image and returns transparent PNG

self.onmessage = async (ev: MessageEvent) => {
  const { type, payload } = ev.data;
  
  try {
    if (type === 'COMPOSE') {
      const { imageData, maskData, width, height } = payload;
      
      if (typeof OffscreenCanvas === 'undefined') {
        self.postMessage({ type: 'ERROR', message: 'OffscreenCanvas not supported' });
        return;
      }
      
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        self.postMessage({ type: 'ERROR', message: 'Could not get 2d context' });
        return;
      }
      
      // Create ImageData from the raw pixel data
      const imgData = new ImageData(new Uint8ClampedArray(imageData), width, height);
      const mask = new Uint8ClampedArray(maskData);
      
      // Apply mask to alpha channel
      for (let i = 0; i < mask.length; i++) {
        imgData.data[i * 4 + 3] = mask[i];
      }
      
      ctx.putImageData(imgData, 0, 0);
      
      // Convert to PNG blob
      const blob = await canvas.convertToBlob({ type: 'image/png', quality: 1.0 });
      const buffer = await blob.arrayBuffer();
      
      // @ts-ignore - Transfer buffer
      self.postMessage({ type: 'RESULT', buffer }, [buffer]);
      
    } else if (type === 'THRESHOLD_MASK') {
      // Simple color-threshold fallback - assumes person is in center with different color than edges
      const { imageData, width, height } = payload;
      const data = new Uint8ClampedArray(imageData);
      const mask = new Uint8ClampedArray(width * height);
      
      // Sample edge pixels to get background color average
      const edgePixels: number[][] = [];
      const sampleSize = 10;
      
      // Top and bottom edges
      for (let x = 0; x < width; x += Math.floor(width / sampleSize)) {
        const topIdx = x * 4;
        const bottomIdx = ((height - 1) * width + x) * 4;
        edgePixels.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
        edgePixels.push([data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]]);
      }
      
      // Left and right edges
      for (let y = 0; y < height; y += Math.floor(height / sampleSize)) {
        const leftIdx = y * width * 4;
        const rightIdx = (y * width + width - 1) * 4;
        edgePixels.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
        edgePixels.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
      }
      
      // Calculate average background color
      const avgBg = edgePixels.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0])
        .map(v => v / edgePixels.length);
      
      // Threshold based on color distance from background
      const threshold = 50;
      for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        const dist = Math.sqrt(
          Math.pow(r - avgBg[0], 2) +
          Math.pow(g - avgBg[1], 2) +
          Math.pow(b - avgBg[2], 2)
        );
        
        // If significantly different from background, keep it
        mask[i] = dist > threshold ? 255 : 0;
      }
      
      // Simple cleanup - remove isolated pixels
      const cleanMask = new Uint8ClampedArray(mask);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          let neighbors = 0;
          if (mask[idx - 1] > 128) neighbors++;
          if (mask[idx + 1] > 128) neighbors++;
          if (mask[idx - width] > 128) neighbors++;
          if (mask[idx + width] > 128) neighbors++;
          
          // Remove isolated pixels
          if (neighbors < 2) cleanMask[idx] = 0;
          // Fill holes
          if (mask[idx] === 0 && neighbors >= 3) cleanMask[idx] = 255;
        }
      }
      
      // @ts-ignore
      self.postMessage({ type: 'MASK_RESULT', mask: cleanMask.buffer }, [cleanMask.buffer]);
    }
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', message: err?.message || 'Unknown error' });
  }
};
