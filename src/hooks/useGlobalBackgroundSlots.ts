import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Default gradient colors for 16 slots - Gold & Navy themed palette
const DEFAULT_SLOT_COLORS = [
  'linear-gradient(135deg, hsl(217 30% 12%), hsl(217 25% 18%))', // 1. Deep Navy
  'linear-gradient(135deg, hsl(270 60% 35%), hsl(270 50% 45%))', // 2. Royal Purple
  'linear-gradient(135deg, hsl(45 100% 50%), hsl(45 90% 60%))',  // 3. Rich Gold
  'linear-gradient(135deg, hsl(152 60% 35%), hsl(152 50% 45%))', // 4. Emerald
  'linear-gradient(135deg, hsl(355 70% 40%), hsl(355 60% 50%))', // 5. Ruby Red
  'linear-gradient(135deg, hsl(210 80% 40%), hsl(210 70% 50%))', // 6. Sapphire
  'linear-gradient(135deg, hsl(30 90% 45%), hsl(30 80% 55%))',   // 7. Amber
  'linear-gradient(135deg, hsl(180 60% 35%), hsl(180 50% 45%))', // 8. Teal
  'linear-gradient(135deg, hsl(320 70% 40%), hsl(320 60% 50%))', // 9. Magenta
  'linear-gradient(135deg, hsl(140 50% 30%), hsl(140 40% 40%))', // 10. Forest
  'linear-gradient(135deg, hsl(0 75% 38%), hsl(0 65% 48%))',     // 11. Crimson
  'linear-gradient(135deg, hsl(200 75% 40%), hsl(200 65% 50%))', // 12. Ocean
  'linear-gradient(135deg, hsl(30 70% 35%), hsl(30 60% 45%))',   // 13. Bronze
  'linear-gradient(135deg, hsl(165 55% 40%), hsl(165 45% 50%))', // 14. Jade
  'linear-gradient(135deg, hsl(15 80% 55%), hsl(15 70% 65%))',   // 15. Coral
  'linear-gradient(135deg, hsl(240 60% 40%), hsl(240 50% 50%))', // 16. Indigo
];

export interface BackgroundSlot {
  slotNumber: number;
  imageUrl: string | null;
  defaultColor: string;
  hasImage: boolean;
}

interface UseGlobalBackgroundSlotsOptions {
  templateId?: string;
  storyId?: string;
  festivalId?: string;
  categoryType?: 'rank' | 'bonanza' | 'birthday' | 'anniversary' | 'meeting' | 'festival' | 'motivational' | 'story';
}

export const useGlobalBackgroundSlots = ({
  templateId,
  storyId,
  festivalId,
  categoryType,
}: UseGlobalBackgroundSlotsOptions = {}) => {
  const [slots, setSlots] = useState<BackgroundSlot[]>(() =>
    Array.from({ length: 16 }, (_, i) => ({
      slotNumber: i + 1,
      imageUrl: null,
      defaultColor: DEFAULT_SLOT_COLORS[i],
      hasImage: false,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        setLoading(true);
        
        // Initialize with defaults
        const defaultSlots = Array.from({ length: 16 }, (_, i) => ({
          slotNumber: i + 1,
          imageUrl: null,
          defaultColor: DEFAULT_SLOT_COLORS[i],
          hasImage: false,
        }));

        // Determine the effective story ID for background slots
        // Festival stories use festivalId, regular stories use storyId
        const effectiveStoryId = categoryType === 'festival' ? festivalId : storyId;
        const useStoryBackgrounds = (categoryType === 'story' || categoryType === 'festival') && effectiveStoryId;

        // Fetch from appropriate table based on category
        if (useStoryBackgrounds) {
          // Fetch story background slots for both 'story' and 'festival' categories
          const { data: storySlots, error: storyError } = await supabase
            .from('story_background_slots')
            .select('*')
            .eq('story_id', effectiveStoryId)
            .eq('is_active', true)
            .order('slot_number', { ascending: true });

          if (storyError) throw storyError;

          // Merge story backgrounds with defaults
          const mergedSlots = defaultSlots.map(slot => {
            const storySlot = storySlots?.find(s => s.slot_number === slot.slotNumber);
            return {
              ...slot,
              imageUrl: storySlot?.image_url || null,
              hasImage: !!storySlot?.image_url,
            };
          });

          setSlots(mergedSlots);
          logger.log(`Loaded ${storySlots?.length || 0} story backgrounds for ${categoryType} ${effectiveStoryId}`);
        } else if (templateId) {
          // Fetch template backgrounds
          const { data: templateBgs, error: templateError } = await supabase
            .from('template_backgrounds')
            .select('*')
            .eq('template_id', templateId)
            .eq('is_active', true)
            .order('slot_number', { ascending: true });

          if (templateError) throw templateError;

          // Merge template backgrounds with defaults
          const mergedSlots = defaultSlots.map(slot => {
            const templateBg = templateBgs?.find(bg => bg.slot_number === slot.slotNumber);
            return {
              ...slot,
              imageUrl: templateBg?.background_image_url || null,
              hasImage: !!templateBg?.background_image_url,
            };
          });

          setSlots(mergedSlots);
          logger.log(`Loaded ${templateBgs?.length || 0} template backgrounds for template ${templateId}`);
        } else {
          // No ID provided, use defaults only
          setSlots(defaultSlots);
          logger.log('Using default background colors (no template/story ID provided)');
        }

        setError(null);
      } catch (err) {
        logger.error('Error fetching backgrounds:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchBackgrounds();

    // Set up real-time subscriptions for instant admin updates
    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Determine the effective story ID for real-time sync
    const effectiveStoryId = categoryType === 'festival' ? festivalId : storyId;
    const useStoryBackgrounds = (categoryType === 'story' || categoryType === 'festival') && effectiveStoryId;

    if (useStoryBackgrounds) {
      // Subscribe to story background slots for both 'story' and 'festival' categories
      const storyChannel = supabase
        .channel(`story-backgrounds-${effectiveStoryId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'story_background_slots',
            filter: `story_id=eq.${effectiveStoryId}`,
          },
          (payload) => {
            logger.log(`${categoryType} background updated:`, payload);
            fetchBackgrounds();
          }
        )
        .subscribe();
      channels.push(storyChannel);
    }

    if (templateId) {
      // Subscribe to template backgrounds
      const templateChannel = supabase
        .channel(`template-backgrounds-${templateId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'template_backgrounds',
            filter: `template_id=eq.${templateId}`,
          },
          (payload) => {
            logger.log('Template background updated:', payload);
            fetchBackgrounds();
          }
        )
        .subscribe();
      channels.push(templateChannel);
    }

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [templateId, storyId, festivalId, categoryType]);

  return { slots, loading, error };
};

// Helper to get background style for a specific slot
export const getSlotBackgroundStyle = (slot: BackgroundSlot): React.CSSProperties => {
  if (slot.hasImage && slot.imageUrl) {
    return {
      backgroundImage: `url(${slot.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  
  return {
    background: slot.defaultColor,
  };
};
