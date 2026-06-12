# S263 — Suggested-Fix Tier Layer: Implementation Spec

**Status:** SPEC — pre-build, pre-deploy. Feeds the Perplexity + Gemini validator gate
(conservative-wins) **before** any merge or edge-fn deploy.
**Source of truth:** `docs/audits/pestflow-pro-kickoff-S263.md` (merged via #180). This spec
*refines* the kickoff against live-grounded reality — where they differ, the divergence is
called out explicitly below and the spec wins (with Scott's sign-off).

---

## 0. Decisions locked this session (Scott)

1. **Tier floor = Growth.** The kickoff's "Free / all tiers see the problem" is corrected:
   the only surface that renders `report_findings` is the SEO tab, gated `FeatureGate minTier={2}`.
   So the value ladder is:
   - **Growth (tier 2)** — see findings + plain-language coaching (already shipped S261, inside the Growth-gated SEO tab).
   - **Pro (tier 3)** — generate the AI suggested fix (lazy, cached) + one-click apply, per finding.
   - **Elite (tier 4)** — everything Pro + "Fix all" loop behind one preview/confirm modal.
   No new free surface; Pro/Elite gates layer **inside** the existing Growth-gated tab.
2. **Apply = new server-gated edge function.** The per-finding apply runs through a new
   `apply-finding-fix` edge fn (`requireTenantAdmin` + `check_tenant_access(tenant, 3)`,
   service-role write). The frontend calls the **existing** `triggerRevalidate({type:'page'})`
   immediately after it returns. Tier enforcement is server-side, not cosmetic.

---

## 1. Grounded reality (verified live — biezzy… project)

### 1.1 `report_findings` (actual columns)
`id, report_id, tenant_id, finding_key, category, severity, page_slug (nullable), page_name,
problem, metric (nullable), suggested_fix (nullable), suggested_fix_at (nullable),
is_resolved (NOT NULL bool), created_at`.

`finding_key` is a **sequential counter** (`f0…fN` via `nextId()` in `generate-monthly-report`),
**not** a stable issue-type code — it does **not** identify the target field.

### 1.2 Dang's 11 findings (pilot — tenant `1611b16f-381b-4d4f-ba3a-fbde56ad425b`)
8 page-scoped (applyable), 3 site-wide (no apply). Live data validates every finding exactly.

### 1.3 Write targets are TWO tables, by category + field (divergence from kickoff)
The kickoff said "write into the correct `page_content` field." Reality: `page_content` has **no**
SEO meta columns. Mapping:

| category | generator check | target table.column | example findings |
|----------|-----------------|----------------------|------------------|
| `content` | `intro` empty or `< 120` chars | `page_content.intro` | f5/f6/f7 |
| `meta` | `meta_description` missing or len ∉ [70,160] | `seo_meta.meta_description` | f2 |
| `meta` | `meta_title` missing or len > 60 | `seo_meta.meta_title` | f3 |
| `meta` | `focus_keyword` null (+ GSC impressions) | `seo_meta.focus_keyword` | f0/f1/f4 |

`seo_meta` is keyed `(tenant_id, page_slug)` and has a `user_edited` boolean. `page_content` is
keyed `(tenant_id, page_slug)`; `intro` is a real column. Both already have proven admin upsert
paths (see §3).

### 1.4 Site-wide findings (no apply this session)
`engagement` (page-2 rankings, f8/f9/f10), `technical` (site speed), duplicate-title (site-wide
`meta`, `page_slug: null`). All have `page_slug: null` → no single page to write → **no apply
button**, surfaced as coaching only. Note: a site-wide duplicate-title `meta` finding exists, so
"all meta findings are applyable" is **false** — applyability is gated on `page_slug IS NOT NULL`,
not on category.

---

## 2. Required additive migration (divergence from kickoff "no DB changes")

The generator knows the exact target field at construction time, but does not persist it, and a
single page can carry multiple distinct `meta` findings (about → title + description + keyword).
Therefore the apply **cannot** deterministically resolve the column from category + page alone.

**Solution (recommended): stamp the target field on the finding.**
- **Migration (Claude.ai / MCP):** `ALTER TABLE report_findings ADD COLUMN fix_field text;`
  (nullable, additive, no backfill of historical rows required — see regeneration note).
  Allowed values: `'intro' | 'meta_title' | 'meta_description' | 'focus_keyword'`; `NULL` for
  non-applyable (site-wide / engagement / technical / keyword-handled-elsewhere) findings.
- **Generator (`generate-monthly-report`, CC Web → I deploy):** set `fix_field` on each
  `content`/page-scoped-`meta` finding at the `findings.push(...)` site. One literal per branch.
- **Regeneration:** existing findings (incl. Dang's) have `fix_field = NULL` until the report is
  regenerated. After the generator deploys, **regenerate Dang's report** (idempotent upsert) so
  the 8 applyable findings get stamped. Apply/Generate buttons render only when
  `page_slug IS NOT NULL AND fix_field IS NOT NULL`.

**Rejected alternative:** parse `fix_field` from the `problem` string in the apply fn. Couples
write logic to human-readable copy; brittle if copy changes; conservative-wins gate would flag it.

> ⚠️ This is the one item that breaks the kickoff's "none anticipated" DB assumption. It is
> additive + nullable (zero risk to existing reads). **Scott to confirm** before the gate.

---

## 3. Existing proven surfaces this build reuses (do NOT rebuild)

- **ISR purge:** `src/lib/revalidate.ts → triggerRevalidate({type:'page', tenantId, slug}, accessToken)`
  → `app/api/revalidate/route.ts` (verifies tenant-admin JWT vs `tenant_users`, then
  `revalidateTag(page) + revalidateTag(allPages) + revalidatePath('/tenant/[slug]','layout')`).
  This **is** the kickoff's required purge; the apply just calls it post-write.
- **`page_content` write pattern:** `ContentTab.tsx` upserts `page_content` then `triggerRevalidate`.
- **`seo_meta` write pattern:** `seo/useSeoTab.ts handleSaveMeta` upserts `seo_meta`
  (`user_edited: true`) — **but never calls `triggerRevalidate` (latent bug).**
- **AI:** `src/lib/ai/callAi.ts → callAi(feature, { tenant_id, max_tokens, messages, system?, temperature? })`
  → `supabase.functions.invoke('ai-proxy', …)`. ai-proxy pins model + enforces per-feature tier.
- **Server tenant-auth (C2):** `_shared/auth/requireTenantUser.ts → requireTenantAdmin(req, tenantId)`;
  edge fns then `rpc('check_tenant_access', { p_tenant_id, p_required_tier })`. Template:
  `post-to-social/index.ts`.
- **Frontend tier:** `FeatureGate minTier={n}` / `PlanContext.usePlan().canAccess(n)`, resolved from
  `tenants.entitlement` (S262). Cosmetic only; server is the real gate.
- **Findings UI:** `seo/SeoPagesTab.tsx` + `seo/SeoInlineEditor.tsx (FlaggedFindings)`, data via
  `seo/useSeoTab.ts`. Buttons attach here.

---

## 4. Build — step by step

### Step 1 — Generate suggested fix (Pro-gated, lazy, cached)
- **New ai-proxy feature(s)** registered at **tier 3**: e.g. `seo_fix_content` and `seo_fix_meta`
  (or one `seo_fix` keyed on `fix_field`). ai-proxy enforces the Pro gate server-side; model pinned
  `claude-sonnet-4-6`. (CC Web edits `ai-proxy` source; **I deploy via MCP**.)
- **Frontend** (`useSeoTab` action): if `suggested_fix` already set → no-op (cached). Else
  `callAi('seo_fix_*', { tenant_id, max_tokens, system, messages })` with a per-`fix_field` prompt
  (e.g. meta_title ≤ 60 chars, meta_description 70–160, focus_keyword = single phrase, intro =
  2–4 sentences grounded in business_info + page). Strip backticks before any JSON parse. Write
  `suggested_fix + suggested_fix_at` to `report_findings` (RLS-scoped admin write; cache).
- **View gate:** the generated text renders only under `FeatureGate minTier={3}` (Pro+ to VIEW).

### Step 2 — Per-finding apply (Pro-gated edge fn) — THE core work
New edge fn **`apply-finding-fix`** (`verify_jwt: true`):
1. `requireTenantAdmin(req, tenant_id)` → 401/403 on failure.
2. `check_tenant_access(tenant_id, 3)` → 403 `{error:'upgrade_required'}` if not Pro+.
3. Load finding by `id` (service role); assert `tenant_id` match, `page_slug IS NOT NULL`,
   `fix_field IS NOT NULL`, `suggested_fix IS NOT NULL` (must be generated first), not already
   `is_resolved`. Else 4xx with a typed reason.
4. Write by `fix_field` (service role, upsert `onConflict tenant_id,page_slug`):
   - `intro` → `page_content.intro = suggested_fix`
   - `meta_title | meta_description | focus_keyword` → `seo_meta.<col> = suggested_fix`,
     set `user_edited = true` (so the generator stops nagging the page).
5. `report_findings.is_resolved = true`.
6. Return `{ ok:true, tenant_id, page_slug }`.

**Edge fn does NOT purge ISR** (Deno can't call Next `revalidateTag`). The **frontend**, on a
`200`, calls `triggerRevalidate({type:'page', tenantId, slug}, accessToken)` **in the same turn**.
On revalidate `false` → warning toast (DB write landed; CDN stale until TTL), per existing convention.
Per-finding success/fail state in the UI.

### Step 3 — Elite "Fix all" (Elite-gated, loop — nearly free)
- `FeatureGate minTier={4}`; button renders all applyable findings.
- **Preview + confirm modal first:** "This will apply N fixes across M pages" + list (page · what
  changes). Explicitly notes site-wide findings are **skipped** (and why).
- On confirm: loop the **step-2** call over each applyable finding (`page_slug IS NOT NULL AND
  fix_field IS NOT NULL AND suggested_fix IS NOT NULL`). **No atomic transaction** — each apply
  independent; a mid-list failure leaves prior applies in place and marks the failed one. After the
  loop, call `triggerRevalidate({type:'page'})` per distinct slug touched (dedupe).
- **No bulk-write path, no rollback** — Elite is a thin client-side loop over the proven single apply.

### Step 4 — Fix the `seo_meta` revalidate gap (in-scope, small)
`useSeoTab.handleSaveMeta` must call `triggerRevalidate({type:'page', tenantId, slug})` after its
`seo_meta` upsert (it currently doesn't — meta edits silently don't purge ISR today). The S263
apply path purges correctly; this also closes the pre-existing manual-editor gap so the two are
consistent. (Confirm the public page's `<head>` meta read is under the `page`/`allPages` cache tag
so the purge is effective — verify in `app/tenant/[slug]/_lib/queries.ts` during build.)

---

## 5. Tier-gate matrix (server is the source of truth)

| Action | Frontend (cosmetic) | Server enforcement |
|--------|---------------------|--------------------|
| See findings + coaching | `FeatureGate minTier={2}` (existing SEO tab) | RLS on `report_findings` read |
| Generate suggested fix | `FeatureGate minTier={3}` | ai-proxy feature tier 3 |
| View suggested fix | `FeatureGate minTier={3}` | (cosmetic; text is non-sensitive) |
| Apply (per finding) | `FeatureGate minTier={3}` | `apply-finding-fix` → `check_tenant_access(t,3)` |
| Fix all | `FeatureGate minTier={4}` | loop of the tier-3 apply fn (no tier-4 server gate needed; UI-only) |

> Open point for the gate: "Fix all" itself has no *server* tier-4 check — it's a client loop over
> a tier-3-gated fn, so a tampering Pro user could loop applies too. Since every underlying write is
> already Pro-gated server-side and applies are idempotent/safe, this is acceptable; flag for the
> validator gate to confirm.

---

## 6. Files — who writes what

**CC Web (repo writes, branch + PR, Scott merges):**
- `supabase/functions/apply-finding-fix/index.ts` (new, < 200 lines)
- `supabase/functions/ai-proxy/index.ts` (add Pro-tier feature key(s) — source only)
- `supabase/functions/generate-monthly-report/index.ts` (stamp `fix_field`)
- `src/components/admin/seo/useSeoTab.ts` (generate action; apply caller; fix-all loop; seo_meta revalidate fix)
- `src/components/admin/seo/SeoPagesTab.tsx` / `SeoInlineEditor.tsx` (Generate/Apply/Fix-all buttons + state)
- New small modal component for Fix-all preview/confirm
- `src/lib/ai/aiFeatures.ts` (register new feature name(s))

**Claude.ai / MCP (Scott triggers; I run after verified merged source):**
- Additive migration `report_findings.fix_field text` (apply_migration)
- Deploy edge fns: `apply-finding-fix`, `ai-proxy`, `generate-monthly-report`
- Regenerate Dang's report (stamp `fix_field` on the 8 applyable findings)
- Verify artifacts (not success messages): row writes, ISR purge effect on live page

---

## 7. Validator gate scope (Perplexity + Gemini, conservative-wins) — REQUIRED before merge

Touches caching + content writes + tier gating. Specifically ask both:
1. Edge-write-then-frontend-revalidate ordering: any window where DB is updated but a concurrent
   request re-populates a stale cache entry? Is `revalidateTag` + `revalidatePath('layout')`
   sufficient for the `<head>` meta change to propagate?
2. `apply-finding-fix` auth: `requireTenantAdmin` + `check_tenant_access(t,3)` — any tenant-boundary
   or privilege gap? Service-role write scoping correct?
3. `fix_field` allow-list enforcement (reject any value outside the 4) — injection/footgun review.
4. "Fix all" lacking a server tier-4 gate — acceptable given tier-3 server gate on each write?
5. `user_edited = true` on meta apply — does it correctly suppress future nags without hiding
   genuinely-needed future findings?

---

## 8. Deploy sequence (after gate GREEN + Scott merges)

1. Scott merges the PR (CC Web source).
2. Scott brings verified post-merge source; **I** apply the `fix_field` migration (MCP).
3. **I** deploy `ai-proxy`, `generate-monthly-report`, `apply-finding-fix` (MCP), verifying each
   artifact (version bump, function reachable).
4. **I** regenerate Dang's report; verify 8 findings stamped `fix_field`, 3 site-wide `NULL`.
5. End-to-end verify on Dang: generate → apply one content + one meta finding → confirm DB write +
   live page `<head>`/intro updated (ISR purged) + `is_resolved` flipped. Then Elite "Fix all".

---

## 9. Explicitly OUT of scope
No atomic multi-page bulk write · no partial-rollback · no separate bulk-write path · no apply for
site-wide (`page_slug: null`) findings · no change to the report-generation cadence · no migration
of `scrape-prospect` (unrelated). Elite = loop over single-apply.

---

*Spec drafted S263 from live grounding. No code written, nothing deployed. Awaiting Scott's
confirmation on the `fix_field` migration (§2) + validator gate before build/merge/deploy.*
