-- Fix anonymous access policies on storage.objects
-- Explicitly exclude anonymous users by checking auth.uid() IS NOT NULL

-- Drop existing policies
DROP POLICY IF EXISTS "Auth users view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users manage own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users view templates" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage templates" ON storage.objects;

-- Profile photos: Only authenticated users can view
CREATE POLICY "Auth users view profile photos" 
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND auth.uid() IS NOT NULL
);

-- Users manage their own profile photos
CREATE POLICY "Users manage own profile photos" 
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Template assets: Authenticated users can view
CREATE POLICY "Auth users view templates" 
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('template-covers', 'template-backgrounds', 'stickers', 'banner_defaults')
  AND auth.uid() IS NOT NULL
);

-- Admins manage all template assets
CREATE POLICY "Admins manage templates" 
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id IN ('template-covers', 'template-backgrounds', 'stickers', 'banner_defaults')
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id IN ('template-covers', 'template-backgrounds', 'stickers', 'banner_defaults')
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);