-- Insert trip templates using existing Bonanza Trips category
INSERT INTO templates (id, name, category_id, cover_thumbnail_url, description, display_order, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440010'::uuid, 'Jaisalmer Trip', 'db3439bc-e556-424e-b1df-75b9d95ea53a'::uuid, 'https://images.unsplash.com/photo-1609920658906-8223652d5d2e?w=400', 'Golden desert adventure', 1, true),
  ('550e8400-e29b-41d4-a716-446655440011'::uuid, 'Vietnam Trip', 'db3439bc-e556-424e-b1df-75b9d95ea53a'::uuid, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400', 'Vietnamese paradise', 2, true),
  ('550e8400-e29b-41d4-a716-446655440012'::uuid, 'Dubai Trip', 'db3439bc-e556-424e-b1df-75b9d95ea53a'::uuid, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400', 'Luxury Dubai experience', 3, true),
  ('550e8400-e29b-41d4-a716-446655440013'::uuid, 'Thailand Trip', 'db3439bc-e556-424e-b1df-75b9d95ea53a'::uuid, 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400', 'Thai tropical getaway', 4, true),
  ('550e8400-e29b-41d4-a716-446655440014'::uuid, 'Singapore Trip', 'db3439bc-e556-424e-b1df-75b9d95ea53a'::uuid, 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400', 'Modern Singapore adventure', 5, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  cover_thumbnail_url = EXCLUDED.cover_thumbnail_url,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;