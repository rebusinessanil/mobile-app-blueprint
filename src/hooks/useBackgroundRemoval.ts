import { useState, useCallback, useRef } from 'react';
import { removeBackground, loadImage, clearModel } from '@/lib/backgroundRemover';
import { toast } from 'sonner';

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
  
  const processingRef = useRef(false);

  const openModal = useCallback((imageUrl: string) => {
    setPendingImage(imageUrl);
    setShowModal(true);
    setProgress(0);
    setProgressText('');
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

    try {
      // Fetch and load image
      const response = await fetch(pendingImage);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const img = await loadImage(blob);

      // Process with progress callback
      const processedBlob = await removeBackground(img, (stage, percent) => {
        setProgress(percent);
        setProgressText(stage);
      });

      // Convert blob to data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          
          setProgress(100);
          setProgressText('Complete!');
          
          // Brief delay for smooth transition
          setTimeout(() => {
            setShowModal(false);
            setPendingImage(null);
            setIsProcessing(false);
            processingRef.current = false;
            
            toast.success('Background removed successfully!');
            options?.onSuccess?.(result);
            resolve(result);
          }, 200);
        };
        reader.onerror = () => {
          throw new Error('Failed to read processed image');
        };
        reader.readAsDataURL(processedBlob);
      });
      
    } catch (error) {
      console.error('Background removal error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      setIsProcessing(false);
      processingRef.current = false;
      setProgress(0);
      setProgressText('');
      
      toast.error(`Failed to remove background: ${errorMsg}`);
      options?.onError?.(error instanceof Error ? error : new Error(errorMsg));
      return null;
    }
  }, [pendingImage, options]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (!processingRef.current) {
      clearModel();
    }
  }, []);

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
    cleanup,
  };
};
