-- Add hero_headline column to page_content table
-- Allows per-page hero headline storage, separate from SEO title
ALTER TABLE page_content ADD COLUMN IF NOT EXISTS hero_headline TEXT;
