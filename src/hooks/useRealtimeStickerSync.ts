import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { BannerCategoryType } from './useGlobalStickers';

interface RealtimeStickerSyncOptions {
  /** Banner category for universal filtering */
  bannerCategory?: BannerCategoryType;
  /** For rank banners */
  rankId?: string;
  /** Template or category ID */
  categoryId?: string;
  /** Callback when stickers update */
  onUpdate?: () => void;
}

/**
 * Universal real-time sync hook for sticker updates across ALL categories.
 * Listens to all sticker changes and triggers callback for the matching category.
 */
export const useRealtimeStickerSync = ({
  bannerCategory,
  rankId,
  categoryId,
  onUpdate,
}: RealtimeStickerSyncOptions) => {
  const handleUpdate = useCallback(() => {
    onUpdate?.();
  }, [onUpdate]);

  useEffect(() => {
    // Need at least one filter to subscribe
    if (!bannerCategory && !rankId && !categoryId) return;

    const channelParts = ['stickers-sync'];
    if (bannerCategory) channelParts.push(bannerCategory);
    if (rankId) channelParts.push(rankId);
    if (categoryId) channelParts.push(categoryId);
    const channelName = channelParts.join('-');

    logger.log('Setting up universal sticker sync:', { bannerCategory, rankId, categoryId });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stickers',
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;

          // Check banner category filter
          const matchesCategory = !bannerCategory ||
            (newData?.banner_category === bannerCategory) ||
            (oldData?.banner_category === bannerCategory);

          // Check rank filter
          const matchesRank = !rankId ||
            (newData?.rank_id === rankId) ||
            (oldData?.rank_id === rankId);

          // Check template/category filter
          const matchesTemplate = !categoryId ||
            (newData?.category_id === categoryId) ||
            (oldData?.category_id === categoryId);

          if (matchesCategory && matchesRank && matchesTemplate) {
            logger.log('Sticker update received:', {
              event: payload.eventType,
              bannerCategory: newData?.banner_category || oldData?.banner_category,
              slot: newData?.slot_number || oldData?.slot_number,
              position: { x: newData?.position_x, y: newData?.position_y },
              scale: newData?.scale,
              rotation: newData?.rotation,
            });

            handleUpdate();
          }
        }
      )
      .subscribe((status) => {
        logger.log('Universal sticker sync subscription:', status);
      });

    return () => {
      logger.log('Cleaning up sticker sync subscription');
      supabase.removeChannel(channel);
    };
  }, [bannerCategory, rankId, categoryId, handleUpdate]);
};
