-- Insert only missing template categories
INSERT INTO template_categories (name, slug, description, icon, is_active, display_order)
VALUES
  ('Team Meeting', 'team-meeting', 'Promote team meetings and events', '📅', true, 40),
  ('Festival Greetings', 'festival-greetings', 'Festival greetings and celebration banners', '🎉', true, 50),
  ('Motivational Quotes', 'motivational-quotes', 'Inspirational quotes and motivational messages', '💪', true, 60)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- Update existing categories if needed
UPDATE template_categories 
SET icon = '✈️', description = 'Create trip achievement banners for bonanza winners'
WHERE slug = 'bonanza-trips';

UPDATE template_categories 
SET icon = '🎂', description = 'Celebrate birthdays with personalized banners'
WHERE slug = 'birthday';

UPDATE template_categories 
SET icon = '💞', description = 'Commemorate special anniversaries'
WHERE slug = 'anniversary';

-- Create templates and 16 background slots for all 6 categories
DO $$
DECLARE
  cat_record RECORD;
  template_id_var uuid;
  slot_num integer;
  category_data RECORD;
BEGIN
  -- Define category mappings
  FOR category_data IN 
    SELECT 'bonanza-trips' as slug, 'Bonanza Trip Achievement' as template_name UNION ALL
    SELECT 'birthday', 'Birthday Celebration' UNION ALL
    SELECT 'anniversary', 'Anniversary Banner' UNION ALL
    SELECT 'team-meeting', 'Team Meeting' UNION ALL
    SELECT 'festival-greetings', 'Festival Greetings' UNION ALL
    SELECT 'motivational-quotes', 'Motivational Quote'
  LOOP
    -- Get category ID
    SELECT id INTO cat_record FROM template_categories WHERE slug = category_data.slug;
    
    IF cat_record.id IS NOT NULL THEN
      -- Insert template if it doesn't exist
      IF NOT EXISTS (SELECT 1 FROM templates WHERE category_id = cat_record.id) THEN
        INSERT INTO templates (category_id, name, description, cover_thumbnail_url, is_active, display_order)
        VALUES (
          cat_record.id,
          category_data.template_name,
          'Banner template for ' || category_data.slug,
          'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/' || category_data.slug || '-default.png',
          true,
          1
        );
      END IF;
      
      -- Get template ID
      SELECT id INTO template_id_var FROM templates WHERE category_id = cat_record.id LIMIT 1;
      
      IF template_id_var IS NOT NULL THEN
        -- Create 16 background slots (slot_number 1 to 16)
        FOR slot_num IN 1..16 LOOP
          INSERT INTO template_backgrounds (template_id, slot_number, background_image_url, is_active)
          VALUES (
            template_id_var,
            slot_num,
            'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-backgrounds/' || category_data.slug || '-bg-' || slot_num || '.png',
            true
          )
          ON CONFLICT (template_id, slot_number) DO UPDATE SET
            background_image_url = EXCLUDED.background_image_url,
            is_active = EXCLUDED.is_active;
        END LOOP;
        
        RAISE NOTICE 'Created template and 16 slots for category: %', category_data.slug;
      END IF;
    END IF;
  END LOOP;
END $$;