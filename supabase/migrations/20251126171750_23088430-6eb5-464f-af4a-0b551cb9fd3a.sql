-- Fix Function Search Path Mutable issue
-- Update link_bonanza_trip_to_category function to include search_path
CREATE OR REPLACE FUNCTION public.link_bonanza_trip_to_category()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.category_id IS NULL THEN
    NEW.category_id := 'db3439bc-e556-424e-b1df-75b9d95ea53a';
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix Anonymous Access Policies issue
-- Drop ALL existing storage policies and recreate with authentication requirement

-- Profile Photos bucket policies
DROP POLICY IF EXISTS "Authenticated users can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;

CREATE POLICY "Authenticated users can view profile photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Stickers bucket policies
DROP POLICY IF EXISTS "Admins can delete stickers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update stickers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view stickers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage stickers" ON storage.objects;

CREATE POLICY "Admins can manage stickers"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'stickers' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'stickers' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Authenticated users can view stickers"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'stickers');

-- Template Covers bucket policies
DROP POLICY IF EXISTS "Admins can delete template covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update template covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete template covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update template covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view template covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage template covers" ON storage.objects;

CREATE POLICY "Admins can manage template covers"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'template-covers' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'template-covers' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Authenticated users can view template covers"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'template-covers');

-- Template Backgrounds bucket policies
DROP POLICY IF EXISTS "Admins can delete template background images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update template background images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view template backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage template backgrounds" ON storage.objects;

CREATE POLICY "Admins can manage template backgrounds"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'template-backgrounds' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'template-backgrounds' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Authenticated users can view template backgrounds"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'template-backgrounds');

-- Banner Defaults bucket policies
DROP POLICY IF EXISTS "Authenticated users can view banner defaults" ON storage.objects;
DROP POLICY IF EXISTS "Allow users banner-settings yndkpx_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow users banner-settings yndkpx_2" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage banner defaults" ON storage.objects;

CREATE POLICY "Admins can manage banner defaults"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'banner_defaults' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'banner_defaults' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Authenticated users can view banner defaults"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'banner_defaults');