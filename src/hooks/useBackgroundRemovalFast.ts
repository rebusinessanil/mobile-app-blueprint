import { useState, useCallback, useEffect, useRef, startTransition } from 'react';
import { removeBackground, loadImage, clearModel } from '@/lib/backgroundRemover';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseBackgroundRemovalFastOptions {
  onSuccess?: (processedImageUrl: string) => void;
  onError?: (error: Error) => void;
  maxDimension?: number; // Max dimension for pre-processing compression
}

// Throttle with leading edge for immediate feedback
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

// Pre-process image: compress and resize before BG removal
const preProcessImage = async (
  imageUrl: string, 
  maxDimension: number = 800
): Promise<{ blob: Blob; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        let { naturalWidth: width, naturalHeight: height } = img;
        
        // Scale down if exceeds max dimension
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw scaled image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression (JPEG 0.85 quality)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, width, height });
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image for pre-processing'));
    img.src = imageUrl;
  });
};

export const useBackgroundRemovalFast = (options?: UseBackgroundRemovalFastOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  
  const processingRef = useRef(false);
  const abortRef = useRef(false);

  // Throttled progress updates
  const updateProgress = useCallback(
    throttle((value: number, text: string) => {
      setProgress(value);
      setProgressText(text);
    }, 100),
    []
  );

  // Prevent page exit during processing
  useEffect(() => {
    if (!isProcessing) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Background removal in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    const handlePopState = (e: PopStateEvent) => {
      if (processingRef.current) {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
        toast.warning('Please wait for background removal to complete');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isProcessing]);

  // Cleanup on unmount - always release memory
  useEffect(() => {
    return () => {
      abortRef.current = true; // Signal abort
      clearModel(); // Always release memory on unmount
    };
  }, []);

  const openModal = useCallback((imageUrl: string) => {
    setPendingImage(imageUrl);
    setShowModal(true);
    setProgress(0);
    setProgressText('');
    abortRef.current = false;
  }, []);

  const closeModal = useCallback(() => {
    if (!processingRef.current) {
      setShowModal(false);
      setPendingImage(null);
      setProgress(0);
      setProgressText('');
    }
  }, []);

  const keepBackground = useCallback(() => {
    const image = pendingImage;
    closeModal();
    return image;
  }, [pendingImage, closeModal]);

  const processRemoval = useCallback(async (): Promise<string | null> => {
    if (!pendingImage || processingRef.current) return null;

    setIsProcessing(true);
    processingRef.current = true;
    updateProgress(0, 'Compressing image...');

    try {
      // Step 1: Pre-process image (compress & resize) to reduce memory
      const maxDim = options?.maxDimension || 800;
      const { blob: compressedBlob } = await preProcessImage(pendingImage, maxDim);
      
      updateProgress(10, 'Loading image...');
      
      // Step 2: Load compressed image for processing
      const img = await loadImage(compressedBlob);

      if (abortRef.current) {
        clearModel(); // Release memory on abort
        return null;
      }

      // Step 3: Process with RMBG-1.4 model (WebGPU → WASM fallback)
      const processedBlob = await removeBackground(img, (stage, percent) => {
        if (!abortRef.current) {
          // Offset progress to account for pre-processing (10% already done)
          const adjustedPercent = 10 + Math.round(percent * 0.9);
          updateProgress(adjustedPercent, stage);
        }
      });

      if (abortRef.current) {
        clearModel(); // Release memory on abort
        return null;
      }

      // Step 4: Convert blob to optimized data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          
          startTransition(() => {
            setProgress(100);
            setProgressText('Complete!');
          });
          
          // Step 5: Release memory after processing
          setTimeout(() => {
            clearModel();
          }, 500);
          
          // Delay modal close for smooth transition
          setTimeout(() => {
            startTransition(() => {
              setShowModal(false);
              setPendingImage(null);
              setIsProcessing(false);
              processingRef.current = false;
            });
            
            toast.success('Background removed successfully!');
            options?.onSuccess?.(result);
            resolve(result);
          }, 100);
        };
        reader.onerror = () => {
          clearModel(); // Release memory on error
          throw new Error('Failed to read processed image');
        };
        reader.readAsDataURL(processedBlob);
      });
    } catch (error) {
      logger.error('Background removal error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Release memory on error
      clearModel();
      
      startTransition(() => {
        setIsProcessing(false);
        processingRef.current = false;
        setProgress(0);
        setProgressText('');
      });
      
      toast.error(`Failed to remove background: ${errorMsg}`);
      options?.onError?.(error instanceof Error ? error : new Error(errorMsg));
      return null;
    }
  }, [pendingImage, options, updateProgress]);

  return {
    isProcessing,
    progress,
    progressText,
    showModal,
    pendingImage,
    openModal,
    closeModal,
    keepBackground,
    processRemoval,
  };
};
