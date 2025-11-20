-- Drop the old unique constraint on (rank_id, slot_number)
ALTER TABLE stickers DROP CONSTRAINT IF EXISTS stickers_rank_id_slot_number_key;

-- Add new unique constraint on (rank_id, slot_number, category_id) for strict isolation
ALTER TABLE stickers ADD CONSTRAINT stickers_rank_slot_category_unique 
  UNIQUE (rank_id, slot_number, category_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_stickers_rank_slot_category 
  ON stickers(rank_id, slot_number, category_id) 
  WHERE is_active = true;