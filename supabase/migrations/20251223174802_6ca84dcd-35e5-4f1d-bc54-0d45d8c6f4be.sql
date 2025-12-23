-- Add category-specific ID columns for stickers
ALTER TABLE stickers ADD COLUMN IF NOT EXISTS trip_id uuid;
ALTER TABLE stickers ADD COLUMN IF NOT EXISTS birthday_id uuid;
ALTER TABLE stickers ADD COLUMN IF NOT EXISTS anniversary_id uuid;
ALTER TABLE stickers ADD COLUMN IF NOT EXISTS motivational_banner_id uuid;

-- Drop the foreign key constraint on rank_id to allow flexible ID storage
ALTER TABLE stickers DROP CONSTRAINT IF EXISTS stickers_rank_id_fkey;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stickers_trip_id ON stickers(trip_id);
CREATE INDEX IF NOT EXISTS idx_stickers_birthday_id ON stickers(birthday_id);
CREATE INDEX IF NOT EXISTS idx_stickers_anniversary_id ON stickers(anniversary_id);
CREATE INDEX IF NOT EXISTS idx_stickers_motivational_banner_id ON stickers(motivational_banner_id);