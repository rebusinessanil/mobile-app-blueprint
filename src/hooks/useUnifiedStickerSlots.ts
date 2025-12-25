import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Unified Sticker Slot System
 * 
 * This is the SINGLE SOURCE OF TRUTH for all sticker slot operations.
 * Both Admin Sticker Management and Banner Preview consume this hook.
 * 
 * Resolution priority: Entity ID (specific) > Banner Category (general)
 * 
 * All categories follow the exact same 16-slot workflow:
 * - Rank Promotion: uses rank_id + banner_category
 * - Bonanza: uses trip_id + banner_category
 * - Birthday: uses birthday_id + banner_category
 * - Anniversary: uses anniversary_id + banner_category
 * - Motivational: uses motivational_banner_id + banner_category
 * - Festival: uses festival_id + banner_category
 * - Stories: uses story_id + banner_category
 * - Other categories: uses banner_category only
 */

export interface UnifiedStickerSlot {
  id: string;
  slot_number: number;
  image_url: string;
  name: string;
  is_active: boolean;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
  // Entity references
  rank_id: string | null;
  trip_id: string | null;
  birthday_id: string | null;
  anniversary_id: string | null;
  motivational_banner_id: string | null;
  festival_id?: string | null;
  story_id?: string | null;
  banner_category: string | null;
  category_id: string | null;
}

export interface UnifiedStickerOptions {
  // Entity IDs - priority resolution (only one should be set)
  rankId?: string;
  tripId?: string;
  birthdayId?: string;
  anniversaryId?: string;
  motivationalBannerId?: string;
  festivalId?: string;
  storyId?: string;
  // Banner category for general categorization
  bannerCategory?: string;
  // Enable/disable realtime sync
  enableRealtime?: boolean;
  // Only fetch active stickers
  activeOnly?: boolean;
}

/**
 * Builds the query filter based on entity priority
 * Priority: specific entity ID > banner category
 */
const buildQueryFilter = (options: UnifiedStickerOptions) => {
  const {
    rankId,
    tripId,
    birthdayId,
    anniversaryId,
    motivationalBannerId,
    festivalId,
    storyId,
    bannerCategory,
  } = options;

  // Return the primary entity filter and banner category
  if (rankId) return { entityColumn: 'rank_id', entityValue: rankId, bannerCategory };
  if (tripId) return { entityColumn: 'trip_id', entityValue: tripId, bannerCategory };
  if (birthdayId) return { entityColumn: 'birthday_id', entityValue: birthdayId, bannerCategory };
  if (anniversaryId) return { entityColumn: 'anniversary_id', entityValue: anniversaryId, bannerCategory };
  if (motivationalBannerId) return { entityColumn: 'motivational_banner_id', entityValue: motivationalBannerId, bannerCategory };
  if (festivalId) return { entityColumn: 'festival_id', entityValue: festivalId, bannerCategory };
  if (storyId) return { entityColumn: 'story_id', entityValue: storyId, bannerCategory };
  
  // No specific entity, use banner category only
  return { entityColumn: null, entityValue: null, bannerCategory };
};

/**
 * Main unified hook for sticker slots
 */
export const useUnifiedStickerSlots = (options: UnifiedStickerOptions) => {
  const queryClient = useQueryClient();
  const { enableRealtime = true, activeOnly = true } = options;
  
  const filter = buildQueryFilter(options);
  const hasValidFilter = filter.entityValue || filter.bannerCategory;

  // Build unique query key
  const queryKey = [
    'unified-sticker-slots',
    filter.entityColumn,
    filter.entityValue,
    filter.bannerCategory,
    activeOnly,
  ] as const;

  const fetchSlots = async (): Promise<UnifiedStickerSlot[]> => {
    // Start with base query
    const baseQuery = supabase
      .from('stickers')
      .select('*')
      .not('slot_number', 'is', null)
      .order('slot_number', { ascending: true });

    // Build filters array
    // IMPORTANT: When an entity ID is specified, filter ONLY by that entity ID
    // banner_category is only used as fallback when no entity ID is provided
    const filters: { column: string; value: string }[] = [];
    
    if (filter.entityColumn && filter.entityValue) {
      // Filter by entity ID only - this is the primary key for stickers
      filters.push({ column: filter.entityColumn, value: filter.entityValue });
    } else if (filter.bannerCategory) {
      // No entity ID - use banner category as fallback
      filters.push({ column: 'banner_category', value: filter.bannerCategory });
    }
    
    if (activeOnly) {
      filters.push({ column: 'is_active', value: 'true' });
    }

    // Apply filters sequentially (supabase types can't handle dynamic eq)
    let query = baseQuery;
    for (const f of filters) {
      if (f.column === 'is_active') {
        query = query.eq('is_active', true);
      } else {
        query = query.eq(f.column as 'rank_id', f.value);
      }
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      logger.error('Error fetching unified sticker slots:', fetchError);
      throw fetchError;
    }

    return (data || []).map(s => ({
      id: s.id,
      slot_number: s.slot_number ?? 1,
      image_url: s.image_url,
      name: s.name,
      is_active: s.is_active ?? true,
      position_x: s.position_x ?? 50,
      position_y: s.position_y ?? 50,
      scale: s.scale ?? 1.0,
      rotation: s.rotation ?? 0,
      rank_id: s.rank_id,
      trip_id: s.trip_id,
      birthday_id: s.birthday_id,
      anniversary_id: s.anniversary_id,
      motivational_banner_id: s.motivational_banner_id,
      banner_category: s.banner_category,
      category_id: s.category_id,
    }));
  };

  const { data: slots = [], isLoading: loading, error, refetch } = useQuery<UnifiedStickerSlot[], Error>({
    queryKey,
    queryFn: fetchSlots,
    enabled: !!hasValidFilter,
    // Force fresh data for admin operations - no stale time
    staleTime: 0,
    gcTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnMount: 'always', // Always refetch when entity changes
  });

  // Real-time subscription for live updates
  useEffect(() => {
    if (!enableRealtime || !hasValidFilter) return;

    const channelName = `unified-stickers-${filter.entityColumn || 'category'}-${filter.entityValue || filter.bannerCategory}`;
    
    logger.log('Setting up unified sticker realtime:', { channelName, filter });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'stickers',
        },
        (payload) => {
          const sticker = (payload.new || payload.old) as Record<string, unknown>;
          
          // Check if this sticker matches our filters
          let matches = true;
          
          if (filter.entityColumn && filter.entityValue) {
            matches = matches && sticker[filter.entityColumn] === filter.entityValue;
          }
          if (filter.bannerCategory) {
            matches = matches && sticker.banner_category === filter.bannerCategory;
          }
          
          if (matches) {
            logger.log('Unified sticker update matched:', payload.eventType, sticker.id);
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: [...queryKey] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, hasValidFilter, filter.entityColumn, filter.entityValue, filter.bannerCategory, queryClient]);

  // Convert slots array to Record<slotNumber, stickers[]> format for preview consumption
  const slotsByNumber = slots.reduce((acc, sticker) => {
    const slot = sticker.slot_number;
    if (!acc[slot]) acc[slot] = [];
    acc[slot].push({
      id: sticker.id,
      url: sticker.image_url,
      position_x: sticker.position_x,
      position_y: sticker.position_y,
      scale: sticker.scale,
      rotation: sticker.rotation,
    });
    return acc;
  }, {} as Record<number, { id: string; url: string; position_x: number; position_y: number; scale: number; rotation: number }[]>);

  return {
    slots,
    slotsByNumber,
    loading,
    error,
    refetch,
    hasValidFilter,
  };
};

/**
 * Upload sticker to a specific slot (unified for all categories)
 * Returns queryClient invalidation keys for cache busting
 */
export const uploadUnifiedStickerSlot = async (
  file: File,
  slotNumber: number,
  options: UnifiedStickerOptions,
  queryClient?: ReturnType<typeof useQueryClient>
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `slot-${slotNumber}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `slots/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('stickers')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('stickers')
      .getPublicUrl(filePath);

    // Build insert record with correct entity reference
    const insertData: any = {
      name: `Slot ${slotNumber} Sticker`,
      image_url: publicUrl,
      slot_number: slotNumber,
      is_active: true,
      banner_category: options.bannerCategory || null,
      position_x: 50,
      position_y: 50,
      scale: 1.0,
      rotation: 0,
    };

    // Set the correct entity reference
    if (options.rankId) insertData.rank_id = options.rankId;
    if (options.tripId) insertData.trip_id = options.tripId;
    if (options.birthdayId) insertData.birthday_id = options.birthdayId;
    if (options.anniversaryId) insertData.anniversary_id = options.anniversaryId;
    if (options.motivationalBannerId) insertData.motivational_banner_id = options.motivationalBannerId;
    if (options.festivalId) insertData.festival_id = options.festivalId;
    if (options.storyId) insertData.story_id = options.storyId;

    const { error: insertError } = await supabase
      .from('stickers')
      .insert(insertData);

    if (insertError) throw insertError;

    // Invalidate cache if queryClient provided
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['unified-sticker-slots'] });
    }

    return { url: publicUrl, error: null };
  } catch (err) {
    logger.error('Error uploading unified sticker slot:', err);
    return { url: null, error: err as Error };
  }
};

/**
 * Remove sticker from slot
 */
export const removeUnifiedStickerSlot = async (
  stickerId: string,
  queryClient?: ReturnType<typeof useQueryClient>
): Promise<{ error: Error | null }> => {
  try {
    // Get the sticker to find its image URL
    const { data: sticker, error: fetchError } = await supabase
      .from('stickers')
      .select('image_url')
      .eq('id', stickerId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage if it's a slot sticker
    if (sticker?.image_url?.includes('slots/')) {
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

    // Invalidate cache if queryClient provided
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['unified-sticker-slots'] });
    }

    return { error: null };
  } catch (err) {
    logger.error('Error removing unified sticker slot:', err);
    return { error: err as Error };
  }
};

/**
 * Toggle sticker active status
 */
export const toggleUnifiedStickerActive = async (
  stickerId: string,
  isActive: boolean,
  queryClient?: ReturnType<typeof useQueryClient>
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('stickers')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', stickerId);

    if (error) throw error;

    // Invalidate cache if queryClient provided
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['unified-sticker-slots'] });
    }

    return { error: null };
  } catch (err) {
    logger.error('Error toggling unified sticker:', err);
    return { error: err as Error };
  }
};

/**
 * Update sticker transform (position, scale, rotation)
 */
export const updateUnifiedStickerTransform = async (
  stickerId: string,
  updates: {
    position_x?: number;
    position_y?: number;
    scale?: number;
    rotation?: number;
  }
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('stickers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stickerId);

    if (error) throw error;

    return { error: null };
  } catch (err) {
    logger.error('Error updating unified sticker transform:', err);
    return { error: err as Error };
  }
};

/**
 * Helper to map categoryType to entity options from bannerData
 */
export const mapBannerDataToStickerOptions = (bannerData: {
  categoryType?: string;
  rankId?: string;
  tripId?: string;
  birthdayId?: string;
  anniversaryId?: string;
  motivationalBannerId?: string;
  festivalId?: string;
  storyId?: string;
  eventId?: string;
}): UnifiedStickerOptions => {
  const categoryType = bannerData.categoryType || 'rank';
  
  // Map banner category name
  const bannerCategory = categoryType === 'rank' ? 'rank-promotion' : categoryType;
  
  return {
    rankId: bannerData.rankId,
    tripId: bannerData.tripId,
    birthdayId: bannerData.birthdayId,
    anniversaryId: bannerData.anniversaryId,
    motivationalBannerId: bannerData.motivationalBannerId,
    festivalId: bannerData.festivalId,
    storyId: bannerData.storyId || bannerData.eventId,
    bannerCategory,
  };
};
