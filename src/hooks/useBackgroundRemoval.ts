import { useState, useCallback, useEffect, useRef, startTransition } from 'react';
import { removeBackground, loadImage } from '@/lib/backgroundRemover';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseBackgroundRemovalOptions {
  onSuccess?: (processedImageUrl: string) => void;
  onError?: (error: Error) => void;
}

// Throttle helper to prevent multiple rapid re-renders
const throttle = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = delay - (now - lastCall);
    
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
};

export const useBackgroundRemoval = (options?: UseBackgroundRemovalOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  
  const processingRef = useRef(false);
  const resultRef = useRef<string | null>(null);

  // Throttled progress update to prevent excessive re-renders
  const throttledSetProgress = useRef(
    throttle((value: number) => {
      startTransition(() => {
        setProgress(value);
      });
    }, 100)
  ).current;

  const throttledSetProgressText = useRef(
    throttle((text: string) => {
      startTransition(() => {
        setProgressText(text);
      });
    }, 100)
  ).current;

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

  const openModal = useCallback((imageUrl: string) => {
    setPendingImage(imageUrl);
    setShowModal(true);
    setProgress(0);
    setProgressText('');
    resultRef.current = null;
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
    if (!pendingImage) return null;

    setIsProcessing(true);
    processingRef.current = true;
    setProgress(0);
    setProgressText('Preparing...');

    try {
      // Fetch image blob
      const response = await fetch(pendingImage);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      
      // Load image element
      const img = await loadImage(blob);

      // Process with throttled progress callback
      const processedBlob = await removeBackground(img, (stage, percent) => {
        throttledSetProgress(percent);
        throttledSetProgressText(stage);
      });

      // Convert to data URL with RAF yield
      return new Promise((resolve, reject) => {
        requestAnimationFrame(() => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resultRef.current = result;
            
            // Use startTransition for state updates to prevent blocking
            startTransition(() => {
              setProgress(100);
              setProgressText('Complete!');
            });
            
            // Close modal after a brief delay to ensure UI updates
            requestAnimationFrame(() => {
              startTransition(() => {
                setShowModal(false);
                setPendingImage(null);
                setIsProcessing(false);
                processingRef.current = false;
              });
              
              toast.success('Background removed successfully!');
              options?.onSuccess?.(result);
              resolve(result);
            });
          };
          reader.onerror = () => {
            reject(new Error('Failed to read processed image'));
          };
          reader.readAsDataURL(processedBlob);
        });
      });
    } catch (error) {
      logger.error('Background removal error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
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
  }, [pendingImage, options, throttledSetProgress, throttledSetProgressText]);

  return {
    // State
    isProcessing,
    progress,
    progressText,
    showModal,
    pendingImage,
    // Actions
    openModal,
    closeModal,
    keepBackground,
    processRemoval,
  };
};
