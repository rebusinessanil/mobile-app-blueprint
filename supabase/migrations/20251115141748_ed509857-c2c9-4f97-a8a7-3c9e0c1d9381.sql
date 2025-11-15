-- Fix storage RLS policies for template-covers bucket uploads
-- Allow authenticated users to upload category and template cover images

-- Drop existing policies if any (to recreate them properly)
DROP POLICY IF EXISTS "Authenticated users can upload template covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view template covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update template covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete template covers" ON storage.objects;

-- Allow anyone to view/download template covers (public bucket)
CREATE POLICY "Anyone can view template covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'template-covers');

-- Allow authenticated users to upload template covers
CREATE POLICY "Authenticated users can upload template covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'template-covers' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update template covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'template-covers'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete template covers
CREATE POLICY "Authenticated users can delete template covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'template-covers'
  AND auth.role() = 'authenticated'
);