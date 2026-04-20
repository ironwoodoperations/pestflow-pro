# Migration s159.3.3-t6 — Drop hero_media.type

Executed: 2026-04-20
Tenant affected: pestflow-pro (demo) — `9215b06b-3eb5-49a1-a16e-7ff214bf6783`

## Before

Full hero_media (from preflight SELECT):
```json
{
  "url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b-3eb5-49a1-a16e-7ff214bf6783/hero.jpg?v=1776370065",
  "mode": "image",
  "type": "image",
  "image_url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b-3eb5-49a1-a16e-7ff214bf6783/hero.jpg?v=1776370065",
  "video_url": "",
  "youtube_id": "",
  "thumbnail_url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b-3eb5-49a1-a16e-7ff214bf6783/hero.jpg?v=1776370065",
  "master_hero_image_url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b-3eb5-49a1-a16e-7ff214bf6783/hero.jpg?v=1776370065"
}
```

Removed key: `type` = `"image"`

## After

Full hero_media (from UPDATE RETURNING):
```json
{
  "url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b-3eb5-49a1-a16e-7ff214bf6783/hero.jpg?v=1776370065",
  "mode": "image",
  "image_url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b-3eb5-49a1-a16e-7ff214bf6783/hero.jpg?v=1776370065",
  "video_url": "",
  "youtube_id": "",
  "thumbnail_url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b-3eb5-49a1-a16e-7ff214bf6783/hero.jpg?v=1776370065",
  "master_hero_image_url": "https://biezzykcgzkrwdgqpsar.supabase.co/storage/v1/object/public/tenant-assets/9215b06b-3eb5-49a1-a16e-7ff214bf6783/hero.jpg?v=1776370065"
}
```

## Verification

- Row count affected: 1 ✓
- `type` key removed: ✓ (`still_has_type = false`)
- Canonical 7-key shape preserved: ✓ (mode, url, image_url, master_hero_image_url, thumbnail_url, video_url, youtube_id all present)
- Dead code branch removed: `src/components/admin/settings/BrandingHeroMedia.tsx` lines 45-48 (`else if (v?.type)` block)
- TypeScript: CLEAN ✓
- CLAUDE.md updated: `hero_media` key added to settings table with full 7-key shape documentation

## Rollback

If needed (restores `type` key to its prior value):
```sql
UPDATE settings
SET value = value || jsonb_build_object('type', 'image')
WHERE tenant_id = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
  AND key = 'hero_media';
```
