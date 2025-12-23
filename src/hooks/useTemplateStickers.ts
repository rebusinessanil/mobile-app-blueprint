import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateSticker {
  id: string;
  rank_id: string | null;
  category_id: string | null;
  slot_number: number | null;
  image_url: string;
  name: string;
  is_active: boolean | null;
  position_x?: number | null;
  position_y?: number | null;
  scale?: number | null;
  rotation?: number | null;
}

export const useTemplateStickers = (templateId?: string) => {
  const [stickers, setStickers] = useState<TemplateSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!templateId) {
      setStickers([]);
      setLoading(false);
      return;
    }

    const fetchStickers = async () => {
      try {
        setLoading(true);
        
        // Get the template's category_id and (optional) rank_id
        const { data: template, error: templateError } = await supabase
          .from('templates')
          .select('rank_id, category_id')
          .eq('id', templateId)
          .maybeSingle();
        
        if (templateError) throw templateError;
        if (!template?.category_id) {
          setStickers([]);
          setLoading(false);
          return;
        }

        // Fetch stickers for this template's category.
        // If the template is rank-based, also filter by rank_id.
        let query = supabase
          .from('stickers')
          .select('*')
          .eq('category_id', template.category_id)
          .order('slot_number', { ascending: true });

        if (template.rank_id) {
          query = query.eq('rank_id', template.rank_id);
        } else {
          query = query.is('rank_id', null);
        }

        const { data, error } = await query;
        if (error) throw error;

        setStickers(data || []);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to load stickers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStickers();

    // Subscribe to changes
    const channel = supabase
      .channel(`template-stickers-${templateId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stickers',
        },
        () => {
          fetchStickers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [templateId]);

  return { stickers, loading, error };
};

export const uploadTemplateSticker = async (
  templateId: string,
  file: File,
  slotNumber: number,
  name?: string
): Promise<{ url?: string; error?: Error }> => {
  try {
    // Get template's category_id and (optional) rank_id
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('rank_id, category_id')
      .eq('id', templateId)
      .maybeSingle();
    
    if (templateError) throw templateError;
    if (!template?.category_id) throw new Error('Template has no associated category');

    // Upload image to storage
    const fileExt = file.name.split('.').pop();
    const safeRank = template.rank_id ?? 'no-rank';
    const fileName = `${safeRank}-${templateId}-slot-${slotNumber}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('stickers')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('stickers')
      .getPublicUrl(fileName);

    // Check if sticker exists for this category (+ rank if applicable) and slot
    let existingQuery = supabase
      .from('stickers')
      .select('id, image_url')
      .eq('category_id', template.category_id)
      .eq('slot_number', slotNumber);

    if (template.rank_id) {
      existingQuery = existingQuery.eq('rank_id', template.rank_id);
    } else {
      existingQuery = existingQuery.is('rank_id', null);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      // Update existing sticker
      const { error: updateError } = await supabase
        .from('stickers')
        .update({
          image_url: publicUrl,
          name: name || `Slot ${slotNumber}`,
          is_active: true,
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;

      // Clean up old file if different
      if (existing.image_url && existing.image_url !== publicUrl) {
        const oldPath = existing.image_url.split('/stickers/')[1];
        if (oldPath) {
          await supabase.storage.from('stickers').remove([oldPath]);
        }
      }
    } else {
      // Insert new sticker
      const { error: insertError } = await supabase
        .from('stickers')
        .insert({
          rank_id: template.rank_id ?? null,
          category_id: template.category_id,
          slot_number: slotNumber,
          name: name || `Slot ${slotNumber}`,
          image_url: publicUrl,
          is_active: true,
          position_x: 50,
          position_y: 50,
          scale: 1.0,
          rotation: 0,
        });

      if (insertError) throw insertError;
    }

    return { url: publicUrl };
  } catch (err) {
    console.error('Failed to upload sticker:', err);
    return { error: err as Error };
  }
};

export const removeTemplateSticker = async (stickerId: string): Promise<{ error?: Error }> => {
  try {
    // Get sticker to delete its file
    const { data: sticker, error: fetchError } = await supabase
      .from('stickers')
      .select('image_url')
      .eq('id', stickerId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    if (sticker?.image_url) {
      const filePath = sticker.image_url.split('/stickers/')[1];
      if (filePath) {
        await supabase.storage.from('stickers').remove([filePath]);
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('stickers')
      .delete()
      .eq('id', stickerId);

    if (deleteError) throw deleteError;

    return {};
  } catch (err) {
    return { error: err as Error };
  }
};

export const toggleStickerActive = async (
  stickerId: string,
  isActive: boolean
): Promise<{ error?: Error }> => {
  try {
    const { error } = await supabase
      .from('stickers')
      .update({ is_active: isActive })
      .eq('id', stickerId);

    if (error) throw error;
    return {};
  } catch (err) {
    return { error: err as Error };
  }
};
