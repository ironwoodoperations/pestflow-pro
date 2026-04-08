-- S84: Add hero_headline column to prospects for site recreation
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS hero_headline TEXT;
