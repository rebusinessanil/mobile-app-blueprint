-- Add positioning and transformation fields to stickers table
ALTER TABLE public.stickers
ADD COLUMN position_x numeric DEFAULT 50,
ADD COLUMN position_y numeric DEFAULT 50,
ADD COLUMN scale numeric DEFAULT 1.0,
ADD COLUMN rotation numeric DEFAULT 0;

COMMENT ON COLUMN public.stickers.position_x IS 'Horizontal position as percentage (0-100) within slot boundaries';
COMMENT ON COLUMN public.stickers.position_y IS 'Vertical position as percentage (0-100) within slot boundaries';
COMMENT ON COLUMN public.stickers.scale IS 'Scale multiplier for sticker size (0.5 to 2.0 recommended)';
COMMENT ON COLUMN public.stickers.rotation IS 'Rotation angle in degrees (0-360)';