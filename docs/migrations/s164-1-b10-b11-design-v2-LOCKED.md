# S164.1 — b10/b11 Service-Area Pipeline Design (v2 LOCKED)

**Status:** Gate-validated. Decisions locked. Ready for Part 0 + source read + hunt.
**Supersedes:** v1 draft at `docs/migrations/s164-1-b10-b11-design.md`
**Session:** S164
**Date:** 2026-04-21
**Validators:** Perplexity + Gemini (transcripts pasted into chat 2026-04-21)

---

## 1. Decision summary

**Architecture:** Option A — `service_areas` table is canonical; `settings.seo.service_areas` JSONB is a derived, read-only projection refreshed on every write. Application-side sync from `provision-tenant` and the admin save handler. No triggers. No cross-table generated columns (don't exist in Postgres).

**Hardening added to scope:** Part 0 — CHECK constraint on JSONB shape + two forward-compat nullable columns (`place_id`, `state`) on `service_areas`.

**Backfill scope:** Demo JSONB rewritten from table. CityShield already aligned, skipped. **Dang deferred until post-DNS cutover** — JSONB feeds LocalBusiness JSON-LD which the Vite shell renders; freeze rule applies.

---

## 2. Where the gate changed the plan

### 2.1 Dropped from v1
- **Trigger-based sync** — ruled out by standing rule, reconfirmed by both gates.
- **Dang JSONB backfill in this session** — Gemini flagged correctly: JSON-LD is part of the rendered page source; rewriting it under freeze rules violates the "don't change Dang's render path" intent. Perplexity thought it was safe but only conditional on explicit communication to Kirk; not worth the risk vs. the 1-minute post-DNS backfill.

### 2.2 Added from gate
- **Part 0 — CHECK constraint before parser rewrite** (Gemini). Forces any wrong-shape output from the new code to fail loudly during dev testing rather than ship as silent drift v2.
- **`place_id` + `state` nullable columns on `service_areas`** (Gemini). Breaks the v1 "zero DDL" claim but makes the future Option C upgrade a data-only hydration instead of a schema migration. Net positive.
- **Four normalizer categories beyond v1's 6** (Gemini). Zip stripping, directional expansion, county detection, scoped St.-abbreviation whitelist. Covered in §5 below.
- **Drift-detection gate query** (Gemini) as final verification before marking S164 complete.

### 2.3 Kept from v1 unchanged
- Option A over B over C.
- Application-side sync.
- Flat string JSONB projection in v1 (typed-city objects deferred to v2 projection swap).
- Shell b9 empty-state replacement ships in the same session.

---

## 3. Part 0 — Schema hardening (ships first)

Runs before any parser rewrite. All current production data satisfies the new CHECK — audit confirms all three tenants hold arrays of non-empty strings ≤100 chars. Non-destructive; no rollback risk on the hardening itself.

```sql
-- Part 0a: forward-compat columns for future Option C upgrade
ALTER TABLE public.service_areas
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS state text;

-- Part 0b: shape CHECK on settings.seo.service_areas
ALTER TABLE public.settings
  ADD CONSTRAINT seo_service_areas_shape
  CHECK (
    key <> 'seo'
    OR value IS NULL
    OR jsonb_typeof(value) <> 'object'
    OR NOT (value ? 'service_areas')
    OR (
      jsonb_typeof(value->'service_areas') = 'array'
      AND jsonb_array_length(value->'service_areas') <= 100
    )
  );

-- Part 0c: NOTIFY PostgREST to reload schema so new columns are visible immediately
NOTIFY pgrst, 'reload schema';
```

Rollback staged in `docs/migrations/s164-3-b10-b11-rollback.sql` in the same commit.

---

## 4. Application-side sync — the pattern

Shared helper (location TBD from source read, likely `supabase/functions/_shared/service-areas.ts`):

```typescript
// Pseudocode — exact signatures after source read
async function writeServiceAreas(
  supabase: SupabaseClient,
  tenantId: string,
  rawInput: string | string[]
): Promise<{ rows: ServiceAreaRow[]; jsonbProjection: string[] }> {
  // 1. Parse raw input → token list (handles array or comma-split string)
  // 2. Normalize each token → { city, state, slug, isCounty, placeId? }
  // 3. Upsert into service_areas ON CONFLICT (tenant_id, slug) DO UPDATE
  // 4. SELECT city FROM service_areas WHERE tenant_id = $1 AND is_live ORDER BY city
  //    → jsonbProjection
  // 5. UPDATE settings SET value = jsonb_set(value, '{service_areas}', to_jsonb($projection))
  //    WHERE tenant_id = $1 AND key = 'seo'
  // 6. Return both for caller logging/response
}
```

Both `provision-tenant/index.ts` and the admin Service Areas save handler call this helper. JSONB is never written directly except via projection from the table.

---

## 5. Normalizer rule set v1 (Texas market)

From the gate-merged list. Order matters — apply in this sequence.

1. **Trim** — strip leading/trailing whitespace; collapse internal runs of whitespace to single space.
2. **Strip trailing zip code** — regex `/\s+\d{5}(-\d{4})?$/` (handles `"Dallas 75201"` and `"Dallas 75201-1234"`).
3. **Strip trailing state codes** — `/\s*,?\s*(TX|tx|Tx|tX|Texas|TEXAS)\s*$/` (handles `"Dallas, TX"`, `"Dallas TX"`, `"Dallas Texas"`).
4. **Detect county flag** — if matches `/\bcounty\b/i`, set `isCounty=true`; slug becomes `{city-kebab}-county-tx`; otherwise slug is `{city-kebab}-tx`.
5. **Abbreviation expansion:**
   - `^Ft\.?\s+` → `Fort ` (unconditional — no false-positive risk in TX market)
   - `^St\.?\s+` → `Saint ` **only** if matches whitelist (`St. Paul`, `St. Jo`, `St. Hedwig` — Texas-only Saint-cities; small hand-curated list). Otherwise leave `St.` untouched.
   - `^N\.\s+` / `^S\.\s+` / `^E\.\s+` / `^W\.\s+` → `North ` / `South ` / `East ` / `West ` respectively.
6. **Title-case** — capitalize first letter of each space-separated word. Preserve compound names — they pass through naturally.
7. **Dedup by slug** — last-write-wins if duplicates; preserve stable input order otherwise.
8. **Validation** — reject empty strings, reject length > 100 chars, reject pure-numeric tokens. Log rejections; surface in admin save response.

---

## 6. Migration sequencing (LOCKED)

1. Source read — view `supabase/functions/provision-tenant/index.ts` ✅ DONE
2. Part 0 — schema hardening ✅ DONE
3. Rollback script staged ✅ DONE
4. Part A hunt → `docs/migrations/s164-2-provision-hunt.md` ✅ DONE
5. Part B fix → implement shared helper, rewrite provision-tenant, rewrite admin save handler, add normalizer + tests, remove shell b9 hardcoded East Texas list, replace with graceful empty state.
6. Commit + Vercel deploy READY gate
7. Backfill SQL — Demo JSONB only
8. ISR purge empty commit
9. Drift-detection gate query
10. Verify live

---

## 7. Drift-detection gate (final check)

```sql
WITH counts AS (
  SELECT
    t.id AS tenant_id,
    t.slug AS tenant_slug,
    (SELECT COUNT(*) FROM public.service_areas sa
       WHERE sa.tenant_id = t.id AND sa.is_live) AS table_live_count,
    (SELECT COUNT(*) FROM public.service_areas sa
       WHERE sa.tenant_id = t.id) AS table_total_count,
    (SELECT jsonb_array_length(s.value->'service_areas')
       FROM public.settings s
       WHERE s.tenant_id = t.id AND s.key = 'seo'
         AND jsonb_typeof(s.value->'service_areas') = 'array'
       LIMIT 1) AS jsonb_count
  FROM public.tenants t
)
SELECT *
FROM counts
WHERE table_live_count IS DISTINCT FROM COALESCE(jsonb_count, 0)
  AND tenant_id <> '1611b16f-381b-4d4f-ba3a-fbde56ad425b';
```

**Pass condition:** zero rows returned.

---

## 8. Out of scope for S164

- T5b (drop `image_url`), Dang Vite→Next.js clone, `location_data` view drop, Supabase types regen
- T4 role architecture cleanup
- b13 (stale `zap5-tenant-provisioned` Zapier webhook)
- JSON-LD typed-city projection upgrade — v2 scope
- Option C Places integration — v2 scope

---

## 9. Open risks logged

- Existing pre-S164 row intros/meta empty on 17 of 21 existing `service_areas` rows
- Admin form displays raw uncorrected user input (UX bug or historical manual SQL correction)
- Normalizer v1 preserves user intracap (`Mckinney` stays `Mckinney`) — documented limitation
