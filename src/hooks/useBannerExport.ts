import { useState, useCallback, useRef, startTransition } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

const MAX_FILE_SIZE_MB = 1.5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const TARGET_SIZE = 1000; // Fixed 1000x1000 output

interface ExportOptions {
  pixelRatio?: number;
  quality?: number;
  maxWidth?: number;
}

// Compress image in Web Worker to keep main thread free
const compressInWorker = async (
  dataUrl: string,
  maxSizeBytes: number,
  initialQuality: number = 0.95
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/imageProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Compression timeout'));
    }, 60000);

    worker.onmessage = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      if (e.data.success) {
        resolve(e.data.data);
      } else {
        reject(new Error(e.data.error || 'Compression failed'));
      }
    };

    worker.onerror = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error('Worker error: ' + e.message));
    };

    worker.postMessage({
      type: 'compress',
      dataUrl,
      maxSizeBytes,
      initialQuality
    });
  });
};

// Throttle function to prevent excessive re-renders
const throttle = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

export const useBannerExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const exportingRef = useRef(false);

  // Throttled progress updates
  const updateProgress = useCallback(
    throttle((value: number) => {
      startTransition(() => {
        setProgress(value);
      });
    }, 100),
    []
  );

  const exportBanner = useCallback(async (
    element: HTMLElement,
    options: ExportOptions = {}
  ): Promise<string | null> => {
    if (exportingRef.current) return null;

    // Fixed 1000x1000 at ~74 DPI equivalent (lower pixelRatio for smaller output)
    const elementWidth = element.offsetWidth;
    const pixelRatio = Math.min(TARGET_SIZE / elementWidth, 2.5);

    setIsExporting(true);
    exportingRef.current = true;
    updateProgress(10);

    try {
      // Step 1: Generate optimized PNG at target resolution
      updateProgress(20);
      
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio,
        quality: 0.9,
        backgroundColor: '#000000',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        filter: (node) => {
          if (
            node.classList?.contains('slot-selector') ||
            node.classList?.contains('control-buttons') ||
            node.classList?.contains('whatsapp-float') ||
            node.id === 'ignore-download'
          ) {
            return false;
          }
          return true;
        }
      });

      updateProgress(50);

      // Step 2: Always compress to ensure small file size
      updateProgress(60);
      
      try {
        const compressedUrl = await compressInWorker(
          dataUrl,
          MAX_FILE_SIZE_BYTES,
          0.85
        );
        updateProgress(95);
        
        startTransition(() => {
          setProgress(100);
          setIsExporting(false);
          exportingRef.current = false;
        });
        
        return compressedUrl;
      } catch (compressError) {
        console.warn('Worker compression failed, returning original:', compressError);
        
        startTransition(() => {
          setProgress(100);
          setIsExporting(false);
          exportingRef.current = false;
        });
        
        return dataUrl;
      }

    } catch (error) {
      console.error('Export error:', error);
      startTransition(() => {
        setIsExporting(false);
        exportingRef.current = false;
        setProgress(0);
      });
      throw error;
    }
  }, [updateProgress]);

  const getFileSizeMB = useCallback((dataUrl: string): string => {
    const base64Length = dataUrl.length - dataUrl.indexOf(',') - 1;
    const sizeMB = (base64Length * 0.75 / (1024 * 1024)).toFixed(2);
    return sizeMB;
  }, []);

  return {
    exportBanner,
    isExporting,
    progress,
    getFileSizeMB,
    MAX_FILE_SIZE_MB
  };
};

