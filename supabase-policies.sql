-- ============================================================================
-- Supabase Storage RLS Policies for the music-tracks bucket
-- ============================================================================
-- Run this in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/_/sql/new
--
-- Required for direct browser-to-Supabase uploads to work without service-role key.
-- Currently the backend uses the service-role key for uploads (server-side),
-- so these policies are an extra safety net.
-- ============================================================================

-- 1. Make the bucket PUBLIC so publicUrl (https://.../storage/v1/object/public/music-tracks/...)
--    is accessible without auth. Do this in Dashboard → Storage → music-tracks → Settings.

-- 2. Allow public READ on the bucket
DROP POLICY IF EXISTS "Public read music tracks" ON storage.objects;
CREATE POLICY "Public read music tracks"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'music-tracks');

-- 3. Allow authenticated ADMIN users to INSERT
--    (Backend uses service role key, so this is for direct uploads from admin frontend)
DROP POLICY IF EXISTS "Authenticated users can upload music" ON storage.objects;
CREATE POLICY "Authenticated users can upload music"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'music-tracks');

-- 4. Allow authenticated ADMIN users to UPDATE
DROP POLICY IF EXISTS "Authenticated users can update music" ON storage.objects;
CREATE POLICY "Authenticated users can update music"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'music-tracks')
  WITH CHECK (bucket_id = 'music-tracks');

-- 5. Allow authenticated ADMIN users to DELETE
DROP POLICY IF EXISTS "Authenticated users can delete music" ON storage.objects;
CREATE POLICY "Authenticated users can delete music"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'music-tracks');

-- ============================================================================
-- Notes:
-- ============================================================================
-- * Our backend uses the SUPABASE_SERVICE_ROLE_KEY for uploads, so it bypasses
--   all RLS. The policies above are for direct browser uploads if you ever
--   switch to that flow.
--
-- * If you only upload via backend (current setup), you only need the bucket
--   to be PUBLIC for the read policy to work. The INSERT/UPDATE/DELETE
--   policies are optional.
--
-- * The backend currently uploads via the service-role key with this endpoint:
--     POST /api/v1/music/admin/upload
--   And the Java service does the DB insert in the same request, so the
--   track is created atomically with the file upload.
--
-- * Vercel routes for browser → backend uploads:
--     /api/admin/music/upload
--   Forwards the file as multipart/form-data to the backend, bypassing
--   Vercel's 4.5MB body limit because the upload is server-to-server.
