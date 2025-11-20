-- Add rank_id and slot_number to stickers table for scoped sticker management
ALTER TABLE stickers
ADD COLUMN rank_id text REFERENCES ranks(id) ON DELETE CASCADE,
ADD COLUMN slot_number integer CHECK (slot_number >= 1 AND slot_number <= 16);

-- Create unique constraint to ensure one sticker per (category, rank, slot) combination
CREATE UNIQUE INDEX idx_stickers_category_rank_slot 
ON stickers(category_id, rank_id, slot_number) 
WHERE category_id IS NOT NULL AND rank_id IS NOT NULL AND slot_number IS NOT NULL;

-- Add index for faster queries
CREATE INDEX idx_stickers_rank_slot ON stickers(rank_id, slot_number);

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Anyone can view active stickers" ON stickers;
CREATE POLICY "Anyone can view active stickers" ON stickers
  FOR SELECT
  USING ((is_active = true) OR is_admin(auth.uid()));