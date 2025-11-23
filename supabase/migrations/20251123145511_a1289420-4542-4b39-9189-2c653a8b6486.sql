-- Extend stickers table to support category-specific stickers for banner categories
-- Each banner category (bonanza, birthday, anniversary, meeting, festival, motivational) gets 16 customizable sticker slots

-- Add banner_category column to stickers table for category-specific stickers
ALTER TABLE public.stickers 
ADD COLUMN IF NOT EXISTS banner_category TEXT;

-- Create index for efficient category-based queries
CREATE INDEX IF NOT EXISTS idx_stickers_banner_category_slot 
ON public.stickers(banner_category, slot_number) 
WHERE banner_category IS NOT NULL;

-- Add constraint to ensure slot_number is between 1-16 for banner categories
ALTER TABLE public.stickers 
ADD CONSTRAINT check_banner_category_slot_range 
CHECK (
  banner_category IS NULL 
  OR (slot_number >= 1 AND slot_number <= 16)
);

-- Create unique constraint for banner category stickers (one sticker per category per slot)
CREATE UNIQUE INDEX IF NOT EXISTS unique_banner_category_slot 
ON public.stickers(banner_category, slot_number) 
WHERE banner_category IS NOT NULL AND is_active = true;

-- Insert default placeholder stickers for each banner category (16 slots each)
DO $$
DECLARE
  categories TEXT[] := ARRAY['bonanza', 'birthday', 'anniversary', 'meeting', 'festival', 'motivational'];
  cat TEXT;
  slot INT;
BEGIN
  FOREACH cat IN ARRAY categories
  LOOP
    FOR slot IN 1..16
    LOOP
      INSERT INTO public.stickers (
        name,
        banner_category,
        slot_number,
        image_url,
        is_active,
        display_order,
        position_x,
        position_y,
        scale,
        rotation
      )
      VALUES (
        cat || ' Sticker Slot ' || slot,
        cat,
        slot,
        'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/stickers/placeholder-' || cat || '-' || slot || '.png',
        false, -- Inactive by default until admin uploads
        slot,
        50, -- Centered horizontally
        50, -- Centered vertically
        1.0, -- Default scale
        0 -- No rotation
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Enable realtime for stickers table
ALTER PUBLICATION supabase_realtime ADD TABLE public.stickers;