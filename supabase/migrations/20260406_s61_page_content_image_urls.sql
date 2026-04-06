-- S61: Add image_urls column to page_content for per-page photo replacement
ALTER TABLE page_content ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]';
