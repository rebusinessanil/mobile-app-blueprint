import { useState, useCallback, useEffect, useRef, startTransition } from 'react';
import { removeBackgroundMobile, preloadImageFast, clearMobileModel } from '@/lib/backgroundRemoverMobile';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseBackgroundRemovalOptions {
  onSuccess?: (processedImageUrl: string) => void;
  onError?: (error: Error) => void;
}

export const useBackgroundRemoval = (options?: UseBackgroundRemovalOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  
  const processingRef = useRef(false);
  const abortRef = useRef(false);
  const preloadedImageRef = useRef<HTMLImageElement | null>(null);

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
      preloadedImageRef.current = null;
    };
  }, []);

  const openModal = useCallback(async (imageUrl: string) => {
    // Show modal immediately for instant feedback
    setPendingImage(imageUrl);
    setShowModal(true);
    setProgress(0);
    setProgressText('Loading image...');
    setImageReady(false);
    abortRef.current = false;
    preloadedImageRef.current = null;

    // Preload image in background - fast decode
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      
      // Use fast preload with decode()
      const img = await preloadImageFast(blob);
      preloadedImageRef.current = img;
      
      // Image is ready - hide loading state
      setImageReady(true);
      setProgressText('');
    } catch (error) {
      logger.error('Failed to preload image:', error);
      // Keep modal open but show ready state
      setImageReady(true);
      setProgressText('');
    }
  }, []);

  const closeModal = useCallback(() => {
    if (!processingRef.current) {
      setShowModal(false);
      setPendingImage(null);
      setProgress(0);
      setProgressText('');
      setImageReady(false);
      preloadedImageRef.current = null;
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
    setProgress(5);
    setProgressText('Initializing...');

    try {
      let img = preloadedImageRef.current;
      
      // If not preloaded, load now (fallback)
      if (!img) {
        setProgressText('Loading image...');
        const response = await fetch(pendingImage);
        if (!response.ok) throw new Error('Failed to fetch image');
        const blob = await response.blob();
        img = await preloadImageFast(blob);
      }

      if (abortRef.current) return null;

      // Process with mobile-optimized background removal
      const processedBlob = await removeBackgroundMobile(img, (stage, percent) => {
        if (!abortRef.current) {
          setProgress(percent);
          setProgressText(stage);
        }
      });

      if (abortRef.current) return null;

      // Convert blob to data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          
          startTransition(() => {
            setProgress(100);
            setProgressText('Complete!');
          });
          
          // Short delay for smooth transition
          setTimeout(() => {
            startTransition(() => {
              setShowModal(false);
              setPendingImage(null);
              setIsProcessing(false);
              processingRef.current = false;
              setImageReady(false);
              preloadedImageRef.current = null;
            });
            
            toast.success('Background removed!');
            options?.onSuccess?.(result);
            resolve(result);
          }, 80);
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
        preloadedImageRef.current = null;
      });
      
      toast.error(`Failed to remove background: ${errorMsg}`);
      options?.onError?.(error instanceof Error ? error : new Error(errorMsg));
      return null;
    }
  }, [pendingImage, options]);

  return {
    isProcessing,
    progress,
    progressText,
    showModal,
    pendingImage,
    imageReady,
    openModal,
    closeModal,
    keepBackground,
    processRemoval,
  };
};
