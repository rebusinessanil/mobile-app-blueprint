-- Fix Security Issue: Function Search Path Mutable
-- Add SET search_path to functions that are missing it

-- Update function: update_motivational_profile_defaults_updated_at
CREATE OR REPLACE FUNCTION public.update_motivational_profile_defaults_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update function: update_stories_updated_at
CREATE OR REPLACE FUNCTION public.update_stories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix Security Issue: Anonymous Access Policies on Storage
-- Restrict storage policies to authenticated users only

-- Drop existing "Anyone can view" policies and recreate with authentication requirement
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view template background images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view template covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view stickers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view template covers" ON storage.objects;

-- Recreate policies with authenticated user requirement
CREATE POLICY "Authenticated users can view profile photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can view template backgrounds"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'template-backgrounds');

CREATE POLICY "Authenticated users can view template covers"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'template-covers');

CREATE POLICY "Authenticated users can view stickers"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'stickers');

CREATE POLICY "Authenticated users can view banner defaults"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'banner_defaults');