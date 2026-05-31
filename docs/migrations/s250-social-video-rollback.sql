-- S250 ROLLBACK — social_posts.media_type column.
-- Additive, backward-compatible column; dropping it reverts to image-only behavior.
-- NOTE: the edge functions derive Zernio mediaItems[].type from media_type with a
-- null/absent -> 'image' fallback, so after this drop any in-flight video rows would
-- post as images (or fail at the platform if a video URL is sent to an image type).
-- Pair this rollback with redeploying the pre-S250 edge functions if video rows exist.
ALTER TABLE public.social_posts DROP COLUMN media_type;

NOTIFY pgrst, 'reload schema';
