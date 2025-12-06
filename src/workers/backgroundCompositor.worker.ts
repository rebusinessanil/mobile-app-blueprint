// Web Worker for final compositing: applies alpha mask to original image and returns PNG blob.
// Uses OffscreenCanvas + createImageBitmap. Built for modern browsers.
// Memory is cleaned up after each operation to prevent leaks.

self.onmessage = async (ev: MessageEvent) => {
  const { type, payload } = ev.data;
  
  // Local references for cleanup
  let bitmap: ImageBitmap | null = null;
  let canvas: OffscreenCanvas | null = null;
  let ctx: OffscreenCanvasRenderingContext2D | null = null;
  
  try {
    if (type === 'COMPOSE') {
      const { imageBuffer, imageMime, maskBuffer, width, height, options } = payload;

      const imageBlob = new Blob([imageBuffer], { type: imageMime || 'image/png' });
      
      try {
        bitmap = await createImageBitmap(imageBlob);
      } catch (err: any) {
        self.postMessage({ type: 'ERROR', message: 'createImageBitmap failed: ' + err?.message });
        return;
      }

      if (typeof OffscreenCanvas === 'undefined') {
        self.postMessage({ type: 'ERROR', message: 'OffscreenCanvas not available in worker' });
        return;
      }

      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext('2d');
      
      if (!ctx) {
        self.postMessage({ type: 'ERROR', message: 'Could not get 2d context' });
        return;
      }
      
      canvas.width = width;
      canvas.height = height;

      // Draw image scaled to target
      ctx.drawImage(bitmap, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const mask = new Uint8ClampedArray(maskBuffer);

      // Apply mask alpha
      for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
        data[p + 3] = mask[i];
      }

      ctx.putImageData(imageData, 0, 0);

      const mime = options?.mime || 'image/png';
      const quality = options?.quality ?? 1.0;

      const outBlob = await canvas.convertToBlob({ type: mime, quality });
      const ab = await outBlob.arrayBuffer();
      
      // @ts-ignore - Transferable array is valid for postMessage
      self.postMessage({ type: 'RESULT', blobBuffer: ab, mime }, [ab]);
      
    }
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', message: err?.message });
  } finally {
    // Clean up memory after each operation
    if (bitmap) {
      bitmap.close();
      bitmap = null;
    }
    canvas = null;
    ctx = null;
  }
};
