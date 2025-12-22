import { useState, useCallback, useEffect, useRef, startTransition } from 'react';
import { removeBackgroundMobile, loadImageMobile, clearMobileModel } from '@/lib/backgroundRemoverMobile';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseBackgroundRemovalOptions {
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

export const useBackgroundRemoval = (options?: UseBackgroundRemovalOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  
  const processingRef = useRef(false);
  const abortRef = useRef(false);

  // Throttled progress updates - only update UI via startTransition after worker returns
  const updateProgress = useCallback(
    throttle((value: number, text: string) => {
      // Only batch UI updates, don't trigger re-renders during processing
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!processingRef.current) {
        clearMobileModel();
      }
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
    updateProgress(0, 'Preparing...');

    try {
      // Fetch and load image
      const response = await fetch(pendingImage);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const img = await loadImageMobile(blob);

      if (abortRef.current) return null;

      // Process with mobile-optimized background removal
      const processedBlob = await removeBackgroundMobile(img, (stage, percent) => {
        if (!abortRef.current) {
          updateProgress(percent, stage);
        }
      });

      if (abortRef.current) return null;

      // Convert blob to data URL - use startTransition for final UI update
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          
          // Only update UI state via startTransition after worker returns final PNG
          startTransition(() => {
            setProgress(100);
            setProgressText('Complete!');
          });
          
          // Delay modal close to ensure smooth transition
          setTimeout(() => {
            startTransition(() => {
              setShowModal(false);
              setPendingImage(null);
              setIsProcessing(false);
              processingRef.current = false;
            });
            
            toast.success('Background removed - transparent PNG ready!');
            options?.onSuccess?.(result);
            resolve(result);
          }, 100);
        };
        reader.onerror = () => {
          throw new Error('Failed to read processed image');
        };
        reader.readAsDataURL(processedBlob);
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
