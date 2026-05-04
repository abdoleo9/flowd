-- 004_landing_page_enhancements.sql
-- Stores form fields used to generate a page so they can be pre-filled on edit/regenerate

ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS generation_config JSONB;

-- Create public Storage bucket for product images (CDN instead of base64 in HTML)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-page-images',
  'landing-page-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload images
CREATE POLICY IF NOT EXISTS "lp_images_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'landing-page-images');

-- Public read access
CREATE POLICY IF NOT EXISTS "lp_images_select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'landing-page-images');

-- Authenticated users can delete their own images
CREATE POLICY IF NOT EXISTS "lp_images_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'landing-page-images');
