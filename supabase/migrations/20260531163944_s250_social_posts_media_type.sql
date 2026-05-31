-- S250: video support for social posting (Zernio).
-- Additive media_type classification on social_posts. 'image' (default) preserves
-- every existing row's behavior; 'video' lets the composer + both posting paths
-- (post-to-social, publish-scheduled-posts) emit mediaItems[].type = 'video' to Zernio.
--
-- image_url stays the single URL column for BOTH media kinds (reused, NOT renamed) —
-- the existing no_blob_image_url CHECK (image_url IS NULL OR image_url ~~ 'https://%')
-- already passes for Supabase Storage video publicUrls, so it is intentionally left
-- untouched. Edge readers derive the Zernio media type from this column; null -> 'image'
-- keeps all pre-S250 rows backward-compatible.
ALTER TABLE public.social_posts
  ADD COLUMN media_type TEXT
  CHECK (media_type IS NULL OR media_type IN ('image', 'video'))
  DEFAULT 'image';

-- social_posts is read via PostgREST by the admin SPA and both edge functions —
-- reload the schema cache so reads see the new column immediately.
NOTIFY pgrst, 'reload schema';
