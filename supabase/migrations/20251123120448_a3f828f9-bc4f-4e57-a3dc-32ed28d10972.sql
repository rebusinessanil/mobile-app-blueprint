-- Create trip templates using existing Bonanza Trips category
INSERT INTO templates (id, category_id, name, description, cover_thumbnail_url, is_active, display_order)
VALUES 
  ('f1e2d3c4-b5a6-7890-1234-567890abcdef'::uuid, 'db3439bc-e556-424e-b1df-75b9d95ea53a'::uuid, 'Jaisalmer', 'Desert safari achievement banner', 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/trip-jaisalmer.png', true, 1),
  ('a1b2c3d4-e5f6-7890-1234-567890abcdef'::uuid, 'db3439bc-e556-424e-b1df-75b9d95ea53a'::uuid, 'Vietnam', 'Vietnam trip achievement banner', 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/trip-vietnam.png', true, 2),
  ('b2c3d4e5-f6a7-8901-2345-67890abcdef1'::uuid, 'db3439bc-e556-424e-b1df-75b9d95ea53a'::uuid, 'Dubai', 'Dubai trip achievement banner', 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/trip-dubai.png', true, 3),
  ('c3d4e5f6-a7b8-9012-3456-7890abcdef12'::uuid, 'db3439bc-e556-424e-b1df-75b9d95ea53a'::uuid, 'Thailand', 'Thailand trip achievement banner', 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/trip-thailand.png', true, 4),
  ('d4e5f6a7-b8c9-0123-4567-890abcdef123'::uuid, 'db3439bc-e556-424e-b1df-75b9d95ea53a'::uuid, 'Singapore', 'Singapore trip achievement banner', 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/trip-singapore.png', true, 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- Initialize 16 background slots for each trip template
INSERT INTO template_backgrounds (template_id, slot_number, background_image_url, is_active)
SELECT 
  t.id,
  slot.num,
  'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-backgrounds/placeholder-background.png',
  true
FROM 
  templates t,
  generate_series(1, 16) AS slot(num)
WHERE 
  t.category_id = 'db3439bc-e556-424e-b1df-75b9d95ea53a'::uuid
  AND t.name IN ('Jaisalmer', 'Vietnam', 'Dubai', 'Thailand', 'Singapore')
ON CONFLICT (template_id, slot_number) DO NOTHING;