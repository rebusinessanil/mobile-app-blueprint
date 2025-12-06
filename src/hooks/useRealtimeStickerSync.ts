import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface RealtimeStickerSyncOptions {
  categoryId?: string;
  rankId?: string;
  bannerCategory?: string;
  onUpdate?: () => void;
  onInsert?: (sticker: any) => void;
  onDelete?: (stickerId: string) => void;
  showToast?: boolean;
}

export const useRealtimeStickerSync = ({
  categoryId,
  rankId,
  bannerCategory,
  onUpdate,
  onInsert,
  onDelete,
  showToast = true,
}: RealtimeStickerSyncOptions) => {
  
  const handleUpdate = useCallback(() => {
    logger.log('Sticker update triggered via realtime');
    onUpdate?.();
  }, [onUpdate]);

  useEffect(() => {
    // Create a unique channel name based on filters
    const channelName = `stickers-sync-${categoryId || 'all'}-${rankId || 'all'}-${bannerCategory || 'all'}`;
    
    logger.log('Setting up real-time sticker sync:', { 
      channelName, 
      categoryId, 
      rankId, 
      bannerCategory 
    });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stickers',
        },
        (payload) => {
          logger.log('Real-time sticker INSERT:', payload);
          const newSticker = payload.new as any;
          
          // Check if sticker matches our filters
          const matchesRank = !rankId || newSticker.rank_id === rankId;
          const matchesCategory = !categoryId || newSticker.category_id === categoryId;
          const matchesBannerCategory = !bannerCategory || newSticker.banner_category === bannerCategory;
          
          if (matchesRank && matchesCategory && matchesBannerCategory) {
            if (showToast) {
              toast.success('New sticker added', {
                description: 'Sticker synced in real-time',
              });
            }
            onInsert?.(newSticker);
            handleUpdate();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stickers',
        },
        (payload) => {
          logger.log('Real-time sticker UPDATE:', payload);
          const updatedSticker = payload.new as any;
          
          // Check if sticker matches our filters
          const matchesRank = !rankId || updatedSticker.rank_id === rankId;
          const matchesCategory = !categoryId || updatedSticker.category_id === categoryId;
          const matchesBannerCategory = !bannerCategory || updatedSticker.banner_category === bannerCategory;
          
          if (matchesRank && matchesCategory && matchesBannerCategory) {
            if (showToast) {
              toast.success('Sticker updated', {
                description: 'Changes synced in real-time',
              });
            }
            handleUpdate();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'stickers',
        },
        (payload) => {
          logger.log('Real-time sticker DELETE:', payload);
          const deletedSticker = payload.old as any;
          
          // Check if sticker matches our filters
          const matchesRank = !rankId || deletedSticker.rank_id === rankId;
          const matchesCategory = !categoryId || deletedSticker.category_id === categoryId;
          const matchesBannerCategory = !bannerCategory || deletedSticker.banner_category === bannerCategory;
          
          if (matchesRank && matchesCategory && matchesBannerCategory) {
            if (showToast) {
              toast.info('Sticker removed', {
                description: 'Changes synced in real-time',
              });
            }
            onDelete?.(deletedSticker.id);
            handleUpdate();
          }
        }
      )
      .subscribe((status) => {
        logger.log('Sticker sync subscription status:', status);
      });

    return () => {
      logger.log('Cleaning up sticker sync subscription');
      supabase.removeChannel(channel);
    };
  }, [categoryId, rankId, bannerCategory, handleUpdate, onInsert, onDelete, showToast]);
};
