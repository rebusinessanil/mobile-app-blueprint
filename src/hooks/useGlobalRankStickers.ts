import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface GlobalRankSticker {
  id: string;
  rank_id: string;
  category_id: string | null;
  slot_number: number;
  image_url: string;
  name: string;
  is_active: boolean;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
}

interface UseGlobalRankStickersOptions {
  rankId?: string;
  categoryId?: string;
  slotNumber?: number;
}

/**
 * Global hook for fetching rank stickers with real-time sync.
 * Users only see stickers - no editing. Admin changes sync instantly.
 */
export const useGlobalRankStickers = ({
  rankId,
  categoryId,
  slotNumber,
}: UseGlobalRankStickersOptions = {}) => {
  const [stickers, setStickers] = useState<GlobalRankSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStickers = useCallback(async () => {
    if (!rankId) {
      setStickers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let query = supabase
        .from('stickers')
        .select('id, rank_id, category_id, slot_number, image_url, name, is_active, position_x, position_y, scale, rotation')
        .eq('rank_id', rankId)
        .eq('is_active', true);

      // Optional category filter
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // Optional slot filter
      if (slotNumber) {
        query = query.eq('slot_number', slotNumber);
      }

      const { data, error: fetchError } = await query.order('slot_number', { ascending: true });

      if (fetchError) throw fetchError;

      const formattedStickers: GlobalRankSticker[] = (data || []).map(s => ({
        id: s.id,
        rank_id: s.rank_id || '',
        category_id: s.category_id,
        slot_number: s.slot_number || 1,
        image_url: s.image_url,
        name: s.name,
        is_active: s.is_active ?? true,
        position_x: Number(s.position_x) || 50,
        position_y: Number(s.position_y) || 50,
        scale: Number(s.scale) || 1.0,
        rotation: Number(s.rotation) || 0,
      }));

      setStickers(formattedStickers);
      logger.log('Global stickers fetched:', { rankId, count: formattedStickers.length });
    } catch (err) {
      setError(err as Error);
      logger.error('Error fetching global stickers:', err);
    } finally {
      setLoading(false);
    }
  }, [rankId, categoryId, slotNumber]);

  // Initial fetch
  useEffect(() => {
    fetchStickers();
  }, [fetchStickers]);

  // Real-time subscription for instant sync when admin makes changes
  useEffect(() => {
    if (!rankId) return;

    const channelName = categoryId 
      ? `global-stickers-${rankId}-${categoryId}`
      : `global-stickers-${rankId}`;

    logger.log('Setting up global real-time sticker sync:', { rankId, categoryId });

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

          // If category filter is set, also check category
          const affectsOurCategory = !categoryId || 
            (newData?.category_id === categoryId) || 
            (oldData?.category_id === categoryId);

          if (affectsOurRank && affectsOurCategory) {
            logger.log('Real-time sticker update detected:', {
              event: payload.eventType,
              rankId,
              slotNumber: newData?.slot_number || oldData?.slot_number,
            });

            // Refetch to get latest state
            fetchStickers();
          }
        }
      )
      .subscribe((status) => {
        logger.log('Global sticker subscription status:', status);
      });

    return () => {
      logger.log('Cleaning up global sticker subscription');
      supabase.removeChannel(channel);
    };
  }, [rankId, categoryId, fetchStickers]);

  // Get sticker for a specific slot
  const getStickerForSlot = useCallback((slot: number): GlobalRankSticker | null => {
    return stickers.find(s => s.slot_number === slot) || null;
  }, [stickers]);

  // Get all stickers grouped by slot
  const stickersBySlot = stickers.reduce<Record<number, GlobalRankSticker>>((acc, sticker) => {
    acc[sticker.slot_number] = sticker;
    return acc;
  }, {});

  return {
    stickers,
    stickersBySlot,
    getStickerForSlot,
    loading,
    error,
    refetch: fetchStickers,
  };
};
