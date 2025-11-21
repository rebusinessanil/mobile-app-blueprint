-- Add unique constraint for sticker isolation by (category_id, rank_id, slot_number)
-- This ensures only one sticker per category/rank/slot combination

-- First, check if constraint exists and drop if needed
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'stickers_category_rank_slot_unique'
    ) THEN
        ALTER TABLE stickers DROP CONSTRAINT stickers_category_rank_slot_unique;
    END IF;
END $$;

-- Add the unique constraint
ALTER TABLE stickers 
ADD CONSTRAINT stickers_category_rank_slot_unique 
UNIQUE (category_id, rank_id, slot_number);

-- Add helpful comment
COMMENT ON CONSTRAINT stickers_category_rank_slot_unique ON stickers IS 
'Ensures strict isolation: only one sticker per (category, rank, slot) combination. This prevents sticker bleed across categories, ranks, or slots.';