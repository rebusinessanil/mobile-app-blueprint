import { useState, useCallback, useEffect } from 'react';
import { removeBackground, loadImage } from '@/lib/backgroundRemover';
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

  // Prevent page exit during processing
  useEffect(() => {
    if (!isProcessing) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Background removal in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    const handlePopState = (e: PopStateEvent) => {
      if (isProcessing) {
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
  }, []);

  const closeModal = useCallback(() => {
    if (!isProcessing) {
      setShowModal(false);
      setPendingImage(null);
      setProgress(0);
      setProgressText('');
    }
  }, [isProcessing]);

  const keepBackground = useCallback(() => {
    const image = pendingImage;
    closeModal();
    return image;
  }, [pendingImage, closeModal]);

  const processRemoval = useCallback(async (): Promise<string | null> => {
    if (!pendingImage) return null;

    setIsProcessing(true);
    setProgress(0);
    setProgressText('Preparing...');

    try {
      // Fetch image blob
      const response = await fetch(pendingImage);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      
      // Load image element
      const img = await loadImage(blob);

      // Process with progress callback
      const processedBlob = await removeBackground(img, (stage, percent) => {
        setProgress(percent);
        setProgressText(stage);
      });

      // Convert to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setShowModal(false);
          setPendingImage(null);
          setProgress(100);
          setProgressText('Complete!');
          toast.success('Background removed successfully!');
          options?.onSuccess?.(result);
          resolve(result);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read processed image'));
        };
        reader.readAsDataURL(processedBlob);
      });
    } catch (error) {
      logger.error('Background removal error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to remove background: ${errorMsg}`);
      options?.onError?.(error instanceof Error ? error : new Error(errorMsg));
      return null;
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressText('');
    }
  }, [pendingImage, options]);

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
