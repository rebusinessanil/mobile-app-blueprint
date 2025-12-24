import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Sticker {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  // Transform properties for positioned stickers
  position_x?: number;
  position_y?: number;
  scale?: number;
  rotation?: number;
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchCategories();
  }, []);

  const refetch = () => {
    fetchCategories();
  };

  return { categories, loading, error, refetch };
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

  return { uploadSticker, updateSticker, deleteSticker };
};
