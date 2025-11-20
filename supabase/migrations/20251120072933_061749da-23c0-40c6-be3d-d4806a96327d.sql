-- Add unique constraint for rank stickers to ensure one sticker per slot per rank
ALTER TABLE stickers 
  DROP CONSTRAINT IF EXISTS unique_rank_slot;

ALTER TABLE stickers
  ADD CONSTRAINT unique_rank_slot UNIQUE (rank_id, slot_number);