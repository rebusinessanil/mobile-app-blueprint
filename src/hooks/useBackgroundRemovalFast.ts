import { useState, useCallback, useEffect, useRef, startTransition } from 'react';
import { removeBackgroundMobile, clearMobileModel } from '@/lib/backgroundRemoverMobile';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseBackgroundRemovalFastOptions {
  onSuccess?: (processedImageUrl: string) => void;
  onError?: (error: Error) => void;
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

export const useBackgroundRemovalFast = (options?: UseBackgroundRemovalFastOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  
  const processingRef = useRef(false);
  const abortRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 1;

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
      abortRef.current = true;
      clearMobileModel();
    };
  }, []);

  const openModal = useCallback((imageUrl: string) => {
    setPendingImage(imageUrl);
    setShowModal(true);
    setProgress(0);
    setProgressText('');
    abortRef.current = false;
    retryCountRef.current = 0;
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

  // Internal processing function with retry support
  const processRemovalInternal = useCallback(async (): Promise<string | null> => {
    if (!pendingImage) return null;

    updateProgress(5, 'Loading image...');

    try {
      // Load image directly from URL - no pre-compression for quality
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = pendingImage;
      });

      if (abortRef.current) {
        clearMobileModel();
        return null;
      }

      updateProgress(10, 'Processing...');

      // Process with mobile-optimized RMBG-1.4 model (CPU-safe)
      const processedBlob = await removeBackgroundMobile(img, (stage, percent) => {
        if (!abortRef.current) {
          const adjustedPercent = 10 + Math.round(percent * 0.85);
          updateProgress(adjustedPercent, stage);
        }
      });

      if (abortRef.current) {
        clearMobileModel();
        return null;
      }

      // Convert blob to data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          
          startTransition(() => {
            setProgress(100);
            setProgressText('Complete!');
          });
          
          // Release memory after processing
          setTimeout(() => {
            clearMobileModel();
          }, 300);
          
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
          clearMobileModel();
          throw new Error('Failed to read processed image');
        };
        reader.readAsDataURL(processedBlob);
      });
    } catch (error) {
      // Attempt retry once
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        logger.warn(`Background removal failed, retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
        updateProgress(5, 'Retrying...');
        clearMobileModel();
        return processRemovalInternal();
      }
      throw error;
    }
  }, [pendingImage, options, updateProgress]);

  const processRemoval = useCallback(async (): Promise<string | null> => {
    if (!pendingImage || processingRef.current) return null;

    setIsProcessing(true);
    processingRef.current = true;
    retryCountRef.current = 0;

    try {
      return await processRemovalInternal();
    } catch (error) {
      logger.error('Background removal error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      clearMobileModel();
      
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
  }, [pendingImage, options, processRemovalInternal]);

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
