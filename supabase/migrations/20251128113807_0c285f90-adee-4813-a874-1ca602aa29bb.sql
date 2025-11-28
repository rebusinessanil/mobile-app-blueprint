-- Add Stories category to template_categories if it doesn't exist
INSERT INTO template_categories (
  id,
  name,
  slug,
  icon,
  icon_name,
  description,
  is_active,
  display_order
)
VALUES (
  'e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b',
  'Stories',
  'stories',
  '📖',
  'BookOpen',
  'Manage story backgrounds and templates',
  true,
  6
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;