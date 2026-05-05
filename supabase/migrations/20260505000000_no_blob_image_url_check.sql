-- Backfill: Bug B `no_blob_image_url` CHECK constraint
--
-- The constraint was applied to production via Supabase MCP in S188 without
-- committing the migration file to the repo. S191 doc drift audit confirmed
-- the constraint exists in the database with this exact definition. This file
-- restores repo provenance.
--
-- Idempotent: the DO block guards against re-adding the constraint if a
-- fresh DB is built from migrations and this file is replayed.
--
-- Original change:    S188 (May 2-3, 2026)
-- File backfilled in: S192 (May 5, 2026)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'no_blob_image_url'
      AND conrelid = 'public.social_posts'::regclass
  ) THEN
    ALTER TABLE public.social_posts
      ADD CONSTRAINT no_blob_image_url
      CHECK (image_url IS NULL OR image_url ~~ 'https://%');
  END IF;
END $$;
