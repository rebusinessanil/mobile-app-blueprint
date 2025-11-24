-- Add icon_name and color_class fields to template_categories table for frontend customization
ALTER TABLE template_categories
ADD COLUMN IF NOT EXISTS icon_name TEXT,
ADD COLUMN IF NOT EXISTS color_class TEXT DEFAULT 'bg-primary',
ADD COLUMN IF NOT EXISTS route_path TEXT;

-- Update existing categories with proper icons and colors matching frontend
UPDATE template_categories SET 
  icon_name = 'Trophy',
  color_class = 'bg-yellow-600',
  route_path = '/rank-selection'
WHERE slug = 'rank-promotion';

UPDATE template_categories SET 
  icon_name = 'Gift',
  color_class = 'bg-red-600',
  route_path = '/banner-create/bonanza'
WHERE slug = 'bonanza-promotion';

UPDATE template_categories SET 
  icon_name = 'Calendar',
  color_class = 'bg-teal-600',
  route_path = '/banner-create/birthday'
WHERE slug = 'birthday';

UPDATE template_categories SET 
  icon_name = 'Star',
  color_class = 'bg-blue-600',
  route_path = '/banner-create/anniversary'
WHERE slug = 'anniversary';

UPDATE template_categories SET 
  icon_name = 'Users',
  color_class = 'bg-yellow-600',
  route_path = '/banner-create/meeting'
WHERE slug = 'meeting';

UPDATE template_categories SET 
  icon_name = 'Calendar',
  color_class = 'bg-purple-600',
  route_path = '/banner-create/festival'
WHERE slug = 'festival';

UPDATE template_categories SET 
  icon_name = 'Zap',
  color_class = 'bg-yellow-600',
  route_path = '/banner-create/motivational'
WHERE slug = 'motivational';

-- Insert missing categories that exist in frontend but not in backend
INSERT INTO template_categories (name, slug, icon_name, color_class, route_path, is_active, display_order)
VALUES 
  ('Thank You Message', 'thank-you-message', 'MessageCircle', 'bg-green-600', '/category/thank-you-message', true, 5),
  ('Weekly Achievement', 'weekly-achievement', 'Target', 'bg-teal-600', '/category/weekly-achievement', true, 8),
  ('Special Campaign', 'special-campaign', 'Briefcase', 'bg-yellow-700', '/category/special-campaign', true, 9),
  ('Achievements', 'achievements', 'Medal', 'bg-purple-600', '/category/achievements', true, 10),
  ('Custom Banner', 'custom-banner', 'Image', 'bg-blue-700', '/category/custom-banner', true, 11),
  ('New Joiner Banner', 'new-joiner-banner', 'Users', 'bg-teal-700', '/category/new-joiner-banner', true, 13),
  ('Income Banner', 'income-banner', 'IndianRupee', 'bg-green-700', '/category/income-banner', true, 14),
  ('Capping Banner', 'capping-banner', 'BarChart3', 'bg-red-700', '/category/capping-banner', true, 15)
ON CONFLICT (slug) DO UPDATE SET
  icon_name = EXCLUDED.icon_name,
  color_class = EXCLUDED.color_class,
  route_path = EXCLUDED.route_path;