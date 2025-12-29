-- Enable REPLICA IDENTITY FULL for all admin-managed tables to ensure complete row data in realtime events
-- This ensures admin changes propagate instantly to all user apps

-- Template & Content tables
ALTER TABLE templates REPLICA IDENTITY FULL;
ALTER TABLE template_categories REPLICA IDENTITY FULL;
ALTER TABLE template_backgrounds REPLICA IDENTITY FULL;

-- Sticker tables
ALTER TABLE stickers REPLICA IDENTITY FULL;
ALTER TABLE sticker_categories REPLICA IDENTITY FULL;

-- Stories tables
ALTER TABLE stories REPLICA IDENTITY FULL;
ALTER TABLE stories_events REPLICA IDENTITY FULL;
ALTER TABLE stories_festivals REPLICA IDENTITY FULL;
ALTER TABLE stories_generated REPLICA IDENTITY FULL;
ALTER TABLE stories_settings REPLICA IDENTITY FULL;
ALTER TABLE story_background_slots REPLICA IDENTITY FULL;

-- Ranks & Categories
ALTER TABLE ranks REPLICA IDENTITY FULL;
ALTER TABLE bonanza_trips REPLICA IDENTITY FULL;
ALTER TABLE "Birthday" REPLICA IDENTITY FULL;
ALTER TABLE "Anniversary" REPLICA IDENTITY FULL;
ALTER TABLE "Motivational Banner" REPLICA IDENTITY FULL;

-- Banner settings
ALTER TABLE banner_defaults REPLICA IDENTITY FULL;
ALTER TABLE banner_carousel_images REPLICA IDENTITY FULL;
ALTER TABLE user_banner_settings REPLICA IDENTITY FULL;

-- User data (for admin credit updates)
ALTER TABLE user_credits REPLICA IDENTITY FULL;
ALTER TABLE credit_transactions REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;