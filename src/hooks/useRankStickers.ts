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
  position_x?: number;
  position_y?: number;
  scale?: number;
  rotation?: number;
}

export const useRankStickers = (rankId?: string, categoryId?: string) => {
  const [stickers, setStickers] = useState<RankSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!rankId || !categoryId) {
      setStickers([]);
      setLoading(false);
      return;
    }

    const fetchStickers = async () => {
      try {
        setLoading(true);
        // Fetch stickers filtered by rank_id, category_id, AND slot_number
      const { data, error } = await supabase
        .from('stickers')
        .select('id, rank_id, category_id, slot_number, image_url, name, is_active, position_x, position_y, scale, rotation')
        .eq('rank_id', rankId)
        .eq('category_id', categoryId)
          .order('slot_number', { ascending: true });

        if (error) throw error;

        // Create array of 16 slots, fill with existing stickers or empty slots
        const stickerSlots: RankSticker[] = Array.from({ length: 16 }, (_, i) => {
          const slotNumber = i + 1;
          const existingSticker = data?.find(s => s.slot_number === slotNumber);
          
          return existingSticker || {
            id: `empty-${rankId}-${categoryId}-${slotNumber}`,
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
  }, [rankId, categoryId]);

  const uploadSticker = async (
    file: File,
    slotNumber: number,
    name: string,
    position_x: number = 50,
    position_y: number = 50,
    scale: number = 1.0,
    rotation: number = 0
  ) => {
    if (!rankId || !categoryId) {
      toast.error('Please select a rank and category first');
      return { data: null, error: new Error('No rank or category selected') };
    }

    try {
      // Upload image to storage with category in filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${rankId}-${categoryId}-slot-${slotNumber}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stickers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stickers')
        .getPublicUrl(filePath);

      // Upsert sticker record with category isolation
      const { data, error } = await supabase
        .from('stickers')
        .upsert({
          rank_id: rankId,
          category_id: categoryId,
          slot_number: slotNumber,
          name,
          image_url: publicUrl,
          is_active: true,
          position_x,
          position_y,
          scale,
          rotation,
        }, {
          onConflict: 'rank_id,slot_number,category_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setStickers(prev => prev.map(s => 
        s.slot_number === slotNumber ? { ...data } : s
      ));

      toast.success(`Sticker uploaded to Slot ${slotNumber}`);
      return { data, error: null };
    } catch (err) {
      toast.error('Failed to upload sticker');
      return { data: null, error: err as Error };
    }
  };

  const deleteSticker = async (slotNumber: number, imageUrl: string) => {
    if (!rankId || !categoryId) {
      return { error: new Error('No rank or category selected') };
    }

    try {
      // Delete from storage if URL exists
      if (imageUrl) {
        const filePath = imageUrl.split('/stickers/')[1];
        if (filePath) {
          await supabase.storage.from('stickers').remove([filePath]);
        }
      }

      // Delete from database with category isolation
      const { error } = await supabase
        .from('stickers')
        .delete()
        .eq('rank_id', rankId)
        .eq('category_id', categoryId)
        .eq('slot_number', slotNumber);

      if (error) throw error;

      // Update local state
      setStickers(prev => prev.map(s => 
        s.slot_number === slotNumber 
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

      toast.success(`Sticker removed from Slot ${slotNumber}`);
      return { error: null };
    } catch (err) {
      toast.error('Failed to delete sticker');
      return { error: err as Error };
    }
  };

  return { stickers, loading, error, uploadSticker, deleteSticker };
};
