UPDATE storage.buckets
SET
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'marketplace-photos';

CREATE POLICY "Visitors can upload small marketplace photos"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'marketplace-photos'
  AND (storage.foldername(name))[1] = 'public'
);

CREATE POLICY "Visitors can view marketplace photos"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'marketplace-photos'
  AND (storage.foldername(name))[1] = 'public'
);