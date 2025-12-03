import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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

        // CRITICAL: If no templateId, return empty array to prevent cross-contamination
        if (!templateId) {
          logger.warn('useTemplateBackgrounds called without templateId - returning empty array to prevent cross-contamination');
          setBackgrounds([]);
          setError(null);
          setLoading(false);
          return;
        }

        // STRICT filtering: ONLY fetch backgrounds for this exact template_id
        const { data, error } = await supabase
          .from('template_backgrounds')
          .select('*')
          .eq('template_id', templateId) // REQUIRED filter - no fallback
          .eq('is_active', true)
          .order('slot_number', { ascending: true });

        if (error) throw error;

        logger.log(`Fetched ${data?.length || 0} backgrounds for template ${templateId}`);
        
        // Validate slot numbers are in valid range
        if (data && data.length > 0) {
          const invalidSlots = data.filter(bg => bg.slot_number < 1 || bg.slot_number > 16);
          if (invalidSlots.length > 0) {
            logger.error('Invalid slot numbers detected:', invalidSlots.map(bg => bg.slot_number));
          }
        }

        setBackgrounds(data || []);
        setError(null);
      } catch (err) {
        setError(err as Error);
        logger.error('Error fetching backgrounds:', err);
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
          logger.log('Background changed:', payload);
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
  slotNumber: number = 1
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

    // Upload to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `template-${templateId}-slot-${slotNumber}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

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
      const oldPath = existing.background_image_url.split('/').pop();
      if (oldPath) {
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
