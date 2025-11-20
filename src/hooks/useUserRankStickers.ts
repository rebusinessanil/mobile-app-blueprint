import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserRankSticker {
  id: string;
  rank_id: string;
  slot_number: number;
  image_url: string;
  name: string;
  is_active: boolean;
}

/**
 * Hook for fetching rank-specific stickers for user banner creation
 * Fetches stickers for a specific rank with strict slot isolation
 */
export const useUserRankStickers = (rankId?: string) => {
  const [stickers, setStickers] = useState<UserRankSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!rankId) {
      setStickers([]);
      setLoading(false);
      return;
    }

    const fetchStickers = async () => {
      try {
        setLoading(true);
        
        // Fetch ONLY stickers for this specific rank
        const { data, error } = await supabase
          .from('stickers')
          .select('id, rank_id, slot_number, image_url, name, is_active')
          .eq('rank_id', rankId)
          .eq('is_active', true)
          .order('slot_number', { ascending: true });

        if (error) throw error;

        // Return only active stickers for this rank
        setStickers(data || []);
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to load rank stickers');
      } finally {
        setLoading(false);
      }
    };

    fetchStickers();
  }, [rankId]);

  /**
   * Get sticker for a specific slot
   * @param slotNumber - The slot number (1-16)
   * @returns The sticker for that slot, or null if not found
   */
  const getStickerForSlot = (slotNumber: number): UserRankSticker | null => {
    return stickers.find(s => s.slot_number === slotNumber) || null;
  };

  return { 
    stickers, 
    loading, 
    error, 
    getStickerForSlot 
  };
};
