import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface StoryBackgroundSlot {
  id: string;
  story_id: string;
  slot_number: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useStoryBackgroundSlots = (storyId?: string) => {
  const [slots, setSlots] = useState<StoryBackgroundSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSlots = async () => {
    if (!storyId) {
      setSlots([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("story_background_slots")
        .select("*")
        .eq("story_id", storyId)
        .eq("is_active", true)
        .order("slot_number", { ascending: true });

      if (fetchError) throw fetchError;
      setSlots(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      logger.error("Error fetching story background slots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();

    if (!storyId) return;

    const channel = supabase
      .channel(`story-slots-${storyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "story_background_slots",
          filter: `story_id=eq.${storyId}`,
        },
        () => {
          logger.log("Story background slot update received");
          fetchSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyId]);

  return { slots, loading, error, refetch: fetchSlots };
};

export const uploadStoryBackgroundSlot = async (
  storyId: string,
  slotNumber: number,
  file: File
): Promise<{ id: string | null; url: string | null; error: Error | null }> => {
  try {
    if (slotNumber < 1 || slotNumber > 16) {
      throw new Error("Slot number must be between 1 and 16");
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `story-${storyId}-slot-${slotNumber}-${Date.now()}.${fileExt}`;
    const filePath = `story-backgrounds/${fileName}`;

    // Check if slot already exists
    const { data: existingSlot } = await supabase
      .from("story_background_slots")
      .select("image_url")
      .eq("story_id", storyId)
      .eq("slot_number", slotNumber)
      .single();

    // Delete old file if exists
    if (existingSlot?.image_url) {
      const oldPath = existingSlot.image_url.split("/").pop();
      if (oldPath) {
        await supabase.storage.from("template-backgrounds").remove([`story-backgrounds/${oldPath}`]);
      }
    }

    // Upload new file
    const { error: uploadError } = await supabase.storage
      .from("template-backgrounds")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("template-backgrounds")
      .getPublicUrl(filePath);

    // Upsert slot record
    const { data, error: upsertError } = await supabase
      .from("story_background_slots")
      .upsert(
        {
          story_id: storyId,
          slot_number: slotNumber,
          image_url: urlData.publicUrl,
          is_active: true,
        },
        { onConflict: "story_id,slot_number" }
      )
      .select()
      .single();

    if (upsertError) throw upsertError;

    return { id: data.id, url: urlData.publicUrl, error: null };
  } catch (err) {
    logger.error("Error uploading story background slot:", err);
    return { id: null, url: null, error: err as Error };
  }
};

export const removeStoryBackgroundSlot = async (
  slotId: string
): Promise<{ error: Error | null }> => {
  try {
    const { error: deleteError } = await supabase
      .from("story_background_slots")
      .delete()
      .eq("id", slotId);

    if (deleteError) throw deleteError;
    return { error: null };
  } catch (err) {
    logger.error("Error removing story background slot:", err);
    return { error: err as Error };
  }
};

export const toggleStoryBackgroundSlotActive = async (
  slotId: string,
  isActive: boolean
): Promise<{ error: Error | null }> => {
  try {
    const { error: updateError } = await supabase
      .from("story_background_slots")
      .update({ is_active: isActive })
      .eq("id", slotId);

    if (updateError) throw updateError;
    return { error: null };
  } catch (err) {
    logger.error("Error toggling story background slot:", err);
    return { error: err as Error };
  }
};
