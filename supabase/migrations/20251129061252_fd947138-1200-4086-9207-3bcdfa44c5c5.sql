-- Drop ALL existing storage.objects policies to start fresh
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- Public buckets: Anyone can view template-covers, template-backgrounds, banner_defaults, stickers
CREATE POLICY "Public template assets viewable by all"
ON storage.objects
FOR SELECT
USING (
  bucket_id IN ('template-covers', 'template-backgrounds', 'banner_defaults', 'stickers')
);

-- Profile photos: Only authenticated users can view
CREATE POLICY "Auth users view profile photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos');

-- Users can upload their own profile photos
CREATE POLICY "Users upload own profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own profile photos
CREATE POLICY "Users update own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own profile photos
CREATE POLICY "Users delete own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can manage all template-related assets
CREATE POLICY "Admins manage all storage assets"
ON storage.objects
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));