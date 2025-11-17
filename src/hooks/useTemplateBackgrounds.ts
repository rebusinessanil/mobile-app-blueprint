import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateBackground {
  id: string;
  template_index: number;
  background_image_url: string;
  created_at: string;
  updated_at: string;
}

export const useTemplateBackgrounds = () => {
  const [backgrounds, setBackgrounds] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const { data, error } = await supabase
          .from('template_backgrounds')
          .select('*')
          .order('template_index', { ascending: true });

        if (error) throw error;

        // Convert array to record for easy lookup
        const backgroundsMap: Record<number, string> = {};
        data?.forEach((bg) => {
          backgroundsMap[bg.template_index] = bg.background_image_url;
        });
        setBackgrounds(backgroundsMap);
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
  }, []);

  return { backgrounds, loading, error };
};

export const uploadTemplateBackground = async (
  templateIndex: number,
  file: File
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    // Upload to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `template-${templateIndex}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('template-backgrounds')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('template-backgrounds')
      .getPublicUrl(filePath);

    // Update or insert in database
    const { error: dbError } = await supabase
      .from('template_backgrounds')
      .upsert(
        {
          template_index: templateIndex,
          background_image_url: publicUrl,
        },
        { onConflict: 'template_index' }
      );

    if (dbError) throw dbError;

    return { url: publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err as Error };
  }
};

export const removeTemplateBackground = async (
  templateIndex: number
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('template_backgrounds')
      .delete()
      .eq('template_index', templateIndex);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};
