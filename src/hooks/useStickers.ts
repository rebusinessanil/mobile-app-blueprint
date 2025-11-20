import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Sticker {
  id: string;
  category_id: string;
  rank_id: string | null;
  slot_number: number | null;
  name: string;
  description: string | null;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface StickerCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export const useStickers = (categoryId?: string) => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStickers = async () => {
      try {
        let query = supabase
          .from('stickers')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setStickers(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchStickers();
  }, [categoryId]);

  return { stickers, loading, error };
};

export const useStickerCategories = () => {
  const [categories, setCategories] = useState<StickerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('sticker_categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

// Hook for fetching stickers by rank and slot
export const useRankStickers = (rankId?: string, slotNumber?: number) => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStickers = async () => {
      try {
        let query = supabase
          .from('stickers')
          .select('*')
          .eq('is_active', true)
          .order('slot_number', { ascending: true });

        if (rankId) {
          query = query.eq('rank_id', rankId);
        }

        if (slotNumber !== undefined) {
          query = query.eq('slot_number', slotNumber);
        }

        const { data, error } = await query;

        if (error) throw error;
        setStickers(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchStickers();
  }, [rankId, slotNumber]);

  return { stickers, loading, error };
};

export const useAdminStickers = () => {
  const uploadSticker = async (
    file: File,
    name: string,
    categoryId: string,
    description?: string
  ) => {
    try {
      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stickers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stickers')
        .getPublicUrl(filePath);

      // Create sticker record
      const { data, error } = await supabase
        .from('stickers')
        .insert({
          name,
          category_id: categoryId,
          description,
          image_url: publicUrl,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const uploadRankSlotSticker = async (
    file: File,
    rankId: string,
    slotNumber: number,
    name?: string
  ) => {
    try {
      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `rank-${rankId}-slot-${slotNumber}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stickers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stickers')
        .getPublicUrl(filePath);

      // Upsert sticker record (insert or update if exists)
      const { data, error } = await supabase
        .from('stickers')
        .upsert({
          rank_id: rankId,
          slot_number: slotNumber,
          name: name || `Rank ${rankId} - Slot ${slotNumber}`,
          image_url: publicUrl,
          is_active: true,
        }, {
          onConflict: 'rank_id,slot_number'
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateSticker = async (
    id: string,
    updates: Partial<Sticker>
  ) => {
    try {
      const { data, error } = await supabase
        .from('stickers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteSticker = async (id: string, imageUrl: string) => {
    try {
      // Extract file path from URL
      const filePath = imageUrl.split('/stickers/')[1];

      // Delete from storage
      if (filePath) {
        await supabase.storage.from('stickers').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('stickers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { uploadSticker, uploadRankSlotSticker, updateSticker, deleteSticker };
};
