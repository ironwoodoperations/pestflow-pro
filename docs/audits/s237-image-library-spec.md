# S237 — Image Library / Media Tab — Wave 2 Spec

**Session:** S237
**Date:** 2026-05-22
**Branch:** `claude/modest-einstein-aodiq`
**Author:** Claude Code (Web)
**Status:** Wave 2 FINAL. **Validator gate GREEN** (Perplexity + Gemini, 2026-05-22) — amendments A–D applied; see §9 and `s237-validator-gate.md`.
**Predecessor:** `docs/audits/s237-image-library-audit.md` (Wave 1).

---

## 0. Scott's Wave-1 decisions (locked)

| Ref | Decision | Resolution |
|-----|----------|------------|
| Library scope (D3) | **Add `bucket_id` column now (default `social-uploads`); backfill only the 17 `social-uploads` objects this session.** `tenant-assets` (97 objects) deferred — no migration needed to add it later. |
| Session split | **S237a then S237b.** This spec scopes **S237a** for build; **S237b** is outlined for the follow-up session. |

Remaining audit decisions resolved by recommendation (low-risk, may be overridden in review):
D1 keep `<tenant>/social/` path · D2 add DELETE storage policy only · D4 reuse `resizeImage.ts` (bump to 2048px) · D5 new `ImageLibraryPicker.tsx` modal, don't replace `ComposerImagePicker` · D6 nav: Media between Blog and Social · D7/D8 add `UNIQUE(storage_path)` + `bucket_id` · D9 upload → getPublicUrl → INSERT ordering.

---

## 1. Scope

### S237a (this session — table + tab + backfill)
1. Migration `s237_image_library_table_and_rls`: table, indexes, RLS, **DELETE-only** storage policy, `NOTIFY pgrst`.
2. Backfill: one-shot idempotent SQL importing the 17 `social-uploads` objects, tenant-mapped.
3. `MediaTab.tsx` — admin tab: upload (drag-drop + button), grid of thumbnails, folder assign, soft-delete.
4. Admin nav: add **Media** between Blog and Social. Ungated (tier-1 access).
5. `useImageLibrary.ts` hook — list/insert/soft-delete/folder-update, tenant-scoped.

### S237b (next session — composer integration)
6. `ImageLibraryPicker.tsx` modal (grid + folder filter + search, single-select).
7. Wire "Choose from Library" into `ComposerImagePicker` (social) → `form.imageUrl`.
8. Wire hero-image picker into `BlogPostEditor` → `form.featured_image_url`.
9. AI auto-attach read-contract stub (doc only, no code).

---

## 2. Schema

```sql
CREATE TABLE image_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bucket_id text NOT NULL DEFAULT 'social-uploads',   -- D3: multi-bucket-ready
  storage_path text NOT NULL,                          -- relative path within bucket
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  width integer,                                       -- NULL on backfill (no storage metadata)
  height integer,
  folder text,                                         -- flat; NULL = unfiled
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,                              -- soft-delete
  CONSTRAINT image_library_path_unique UNIQUE (bucket_id, storage_path),  -- D7/D8: idempotent backfill + dedupe
  -- Validator gate (Amendment A) — both validators:
  CONSTRAINT image_library_path_tenant_prefix
    CHECK (storage_path LIKE tenant_id::text || '/%'),   -- row can only point at its own tenant prefix
  CONSTRAINT image_library_bucket_id_known
    CHECK (bucket_id IN ('social-uploads', 'tenant-assets'))  -- catch typos / silent mis-categorization
);

CREATE INDEX idx_image_library_tenant_active ON image_library (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_image_library_folder ON image_library (tenant_id, folder) WHERE deleted_at IS NULL;
```

Change vs kickoff DDL: added `bucket_id`, added `UNIQUE(bucket_id, storage_path)` (the kickoff's `ON CONFLICT (storage_path)` needs a unique constraint to exist). Public URL is derived client-side from `bucket_id` + `storage_path` via `getPublicUrl` (all buckets public) — not stored.

---

## 3. Table RLS (validator-gate target)

```sql
ALTER TABLE image_library ENABLE ROW LEVEL SECURITY;

-- Amendment B: (SELECT current_tenant_id()) wrapping = per-statement eval (Supabase perf pattern);
-- IS NOT NULL guard hardens against absent JWT claim.
-- QA-discovered fix (migration s237_image_library_select_policy_fix):
-- deleted_at IS NULL must NOT be in this policy — PostgreSQL evaluates the
-- post-UPDATE row against the SELECT policy, so it would make soft-delete fail
-- RLS. Active-row filter moved client-side. Tenant isolation unchanged.
CREATE POLICY image_library_tenant_select ON image_library
  FOR SELECT TO authenticated
  USING (
    (SELECT current_tenant_id()) IS NOT NULL
    AND tenant_id = (SELECT current_tenant_id())
  );

CREATE POLICY image_library_tenant_insert ON image_library
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT current_tenant_id()) IS NOT NULL
    AND tenant_id = (SELECT current_tenant_id())
  );

CREATE POLICY image_library_tenant_update ON image_library
  FOR UPDATE TO authenticated
  USING (
    (SELECT current_tenant_id()) IS NOT NULL
    AND tenant_id = (SELECT current_tenant_id())
  )
  WITH CHECK (
    (SELECT current_tenant_id()) IS NOT NULL
    AND tenant_id = (SELECT current_tenant_id())
  );
```

### Immutable-column trigger (Amendment C — both validators)

The UPDATE policy checks `tenant_id` but does not lock `storage_path` / `bucket_id`, so a
tenant could UPDATE their row's `storage_path` to point at another tenant's file. Postgres RLS
cannot reference `OLD` in policy expressions, so this is enforced with a BEFORE UPDATE trigger
(NOT Gemini's invalid `WITH CHECK (... = OLD.column)`):

```sql
CREATE OR REPLACE FUNCTION enforce_image_library_immutable_columns()
  RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'image_library.tenant_id is immutable';
  END IF;
  IF NEW.storage_path IS DISTINCT FROM OLD.storage_path THEN
    RAISE EXCEPTION 'image_library.storage_path is immutable';
  END IF;
  IF NEW.bucket_id IS DISTINCT FROM OLD.bucket_id THEN
    RAISE EXCEPTION 'image_library.bucket_id is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER image_library_immutable_columns_trigger
  BEFORE UPDATE ON image_library
  FOR EACH ROW
  EXECUTE FUNCTION enforce_image_library_immutable_columns();
```

Notes vs kickoff:
- **Dropped the kickoff's separate `image_library_tenant_soft_delete` UPDATE policy** — it overlaps `image_library_tenant_update` (two UPDATE policies OR-combine; the second is redundant and its `deleted_at IS NULL` USING clause would *block re-deletes/undeletes* confusingly). One UPDATE policy covers folder edits + soft-delete. **Open for validator opinion.**
- `TO authenticated` added explicitly (existing storage policies are scoped to `authenticated`; anon never touches this table — public site reads images by public URL, never queries the table).
- No DELETE policy → hard-delete impossible from client (soft-delete only, per kickoff).
- `current_tenant_id()` confirmed present (`SELECT tenant_id FROM profiles WHERE id=auth.uid()`, SECURITY DEFINER STABLE) — same primitive as existing storage policies.

---

## 4. Storage bucket policies

**No read/write changes.** `tenant_read_social` (SELECT) and `tenant_upload_social` (INSERT) already enforce `bucket_id='social-uploads' AND foldername[1]=current_tenant_id()::text`. Adding the kickoff's `social_uploads_tenant_read/write` would duplicate them.

Add only (for a future hard-delete/cleanup fn; harmless now):

```sql
CREATE POLICY social_uploads_tenant_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'social-uploads' AND (storage.foldername(name))[1] = current_tenant_id()::text);
```

**Path convention (D1): keep `<tenant_uuid>/social/<uuid>.jpg`** — matches all 17 existing objects and the live `useComposer.ts` uploader. Media-tab uploads use the same `<tenant>/social/` prefix (or `<tenant>/library/` if we want to distinguish source — **validator/Scott call**; either keeps `foldername[1]=tenant` so RLS is unaffected).

---

## 5. Backfill (S237a)

One-shot idempotent SQL (run via MCP `execute_sql` after migration; not an edge fn — no per-tenant auth needed for a service-role one-time import):

```sql
INSERT INTO image_library (tenant_id, bucket_id, storage_path, original_filename, mime_type, size_bytes, folder, uploaded_by)
SELECT
  ((storage.foldername(o.name))[1])::uuid          AS tenant_id,
  'social-uploads'                                  AS bucket_id,
  o.name                                            AS storage_path,
  split_part(o.name, '/', array_length(string_to_array(o.name,'/'),1)) AS original_filename,
  COALESCE(o.metadata->>'mimetype','image/jpeg')    AS mime_type,
  COALESCE((o.metadata->>'size')::bigint, 0)        AS size_bytes,
  NULL                                              AS folder,
  NULL                                              AS uploaded_by
FROM storage.objects o
WHERE o.bucket_id = 'social-uploads'
  AND (storage.foldername(o.name))[1] ~ '^[0-9a-f-]{36}$'   -- valid tenant-uuid prefix only
ON CONFLICT (bucket_id, storage_path) DO NOTHING;
```

**Expected result: 17 rows — 5 for Dang (`1611b16f…`), 12 for Demo (`9215b06b…`).** (Correcting the kickoff's "all 17 under Dang".) Re-runnable safely. The `~ uuid` guard skips any stray non-tenant-prefixed object.

---

## 6. UI — MediaTab (S237a)

- **Header:** "Upload" button + folder `<select>` (distinct folders for current tenant + "All").
- **Drop zone** wraps the whole tab — drop anywhere to upload (multi-file).
- **Grid:** responsive CSS grid (4–6 cols), thumbnail = `getPublicUrl(bucket_id, storage_path)`. Hover overlay → delete (soft) + folder-assign.
- **Upload pipeline (D9):** `resizeImage(file, 2048)` → `supabase.storage.from('social-uploads').upload('<tenant>/social/<uuid>.jpg', blob)` → `getPublicUrl` → `insert image_library` row. On insert failure: surface error (object orphaned, benign).
- **Resize (D4):** reuse `src/components/admin/social/lib/resizeImage.ts`, max edge **2048**, JPEG q0.82. Canvas re-encode strips EXIF. **No `browser-image-compression` dependency** unless HEIC support is later required.
- Soft-delete sets `deleted_at` via UPDATE; storage object is NOT removed (deferred to future cleanup fn).
- Tenant: from `useTenant()`. No tier gate — do NOT add `media` to `gatedTabs`.

`useImageLibrary.ts`: `list(folder?)`, `upload(file, folder?)`, `softDelete(id)`, `setFolder(id, folder)`, `folders()`.

---

## 7. AI auto-attach stub (read contract only — no code in S237)

Future managed-services tier reads:
`SELECT id, storage_path, bucket_id FROM image_library WHERE tenant_id = current_tenant_id() AND deleted_at IS NULL [AND folder = $1] ORDER BY created_at DESC` → derive public URL → set `social_posts.image_url`. Row shape is already sufficient; no schema change needed for that future work.

---

## 8. Tier gate

Media tab ungated (absent from `gatedTabs` in `Dashboard.tsx`) → tier-1 (Starter) access. Composer integration (S237b) lives *behind* the pre-existing tier-2 Social/Blog gates — so the picker is only reachable at tier 2+. **QA test #8 reworded:** Starter sees Media tab; Starter does not see Social/Blog (pre-existing gate), so the composer-picker is not tier-1-testable — expected, not a regression.

---

## 9. Validator gate (REQUIRED before Wave 3) — GREEN ✓

> **GREEN with amendments (2026-05-22).** Both Perplexity and Gemini approved the core design and independently flagged three security gaps (path-tenant alignment CHECK, immutable-column trigger, bucket_id value CHECK), one perf hardening (SELECT-wrapped policies + NULL guard), and one deferred operational follow-up (reconciliation job). All applied — Amendments A–D above + §11. Full verbatim responses in `docs/audits/s237-validator-gate.md`. The submission payload that was sent is preserved below for the record.

Per standing rule, the RLS policies (§3 table + §4 storage DELETE) must be reviewed by **Perplexity AND Gemini** before implementation. **This environment has no Perplexity/Gemini MCP access** (only Supabase, GitHub, Vercel, Google/Outlook/QuickBooks). Options for Scott:
1. Run the submission (below) in his Claude.ai chat / external tools and paste responses → I record them in `s237-validator-gate.md` and proceed.
2. Provide the responses directly.
3. Explicit waiver (standing rule says don't expect one).

### Submission payload (questions per kickoff)
> Context: multi-tenant Postgres (Supabase). `current_tenant_id()` = `SELECT tenant_id FROM profiles WHERE id=auth.uid()` (SECURITY DEFINER, STABLE). New `image_library` table RLS (§3) + existing `social-uploads` storage policies using `foldername(name)[1]=current_tenant_id()::text` (§4). Soft-delete only.
>
> 1. Is `current_tenant_id()` the right tenant-isolation primitive here vs the `requireTenantUser` C2 edge-fn pattern (S213c-B)? (We assert they're different layers — RLS vs edge-fn auth.)
> 2. Should bucket policies enforce path-prefix at INSERT, or rely solely on the table INSERT policy + presigned-URL flow? (Existing `tenant_upload_social` already enforces prefix at INSERT.)
> 3. Race condition between table INSERT and storage upload — orphan rows vs orphan objects? (We propose upload → getPublicUrl → INSERT; insert-fail leaves a benign orphan object.)
> 4. Is collapsing the kickoff's separate soft-delete UPDATE policy into one `image_library_tenant_update` policy correct, or does the dual-policy design serve a purpose we're missing?

Responses + disposition → `docs/audits/s237-validator-gate.md`. **No migration / no code until GREEN.**

---

## 10. Files (planned)

**S237a:** `supabase/migrations/<ts>_s237_image_library_table_and_rls.sql` · `docs/migrations/s237-image-library-rollback.sql` · `src/components/admin/MediaTab.tsx` · `src/hooks/useImageLibrary.ts` · `src/pages/admin/Dashboard.tsx` (nav) · backfill SQL (in `docs/migrations/`, applied via MCP) · `docs/audits/s237-validator-gate.md`.
**S237b:** `src/components/admin/social/ImageLibraryPicker.tsx` · `ComposerImagePicker.tsx` (add button) · `BlogPostEditor.tsx` (hero picker).

## 11. Operational follow-up (deferred — not blocking S237a)

Both validators flagged that orphan rows (storage upload succeeded, INSERT failed)
and orphan objects (delete cascade from `tenants` removes rows but doesn't sweep
storage) will accumulate over time. File a separate backlog item to add a
nightly reconciliation job (Supabase Edge Function + pg_cron) that:

1. Lists `image_library` rows where the corresponding storage object returns 404
2. Lists storage objects under `<tenant>/social/` with no matching active row
3. Logs both classes for manual review (do not auto-delete v1)

This is operational hygiene; not a blocker for the Media tab to ship.

---

**Validator gate GREEN (2026-05-22) — see `docs/audits/s237-validator-gate.md`. Wave 3 (S237a) unblocked.**
