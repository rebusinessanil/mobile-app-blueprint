import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface StickerSlot {
  id: string;
  rank_id: string | null;
  category_id: string | null;
  banner_category: string | null;
  slot_number: number;
  image_url: string;
  name: string;
  is_active: boolean;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
  trip_id?: string | null;
  birthday_id?: string | null;
  anniversary_id?: string | null;
  motivational_banner_id?: string | null;
}

interface UseStickerSlotsOptions {
  rankId?: string;
  bannerCategory?: string;
  tripId?: string;
  birthdayId?: string;
  anniversaryId?: string;
  motivationalBannerId?: string;
}

export const useStickerSlots = (options: UseStickerSlotsOptions) => {
  const queryClient = useQueryClient();
  const { rankId, bannerCategory, tripId, birthdayId, anniversaryId, motivationalBannerId } = options;

  const queryKey = ['sticker-slots', rankId, bannerCategory, tripId, birthdayId, anniversaryId, motivationalBannerId];

  const { data: slots = [], isLoading: loading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('stickers')
        .select('*')
        .not('slot_number', 'is', null)
        .order('slot_number', { ascending: true });

      // Apply filters consistently across all categories (same rules as rank-promotion)
      // Priority: specific entity ID > banner category
      if (rankId) {
        query = query.eq('rank_id', rankId);
      } else if (tripId) {
        query = query.eq('trip_id', tripId);
      } else if (birthdayId) {
        query = query.eq('birthday_id', birthdayId);
      } else if (anniversaryId) {
        query = query.eq('anniversary_id', anniversaryId);
      } else if (motivationalBannerId) {
        query = query.eq('motivational_banner_id', motivationalBannerId);
      }

      // Always filter by banner_category when provided for consistent categorization
      if (bannerCategory) {
        query = query.eq('banner_category', bannerCategory);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return (data || []).map(s => ({
        id: s.id,
        rank_id: s.rank_id,
        category_id: s.category_id,
        banner_category: s.banner_category,
        slot_number: s.slot_number ?? 1,
        image_url: s.image_url,
        name: s.name,
        is_active: s.is_active ?? true,
        position_x: s.position_x ?? 50,
        position_y: s.position_y ?? 50,
        scale: s.scale ?? 1.0,
        rotation: s.rotation ?? 0,
        trip_id: s.trip_id,
        birthday_id: s.birthday_id,
        anniversary_id: s.anniversary_id,
        motivational_banner_id: s.motivational_banner_id,
      })) as StickerSlot[];
    },
    enabled: !!(rankId || bannerCategory || tripId || birthdayId || anniversaryId || motivationalBannerId),
  });

  return { slots, loading, error, refetch };
};

// Upload sticker to a specific slot
export const uploadStickerSlot = async (
  file: File,
  slotNumber: number,
  options: {
    rankId?: string;
    bannerCategory?: string;
    tripId?: string;
    birthdayId?: string;
    anniversaryId?: string;
    motivationalBannerId?: string;
  }
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

    // Create sticker record with slot
    const { error: insertError } = await supabase
      .from('stickers')
      .insert({
        name: `Slot ${slotNumber} Sticker`,
        image_url: publicUrl,
        slot_number: slotNumber,
        is_active: true,
        rank_id: options.rankId || null,
        banner_category: options.bannerCategory || null,
        trip_id: options.tripId || null,
        birthday_id: options.birthdayId || null,
        anniversary_id: options.anniversaryId || null,
        motivational_banner_id: options.motivationalBannerId || null,
        position_x: 50,
        position_y: 50,
        scale: 1.0,
        rotation: 0,
      });

    if (insertError) throw insertError;

    return { url: publicUrl, error: null };
  } catch (err) {
    logger.error('Error uploading sticker slot:', err);
    return { url: null, error: err as Error };
  }
};

// Remove sticker from slot
export const removeStickerSlot = async (stickerId: string): Promise<{ error: Error | null }> => {
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

    return { error: null };
  } catch (err) {
    logger.error('Error removing sticker slot:', err);
    return { error: err as Error };
  }
};

// Toggle sticker active status
export const toggleStickerSlotActive = async (
  stickerId: string,
  isActive: boolean
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('stickers')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', stickerId);

    if (error) throw error;

    return { error: null };
  } catch (err) {
    logger.error('Error toggling sticker slot:', err);
    return { error: err as Error };
  }
};

// Update sticker transform
export const updateStickerTransform = async (
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
    logger.error('Error updating sticker transform:', err);
    return { error: err as Error };
  }
};
