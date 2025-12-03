import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface StickerTransform {
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
}

export const useStickerTransform = (stickerId: string, rankId: string, categoryId: string, slotNumber: number) => {
  const [isSaving, setIsSaving] = useState(false);

  const updateTransform = useCallback(async (transform: Partial<StickerTransform>) => {
    if (!stickerId || !rankId || !categoryId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("stickers")
        .update(transform)
        .eq("id", stickerId)
        .eq("rank_id", rankId)
        .eq("category_id", categoryId)
        .eq("slot_number", slotNumber);

      if (error) throw error;
    } catch (error) {
      logger.error("Error updating sticker transform:", error);
      toast.error("Failed to update sticker position");
    } finally {
      setIsSaving(false);
    }
  }, [stickerId, rankId, categoryId, slotNumber]);

  return { updateTransform, isSaving };
};
