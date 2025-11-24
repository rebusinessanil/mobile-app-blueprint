import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateBackground {
  id: string;
  template_id: string;
  background_image_url: string;
  slot_number: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTemplateBackgrounds = (templateId?: string) => {
  const [backgrounds, setBackgrounds] = useState<TemplateBackground[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('template_backgrounds')
          .select('*')
          .eq('is_active', true)
          .order('slot_number', { ascending: true });

        if (templateId) {
          query = query.eq('template_id', templateId);
        }

        const { data, error } = await query;

        if (error) throw error;

        setBackgrounds(data || []);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching backgrounds:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBackgrounds();

    // Set up real-time subscription for instant updates
    const channel = supabase
      .channel(`template-backgrounds-${templateId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'template_backgrounds',
          filter: templateId ? `template_id=eq.${templateId}` : undefined,
        },
        (payload) => {
          console.log('Background changed:', payload);
          fetchBackgrounds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [templateId]);

  return { backgrounds, loading, error };
};

export const uploadTemplateBackground = async (
  templateId: string,
  file: File,
  slotNumber: number = 1,
  categorySlug?: string
): Promise<{ id: string | null; url: string | null; error: Error | null }> => {
  try {
    // Validate slot_number is between 1-16
    if (slotNumber < 1 || slotNumber > 16) {
      throw new Error(`Invalid slot number: ${slotNumber}. Must be between 1-16.`);
    }

    // First check if slot is already occupied
    const { data: existing } = await supabase
      .from('template_backgrounds')
      .select('id, background_image_url')
      .eq('template_id', templateId)
      .eq('slot_number', slotNumber)
      .maybeSingle();

    // Upload to storage with category folder structure
    const fileExt = file.name.split('.').pop();
    const fileName = `template-${templateId}-slot-${slotNumber}-${Date.now()}.${fileExt}`;
    const filePath = categorySlug 
      ? `${categorySlug}/${fileName}`
      : fileName;

    const { error: uploadError } = await supabase.storage
      .from('template-backgrounds')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('template-backgrounds')
      .getPublicUrl(filePath);

    // Upsert: Update if exists, insert if new
    const { data, error: dbError } = await supabase
      .from('template_backgrounds')
      .upsert({
        id: existing?.id, // Keep same ID if updating
        template_id: templateId,
        background_image_url: publicUrl,
        slot_number: slotNumber,
        is_active: true,
      }, {
        onConflict: 'template_id,slot_number'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Clean up old storage file if we replaced an existing background
    if (existing?.background_image_url) {
      const urlParts = existing.background_image_url.split('/template-backgrounds/');
      if (urlParts.length > 1) {
        const oldPath = urlParts[1];
        await supabase.storage
          .from('template-backgrounds')
          .remove([oldPath]);
      }
    }

    return { id: data.id, url: publicUrl, error: null };
  } catch (err) {
    return { id: null, url: null, error: err as Error };
  }
};

export const removeTemplateBackground = async (
  backgroundId: string
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('template_backgrounds')
      .delete()
      .eq('id', backgroundId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};

export const toggleBackgroundActive = async (
  backgroundId: string,
  isActive: boolean
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('template_backgrounds')
      .update({ is_active: isActive })
      .eq('id', backgroundId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};
