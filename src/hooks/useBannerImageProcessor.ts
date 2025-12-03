import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface PhotoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProcessBannerParams {
  templateUrl: string;
  userPhotoUrl: string;
  photoPosition: PhotoPosition;
  outputFormat?: 'png' | 'jpeg';
  quality?: number;
}

export const useBannerImageProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const processBannerImage = async ({
    templateUrl,
    userPhotoUrl,
    photoPosition,
    outputFormat = 'png',
    quality = 100
  }: ProcessBannerParams): Promise<string | null> => {
    setIsProcessing(true);
    
    try {
      logger.log('Calling backend image processor with Sharp...');
      
      const { data, error } = await supabase.functions.invoke('process-banner-image', {
        body: {
          templateUrl,
          userPhotoUrl,
          photoPosition,
          outputFormat,
          quality
        }
      });

      if (error) {
        logger.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to process image');
      }

      if (!data?.success || !data?.imageUrl) {
        throw new Error('Image processing failed');
      }

      logger.log('Banner processed successfully with sharp edges:', data.imageUrl);
      setProcessedImageUrl(data.imageUrl);
      
      toast.success('Banner processed with clean, sharp edges');
      return data.imageUrl;

    } catch (error) {
      logger.error('Error processing banner image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setProcessedImageUrl(null);
    setIsProcessing(false);
  };

  return {
    processBannerImage,
    isProcessing,
    processedImageUrl,
    reset
  };
};
