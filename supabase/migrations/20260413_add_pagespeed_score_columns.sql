-- Add rep-entered PageSpeed score columns to prospects
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS ps_desktop_old INTEGER;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS ps_mobile_old  INTEGER;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS ps_desktop_new INTEGER;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS ps_mobile_new  INTEGER;
