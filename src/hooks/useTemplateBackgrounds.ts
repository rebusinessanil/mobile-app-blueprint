import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateBackground {
  id: string;
  template_id: string;
  background_image_url: string;
  display_order: number;
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
        let query = supabase
          .from('template_backgrounds')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (templateId) {
          query = query.eq('template_id', templateId);
        }

        const { data, error } = await query;

        if (error) throw error;

        setBackgrounds(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchBackgrounds();

    // Set up real-time subscription
    const channel = supabase
      .channel('template-backgrounds-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'template_backgrounds',
        },
        () => {
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
  displayOrder: number = 0
): Promise<{ id: string | null; url: string | null; error: Error | null }> => {
  try {
    // Upload to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `template-${templateId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('template-backgrounds')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('template-backgrounds')
      .getPublicUrl(filePath);

    // Insert in database
    const { data, error: dbError } = await supabase
      .from('template_backgrounds')
      .insert({
        template_id: templateId,
        background_image_url: publicUrl,
        display_order: displayOrder,
        is_active: true,
      })
      .select()
      .single();

    if (dbError) throw dbError;

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
