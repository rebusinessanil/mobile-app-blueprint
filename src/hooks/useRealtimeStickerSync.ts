import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface RealtimeStickerSyncOptions {
  rankId?: string;
  categoryId?: string;
  onUpdate?: () => void;
  showToast?: boolean;
}

/**
 * Real-time sync hook for sticker updates.
 * Listens to all sticker changes for the given rank and triggers callback.
 */
export const useRealtimeStickerSync = ({
  rankId,
  categoryId,
  onUpdate,
  showToast = false,
}: RealtimeStickerSyncOptions) => {
  const handleUpdate = useCallback(() => {
    onUpdate?.();
  }, [onUpdate]);

  useEffect(() => {
    if (!rankId) return;

    const channelName = categoryId
      ? `stickers-sync-${rankId}-${categoryId}`
      : `stickers-sync-${rankId}`;

    logger.log('Setting up real-time sticker sync:', { rankId, categoryId });

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

          // Check if this change affects our rank
          const affectsOurRank =
            (newData?.rank_id === rankId) ||
            (oldData?.rank_id === rankId);

          // Optional category filter
          const affectsOurCategory = !categoryId ||
            (newData?.category_id === categoryId) ||
            (oldData?.category_id === categoryId);

          if (affectsOurRank && affectsOurCategory) {
            logger.log('Sticker update received:', {
              event: payload.eventType,
              rankId,
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
        logger.log('Sticker sync subscription:', status);
      });

    return () => {
      logger.log('Cleaning up sticker sync subscription');
      supabase.removeChannel(channel);
    };
  }, [rankId, categoryId, handleUpdate]);
};
