import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type BannerCategoryType = 
  | 'rank' 
  | 'bonanza' 
  | 'birthday' 
  | 'anniversary' 
  | 'meeting' 
  | 'festival' 
  | 'motivational' 
  | 'story'
  | 'achievement';

export interface GlobalSticker {
  id: string;
  rank_id: string | null;
  category_id: string | null;
  banner_category: BannerCategoryType;
  slot_number: number;
  image_url: string;
  name: string;
  is_active: boolean;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
}

interface UseGlobalStickersOptions {
  /** The banner category type (rank, bonanza, birthday, anniversary, etc.) */
  bannerCategory: BannerCategoryType;
  /** For rank banners, the specific rank ID */
  rankId?: string;
  /** Optional template/category ID for additional filtering */
  templateId?: string;
  /** Optional slot filter */
  slotNumber?: number;
}

/**
 * Universal hook for fetching stickers with real-time sync across ALL categories.
 * Users only see stickers (read-only). Admin changes sync instantly to all users.
 */
export const useGlobalStickers = ({
  bannerCategory,
  rankId,
  templateId,
  slotNumber,
}: UseGlobalStickersOptions) => {
  const [stickers, setStickers] = useState<GlobalSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStickers = useCallback(async () => {
    if (!bannerCategory) {
      setStickers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let query = supabase
        .from('stickers')
        .select('id, rank_id, category_id, banner_category, slot_number, image_url, name, is_active, position_x, position_y, scale, rotation')
        .eq('banner_category', bannerCategory)
        .eq('is_active', true);

      // For rank banners, filter by rank_id
      if (bannerCategory === 'rank' && rankId) {
        query = query.eq('rank_id', rankId);
      }

      // Optional template/category filter
      if (templateId) {
        query = query.eq('category_id', templateId);
      }

      // Optional slot filter
      if (slotNumber) {
        query = query.eq('slot_number', slotNumber);
      }

      const { data, error: fetchError } = await query.order('slot_number', { ascending: true });

      if (fetchError) throw fetchError;

      const formattedStickers: GlobalSticker[] = (data || []).map(s => ({
        id: s.id,
        rank_id: s.rank_id,
        category_id: s.category_id,
        banner_category: (s.banner_category || bannerCategory) as BannerCategoryType,
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
      logger.log('Global stickers fetched:', { 
        bannerCategory, 
        rankId, 
        count: formattedStickers.length 
      });
    } catch (err) {
      setError(err as Error);
      logger.error('Error fetching global stickers:', err);
    } finally {
      setLoading(false);
    }
  }, [bannerCategory, rankId, templateId, slotNumber]);

  // Initial fetch
  useEffect(() => {
    fetchStickers();
  }, [fetchStickers]);

  // Real-time subscription for instant sync when admin makes changes
  useEffect(() => {
    if (!bannerCategory) return;

    // Create unique channel name based on filters
    const channelParts = ['global-stickers', bannerCategory];
    if (rankId) channelParts.push(rankId);
    if (templateId) channelParts.push(templateId);
    const channelName = channelParts.join('-');

    logger.log('Setting up universal real-time sticker sync:', { 
      bannerCategory, 
      rankId, 
      templateId 
    });

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

          // Check if this change affects our banner category
          const affectsOurCategory = 
            (newData?.banner_category === bannerCategory) || 
            (oldData?.banner_category === bannerCategory);

          // For rank banners, also check rank_id
          const affectsOurRank = bannerCategory !== 'rank' || !rankId ||
            (newData?.rank_id === rankId) || 
            (oldData?.rank_id === rankId);

          // Check template filter
          const affectsOurTemplate = !templateId ||
            (newData?.category_id === templateId) || 
            (oldData?.category_id === templateId);

          if (affectsOurCategory && affectsOurRank && affectsOurTemplate) {
            logger.log('Real-time sticker update detected:', {
              event: payload.eventType,
              bannerCategory,
              slot: newData?.slot_number || oldData?.slot_number,
              position: { x: newData?.position_x, y: newData?.position_y },
              scale: newData?.scale,
              rotation: newData?.rotation,
            });

            // Refetch to get latest state
            fetchStickers();
          }
        }
      )
      .subscribe((status) => {
        logger.log('Universal sticker subscription status:', status);
      });

    return () => {
      logger.log('Cleaning up universal sticker subscription');
      supabase.removeChannel(channel);
    };
  }, [bannerCategory, rankId, templateId, fetchStickers]);

  // Get sticker for a specific slot
  const getStickerForSlot = useCallback((slot: number): GlobalSticker | null => {
    return stickers.find(s => s.slot_number === slot) || null;
  }, [stickers]);

  // Get all stickers grouped by slot
  const stickersBySlot = stickers.reduce<Record<number, GlobalSticker>>((acc, sticker) => {
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

// Re-export for backward compatibility
export { useGlobalStickers as useGlobalRankStickers };
