-- Add congratulations_image field to banner_defaults table
ALTER TABLE banner_defaults
ADD COLUMN congratulations_image text;

COMMENT ON COLUMN banner_defaults.congratulations_image IS 'Default congratulations image URL that appears on all user banners, only configurable by admins';