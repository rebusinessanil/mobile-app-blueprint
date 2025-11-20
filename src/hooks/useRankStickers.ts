import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RankSticker {
  id: string;
  rank_id: string;
  slot_number: number;
  image_url: string;
  name: string;
  is_active: boolean;
}

export const useRankStickers = (rankId?: string) => {
  const [stickers, setStickers] = useState<RankSticker[]>([]);
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
        const { data, error } = await supabase
          .from('stickers')
          .select('*')
          .eq('rank_id', rankId)
          .order('slot_number', { ascending: true });

        if (error) throw error;

        // Create array of 16 slots, fill with existing stickers or empty slots
        const stickerSlots: RankSticker[] = Array.from({ length: 16 }, (_, i) => {
          const slotNumber = i + 1;
          const existingSticker = data?.find(s => s.slot_number === slotNumber);
          
          return existingSticker || {
            id: `empty-${rankId}-${slotNumber}`,
            rank_id: rankId,
            slot_number: slotNumber,
            image_url: '',
            name: `Slot ${slotNumber}`,
            is_active: false,
          };
        });

        setStickers(stickerSlots);
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to load stickers');
      } finally {
        setLoading(false);
      }
    };

    fetchStickers();
  }, [rankId]);

  const uploadSticker = async (
    file: File,
    slotNumber: number,
    name: string
  ) => {
    if (!rankId) {
      toast.error('Please select a rank first');
      return { data: null, error: new Error('No rank selected') };
    }

    try {
      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${rankId}-slot-${slotNumber}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stickers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stickers')
        .getPublicUrl(filePath);

      // Upsert sticker record - ONLY for this specific rank_id and slot_number
      const { data, error } = await supabase
        .from('stickers')
        .upsert({
          rank_id: rankId,
          slot_number: slotNumber,
          name,
          image_url: publicUrl,
          is_active: true,
        }, {
          onConflict: 'rank_id,slot_number'
        })
        .eq('rank_id', rankId)
        .eq('slot_number', slotNumber)
        .select()
        .single();

      if (error) throw error;

      // Update local state - ONLY the specific slot
      setStickers(prev => prev.map(s => 
        s.rank_id === rankId && s.slot_number === slotNumber 
          ? { ...s, ...data, image_url: publicUrl, name, is_active: true } 
          : s
      ));

      toast.success(`Sticker uploaded to Slot ${slotNumber} only`);
      return { data, error: null };
    } catch (err) {
      toast.error('Failed to upload sticker');
      return { data: null, error: err as Error };
    }
  };

  const deleteSticker = async (slotNumber: number, imageUrl: string) => {
    if (!rankId) return { error: new Error('No rank selected') };

    try {
      // Delete from storage if URL exists
      if (imageUrl) {
        const filePath = imageUrl.split('/stickers/')[1];
        if (filePath) {
          await supabase.storage.from('stickers').remove([filePath]);
        }
      }

      // Delete from database - ONLY this specific rank and slot
      const { error } = await supabase
        .from('stickers')
        .delete()
        .eq('rank_id', rankId)
        .eq('slot_number', slotNumber);

      if (error) throw error;

      // Update local state - ONLY the specific slot for this rank
      setStickers(prev => prev.map(s => 
        s.rank_id === rankId && s.slot_number === slotNumber 
          ? {
              id: `empty-${rankId}-${slotNumber}`,
              rank_id: rankId,
              slot_number: slotNumber,
              image_url: '',
              name: `Slot ${slotNumber}`,
              is_active: false,
            }
          : s
      ));

      toast.success(`Sticker removed from Slot ${slotNumber} only`);
      return { error: null };
    } catch (err) {
      toast.error('Failed to delete sticker');
      return { error: err as Error };
    }
  };

  return { stickers, loading, error, uploadSticker, deleteSticker };
};
