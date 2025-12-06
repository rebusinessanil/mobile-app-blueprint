import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface GlobalSticker {
  id: string;
  rank_id: string | null;
  category_id: string | null;
  banner_category: string | null;
  slot_number: number | null;
  image_url: string;
  name: string;
  is_active: boolean;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
}

interface UseGlobalStickersOptions {
  rankId?: string;
  bannerCategory?: string;
  categoryId?: string;
}

export const useGlobalStickers = ({
  rankId,
  bannerCategory,
  categoryId,
}: UseGlobalStickersOptions) => {
  const [stickers, setStickers] = useState<GlobalSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStickers = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('stickers')
        .select('id, rank_id, category_id, banner_category, slot_number, image_url, name, is_active, position_x, position_y, scale, rotation')
        .eq('is_active', true);

      // Apply filters based on what's provided
      if (rankId) {
        query = query.eq('rank_id', rankId);
      }
      if (bannerCategory) {
        query = query.eq('banner_category', bannerCategory);
      }
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error: fetchError } = await query.order('slot_number', { ascending: true });

      if (fetchError) throw fetchError;

      const formattedStickers: GlobalSticker[] = (data || []).map(s => ({
        id: s.id,
        rank_id: s.rank_id,
        category_id: s.category_id,
        banner_category: s.banner_category,
        slot_number: s.slot_number,
        image_url: s.image_url,
        name: s.name,
        is_active: s.is_active ?? true,
        position_x: s.position_x ?? 50,
        position_y: s.position_y ?? 50,
        scale: s.scale ?? 1.0,
        rotation: s.rotation ?? 0,
      }));

      setStickers(formattedStickers);
      setError(null);
    } catch (err) {
      logger.error('Error fetching global stickers:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [rankId, bannerCategory, categoryId]);

  // Initial fetch
  useEffect(() => {
    fetchStickers();
  }, [fetchStickers]);

  // Real-time subscription for INSERT, UPDATE, DELETE
  useEffect(() => {
    const channelName = `global-stickers-${rankId || 'all'}-${bannerCategory || 'all'}-${categoryId || 'all'}`;
    
    logger.log('Setting up global stickers realtime subscription:', channelName);

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
          logger.log('Sticker INSERT event:', payload);
          const newSticker = payload.new as GlobalSticker;
          
          // Check if this sticker matches our filters
          const matchesFilters = 
            (!rankId || newSticker.rank_id === rankId) &&
            (!bannerCategory || newSticker.banner_category === bannerCategory) &&
            (!categoryId || newSticker.category_id === categoryId);

          if (matchesFilters && newSticker.is_active) {
            setStickers(prev => {
              // Check if already exists
              if (prev.some(s => s.id === newSticker.id)) {
                return prev;
              }
              return [...prev, {
                ...newSticker,
                position_x: newSticker.position_x ?? 50,
                position_y: newSticker.position_y ?? 50,
                scale: newSticker.scale ?? 1.0,
                rotation: newSticker.rotation ?? 0,
              }];
            });
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
          logger.log('Sticker UPDATE event:', payload);
          const updatedSticker = payload.new as GlobalSticker;
          
          // Replace the existing sticker with updated data
          setStickers(prev => 
            prev.map(s => s.id === updatedSticker.id 
              ? {
                  ...updatedSticker,
                  position_x: updatedSticker.position_x ?? 50,
                  position_y: updatedSticker.position_y ?? 50,
                  scale: updatedSticker.scale ?? 1.0,
                  rotation: updatedSticker.rotation ?? 0,
                }
              : s
            )
          );
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
          logger.log('Sticker DELETE event:', payload);
          const deletedSticker = payload.old as GlobalSticker;
          
          // Remove the deleted sticker
          setStickers(prev => prev.filter(s => s.id !== deletedSticker.id));
        }
      )
      .subscribe((status) => {
        logger.log('Global stickers subscription status:', status);
      });

    return () => {
      logger.log('Cleaning up global stickers subscription');
      supabase.removeChannel(channel);
    };
  }, [rankId, bannerCategory, categoryId]);

  // Save sticker transform (admin function)
  const saveSticker = useCallback(async (
    stickerId: string,
    updates: {
      position_x?: number;
      position_y?: number;
      scale?: number;
      rotation?: number;
    }
  ) => {
    try {
      const { data, error } = await supabase
        .from('stickers')
        .update({
          position_x: updates.position_x,
          position_y: updates.position_y,
          scale: updates.scale,
          rotation: updates.rotation,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stickerId)
        .select('*')
        .single();

      if (error) throw error;

      logger.log('Sticker saved successfully:', data);
      return { data, error: null };
    } catch (err) {
      logger.error('Error saving sticker:', err);
      return { data: null, error: err as Error };
    }
  }, []);

  return {
    stickers,
    loading,
    error,
    refetch: fetchStickers,
    saveSticker,
  };
};
