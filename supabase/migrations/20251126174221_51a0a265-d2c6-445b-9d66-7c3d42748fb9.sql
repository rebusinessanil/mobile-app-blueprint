-- Fix anonymous access policies on storage.objects
-- Drop all existing storage policies and recreate with proper authentication

-- Drop all existing policies on storage.objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view template assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage template assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage banner defaults" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage stickers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage template backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage template covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view banner defaults" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view stickers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view template backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view template covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;

-- Profile photos: Only authenticated users can view
CREATE POLICY "Auth users view profile photos" 
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-photos' 
  AND auth.role() = 'authenticated'
);

-- Users manage their own profile photos
CREATE POLICY "Users manage own profile photos" 
ON storage.objects FOR ALL
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Template assets: Authenticated users can view
CREATE POLICY "Auth users view templates" 
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('template-covers', 'template-backgrounds', 'stickers', 'banner_defaults')
  AND auth.role() = 'authenticated'
);

-- Admins manage all template assets
CREATE POLICY "Admins manage templates" 
ON storage.objects FOR ALL
USING (
  bucket_id IN ('template-covers', 'template-backgrounds', 'stickers', 'banner_defaults')
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id IN ('template-covers', 'template-backgrounds', 'stickers', 'banner_defaults')
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);