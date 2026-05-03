-- S188 Rollback Script
-- Restores PFP (demo tenant) integrations row to pre-S188 state.
--
-- IMPORTANT: The orphan-row deletion (blog_posts + settings for 10 defunct
-- tenant_ids) has NO clean rollback. If you need to recover those rows,
-- restore from Supabase PITR backup to a point before the S188.7 migration
-- was applied.
--
-- The ON DELETE CASCADE FK additions are also difficult to reverse cleanly;
-- if needed, drop the constraints:
--   ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_tenant_id_fkey;
--   ALTER TABLE settings   DROP CONSTRAINT IF EXISTS settings_tenant_id_fkey;
-- (these are the names applied_migration gave them — verify with \d blog_posts)

-- ── 1. Restore PFP integrations row ───────────────────────────────────────────
-- Restores the value column to its exact pre-S188 contents.
UPDATE settings
SET value = '{
  "google_api_key": "",
  "pexels_api_key": "",
  "google_place_id": "",
  "zernio_accounts": {},
  "facebook_page_id": "admin@pestflowpro.com",
  "owner_sms_number": "9035419287",
  "textbelt_api_key": "",
  "zernio_profile_id": "69dd1cea82e215ed45d4de75",
  "google_analytics_id": "",
  "instagram_account_id": "",
  "bundle_social_team_id": "bdbe4976-6563-431d-affd-232eba8b143a",
  "facebook_access_token": "pf123demo",
  "google_maps_embed_url": "",
  "active_social_provider": "bundle_social",
  "bundle_social_account_id": "9763e949-32c1-4d1d-a6e2-2cde2f45363e",
  "google_search_console_url": "pestflowpro.com"
}'::jsonb
WHERE tenant_id = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
  AND key = 'integrations';

-- ── 2. Orphan rows ─────────────────────────────────────────────────────────────
-- No rollback possible without PITR.
-- 24 blog_posts rows and 24 settings rows (2 tenant_ids × 12 keys) were
-- hard-deleted. Tenant IDs affected:
--   blog_posts:  8 tenant_ids, 3 posts each
--   settings:    a315b307-c149-4850-997d-04ad80dea303 (12 rows)
--                2c234f36-7d4a-40c7-9f7a-f241256f29a6 (12 rows)

-- ── 3. Re-add VITE_TENANT_ID to Vercel ────────────────────────────────────────
-- Run via Vercel CLI or dashboard if needed:
--   vercel env add VITE_TENANT_ID production
--   vercel env add VITE_TENANT_ID preview
--   vercel env add VITE_TENANT_ID development
-- Value: 9215b06b-3eb5-49a1-a16e-7ff214bf6783
