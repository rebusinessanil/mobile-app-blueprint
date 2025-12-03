import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface RealtimeStickerSyncOptions {
  categoryId?: string;
  rankId?: string;
  onUpdate?: () => void;
}

export const useRealtimeStickerSync = ({
  categoryId,
  rankId,
  onUpdate,
}: RealtimeStickerSyncOptions) => {
  useEffect(() => {
    if (!categoryId || !rankId) return;

    logger.log('Setting up real-time sync for:', { categoryId, rankId });

    const channel = supabase
      .channel(`stickers-${categoryId}-${rankId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stickers',
          filter: `category_id=eq.${categoryId}`,
        },
        (payload) => {
          logger.log('Real-time sticker update:', payload);
          
          // Only trigger update if the change is for the current rank
          if (payload.new && (payload.new as any).rank_id === rankId) {
            toast.success('Banner preview updated', {
              description: 'Sticker changes synced in real-time',
            });
            onUpdate?.();
          }
        }
      )
      .subscribe((status) => {
        logger.log('Real-time subscription status:', status);
      });

    return () => {
      logger.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [categoryId, rankId, onUpdate]);
};
