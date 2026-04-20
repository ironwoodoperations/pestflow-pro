# Migration s159.3.3-t7 — Drop year_founded stale key + CHECK constraint

Executed: 2026-04-20
Tenant affected: pestflow-pro (demo) — `9215b06b-3eb5-49a1-a16e-7ff214bf6783`

## Context

Original gate plan assumed 1 tenant had `year_founded` WITHOUT `founded_year` (value to copy).
Pre-flight revealed the demo tenant had BOTH keys — `founded_year: "2010"` (canonical, populated)
and `year_founded: ""` (stale empty string, no value to preserve). Simplified scope: DROP only.

## Before

```json
{
  "founded_year": "2010",
  "year_founded": ""
}
```

Removed key: `year_founded` = `""` (empty string — no value lost)
Preserved: `founded_year` = `"2010"`

## After

Returned from UPDATE RETURNING (relevant keys):
```json
{
  "founded_year": "2010"
}
```

`year_founded` key absent. All other business_info fields intact (name, email, phone, address,
hours, license, tagline, industry, after_hours_phone).

## Forward-protection

CHECK constraint added: `business_info_no_year_founded`

```sql
CHECK (
  key != 'business_info'
  OR value IS NULL
  OR jsonb_typeof(value) != 'object'
  OR NOT (value ? 'year_founded')
)
```

Prevents any future INSERT/UPDATE that sets `business_info.year_founded` on any row
in the `settings` table.

Supabase migration file: `supabase/migrations/*_business_info_no_year_founded_constraint.sql`

## Verification

- Row count affected: 1 ✓
- `year_founded` removed: ✓ (`still_has_year_founded = false`)
- `founded_year` present with preserved value "2010": ✓
- CHECK constraint active on settings table: ✓

## Rollback (emergency only — requires dropping constraint first)

```sql
ALTER TABLE settings DROP CONSTRAINT business_info_no_year_founded;
UPDATE settings
SET value = value || jsonb_build_object('year_founded', '')
WHERE tenant_id = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
  AND key = 'business_info';
```
