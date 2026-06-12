# S263 — Suggested-Fix Tier Layer: Implementation Spec

**Status:** SPEC — pre-build, pre-deploy. Feeds the Perplexity + Gemini validator gate
(conservative-wins) **before** any merge or edge-fn deploy.
**Source of truth:** `docs/audits/pestflow-pro-kickoff-S263.md` (merged via #180). This spec
*refines* the kickoff against live-grounded reality — where they differ, the divergence is
called out explicitly below and the spec wins (with Scott's sign-off).

> **⚠️ AMENDED (validator gate returned).** Both validators (Perplexity + Gemini,
> conservative-wins) agreed the five §7 seams are **real** and the spec was **not safe to ship as
> written**. §2, §4 (Steps 1–3), §5, and §7 now encode explicit server-side enforcement for all
> five. See **§7** for the resolved-by-design summary. **Build is paused pending Scott's confirm of
> these amendments.**

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
3. **`fix_field` migration approved.** The additive `report_findings.fix_field` column (§2) is
   confirmed over text-parsing — deterministic + allow-listed; one additive migration is accepted.

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

**Solution (recommended): stamp the target field — and the write-target's version baseline —
on the finding.**
- **Migration (Claude.ai / MCP), two additive nullable columns:**
  - `ALTER TABLE report_findings ADD COLUMN fix_field text;` — the target field.
    Allowed values: `'intro' | 'meta_title' | 'meta_description' | 'focus_keyword'`; `NULL` for
    non-applyable (site-wide / engagement / technical / keyword-handled-elsewhere) findings.
    `fix_field` is a **closed server-side enum**, never a free-text column name (see §7 Seam 3).
  - `ALTER TABLE report_findings ADD COLUMN fix_base_updated_at timestamptz;` — the optimistic-
    concurrency baseline: the target row's `updated_at` **as it stood when the suggested fix was
    generated**. Used by the apply's `WHERE updated_at = fix_base_updated_at` predicate so a row
    edited after the fix was generated is never silently clobbered (see §7 Seam 5). Both
    `page_content` and `seo_meta` carry `updated_at` (verified live), so this is universally
    available for every applyable target.
- **Generator (`generate-monthly-report`, CC Web → I deploy):** set `fix_field` on each
  `content`/page-scoped-`meta` finding at the `findings.push(...)` site. One literal per branch.
- **Suggested-fix generate action (§4 Step 1):** when it writes `suggested_fix + suggested_fix_at`,
  it also stamps `fix_base_updated_at` = the current `updated_at` of the resolved target row
  (server/RLS-scoped read of `page_content`/`seo_meta` by `tenant_id,page_slug`). Captured from
  authoritative server state, never from a client payload.
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
  `suggested_fix + suggested_fix_at` to `report_findings` (RLS-scoped admin write; cache), and in
  the same write stamp `fix_base_updated_at` = the resolved target row's current `updated_at`
  (§2) — the concurrency baseline the apply later matches against.
- **View gate:** the generated text renders only under `FeatureGate minTier={3}` (Pro+ to VIEW).

### Step 2 — Per-finding apply (Pro-gated edge fn) — THE core work
New edge fn **`apply-finding-fix`** (`verify_jwt: true`), default `mode: 'single'` (the
`fix_all` mode is §Step 3). Request body carries the finding `id` only — **never** `tenant_id`,
`tier`, or a column name.

1. **Verify admin + derive tenant from the JWT (Seam 2).** `requireTenantAdmin(req, tenantId)`
   where `tenantId` is resolved from the **verified JWT's tenant membership / authoritative
   server state**, not from the request payload. If the body carries a `tenant_id`, it is
   ignored (or must equal the JWT-derived value, else 403). Call this server-derived value
   `jwtTenant`. → 401/403 on failure.
2. **Tier (Seam 2/4).** `check_tenant_access(jwtTenant, 3)` → 403 `{error:'upgrade_required'}`
   if not Pro+. Tier comes only from `check_tenant_access` against `jwtTenant`, never the payload.
3. **Load + assert.** Load finding by `id` **and `tenant_id = jwtTenant`** (service role). Assert
   `page_slug IS NOT NULL`, `fix_field IS NOT NULL`, `suggested_fix IS NOT NULL` (must be
   generated first), not already `is_resolved`. Else 4xx with a typed reason.
4. **Resolve the column via a hardcoded enum→column map (Seam 3).** A literal server-side map —
   `{ intro: 'page_content.intro', meta_title: 'seo_meta.meta_title',
   meta_description: 'seo_meta.meta_description', focus_keyword: 'seo_meta.focus_keyword' }`.
   If `fix_field` is not one of these four keys → **400** `{error:'bad_fix_field'}`. The column
   name used in the write is the **map's value, chosen by a switch/lookup** — `fix_field` is
   **NEVER** interpolated into SQL or used as a dynamic column identifier. No dynamic-column writes.
5. **Write with tenant + concurrency + manual-edit guards in the WHERE (Seams 2 & 5).** A scoped
   `UPDATE` (not a blind upsert), predicated on:
   - `tenant_id = jwtTenant` (belt-and-suspenders alongside `requireTenantAdmin`)
   - `page_slug = <finding.page_slug>`
   - `updated_at = <finding.fix_base_updated_at>` — optimistic concurrency: the target row must
     be unchanged since the fix was generated.
   - for the three `seo_meta` columns **only**: `AND user_edited = false` — never clobber a manual
     edit. (`page_content` has no `user_edited` column, so the `updated_at` guard alone carries the
     "don't overwrite a newer manual edit" guarantee there.)
   - On success set the target column = `suggested_fix`; for `seo_meta` writes also set
     `user_edited = true` (so the generator stops nagging the page).
   - **If 0 rows update → 409 `{error:'conflict', reason:'manual_edit_or_stale'}`** and do **not**
     flip `is_resolved`. The UI reports "your manual edit was preserved — re-generate to refresh."
6. `report_findings.is_resolved = true` (only after a 1-row write).
7. Return `{ ok:true, tenant_id: jwtTenant, page_slug }`.

> The target row must already exist (every page has a `page_content`/`seo_meta` row from
> provisioning); the apply is an `UPDATE`, not an upsert, precisely so the WHERE guards (Seams 2/5)
> can gate the write atomically at the DB.

**Edge fn does NOT purge ISR** (Deno can't call Next `revalidateTag`). **Ordering (Seam 1):** the
frontend **awaits the apply's `200` (DB write confirmed), THEN** calls
`triggerRevalidate({type:'page', tenantId, slug}, accessToken)`. Strictly sequential — never
fire-and-forget, never in parallel, never on a timer/delay. On revalidate `false` → warning toast
(DB write landed; CDN stale until TTL), per existing convention. Per-finding success/fail state
in the UI; a `409` surfaces as "manual edit preserved", not a generic failure.

### Step 3 — Elite "Fix all" (Elite-gated — server tier-4 authorization, then loop)
- `FeatureGate minTier={4}` (cosmetic) gates the button; **the real gate is server-side (Seam 4).**
- **Preview + confirm modal first:** "This will apply N fixes across M pages" + list (page · what
  changes). Explicitly notes site-wide findings are **skipped** (and why).
- **Distinct server-gated path:** on confirm, the frontend makes **one** call to
  `apply-finding-fix` with **`mode: 'fix_all'`** (same fn, dedicated branch). That path:
  1. `requireTenantAdmin` → derive `jwtTenant` from the JWT (as Step 2).
  2. **`check_tenant_access(jwtTenant, 4)` — the mandatory, explicit tier-4 authorization —
     runs FIRST, BEFORE it enumerates or loops anything.** 403 `{error:'upgrade_required'}` if not
     Elite. This is an authorization gate, **not** rate-limiting (rate-limiting is NOT the gate).
  3. **Then** enumerate the tenant's applyable findings server-side (`tenant_id = jwtTenant AND
     page_slug IS NOT NULL AND fix_field IS NOT NULL AND suggested_fix IS NOT NULL AND NOT
     is_resolved`) and loop the **identical per-finding write** from Step 2 over each — every
     iteration still runs the **tier-3 `check_tenant_access` + Seam-2/3/5 WHERE guards** as
     defense-in-depth.
  4. Return a per-finding result array (`applied | conflict(409) | skipped | error`) plus the set
     of distinct `page_slug`s actually written.
- **No atomic transaction, no rollback** — each apply is independent; a mid-loop failure or `409`
  leaves prior applies in place and is marked in the result array. This is the **same single-apply
  repeated**, not a new bulk-write machine.
- **Revalidate ordering (Seam 1):** the frontend **awaits the `fix_all` response, THEN** calls
  `triggerRevalidate({type:'page', tenantId, slug})` once per distinct written slug (dedupe),
  sequentially. Never before the writes confirm.

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
| Apply (per finding) | `FeatureGate minTier={3}` | `apply-finding-fix` (`mode:'single'`) → JWT-derived tenant + `check_tenant_access(jwtTenant,3)` + tenant/concurrency/user_edited WHERE guards |
| Fix all | `FeatureGate minTier={4}` | `apply-finding-fix` (`mode:'fix_all'`) → **explicit `check_tenant_access(jwtTenant,4)` FIRST**, then server-side loop of the tier-3 single-apply (defense-in-depth) |

> **Resolved (Seam 4):** "Fix all" is no longer a client-only loop. It is a distinct server path
> with its own mandatory tier-4 authorization that runs before any enumeration, with the per-write
> tier-3 check retained underneath. A tampering Pro user calling `mode:'fix_all'` is rejected 403 at
> the tier-4 gate; calling `mode:'single'` in a loop still hits the tier-3 gate + WHERE guards on
> every write. See §7 Seam 4.

---

## 6. Files — who writes what

**CC Web (repo writes, branch + PR, Scott merges):**
- `supabase/functions/apply-finding-fix/index.ts` (new, < 200 lines; `mode:'single'|'fix_all'`,
  JWT-derived tenant, hardcoded `fix_field`→column map, tenant/concurrency/`user_edited` WHERE guards,
  409-on-0-rows)
- `supabase/functions/ai-proxy/index.ts` (add Pro-tier feature key(s) — source only)
- `supabase/functions/generate-monthly-report/index.ts` (stamp `fix_field`)
- `src/components/admin/seo/useSeoTab.ts` (generate action; apply caller; fix-all loop; seo_meta revalidate fix)
- `src/components/admin/seo/SeoPagesTab.tsx` / `SeoInlineEditor.tsx` (Generate/Apply/Fix-all buttons + state)
- New small modal component for Fix-all preview/confirm
- `src/lib/ai/aiFeatures.ts` (register new feature name(s))

**Claude.ai / MCP (Scott triggers; I run after verified merged source):**
- Additive migration: `report_findings.fix_field text` **+ `report_findings.fix_base_updated_at timestamptz`** (both nullable; apply_migration)
- Deploy edge fns: `apply-finding-fix`, `ai-proxy`, `generate-monthly-report`
- Regenerate Dang's report (stamp `fix_field` on the 8 applyable findings)
- Verify artifacts (not success messages): row writes, ISR purge effect on live page

---

## 7. Validator gate — five seams RESOLVED BY DESIGN (Perplexity + Gemini, conservative-wins)

**Gate outcome (run this session):** both validators agreed all five seams below are **real** and
the spec was **not safe to ship as originally written** (the prior version posed these as open
questions). This section is amended so each seam is **resolved by an explicit server-side
enforcement mechanism baked into the contract above** — not a question, not a runtime mitigation,
and not rate-limiting. The build implements these as written; the gate re-confirms them on the
amended spec.

### Seam 1 — Write-then-revalidate ordering — RESOLVED
**Mechanism (see §4 Step 2 ordering note, Step 3 step 4):** the apply path **awaits the DB write
success (the `200`), THEN** triggers `triggerRevalidate`. Strictly **sequential**, never
parallel, never fire-and-forget, and **no timing-delay/`setTimeout` workaround**. For `fix_all`,
revalidate fires only after the server loop returns, once per distinct written slug. There is no
path where revalidate is scheduled before the write is confirmed.

### Seam 2 — Tenant boundary (hardened) — RESOLVED
**Mechanism (see §4 Step 2.1–2.5):** `tenant_id` and `tier` are taken **only** from the verified
JWT / authoritative server state — **never** from the request payload. The apply `UPDATE` carries
the **JWT-derived `tenant_id` in its WHERE clause** (`tenant_id = jwtTenant`) as belt-and-suspenders
**in addition to** `requireTenantAdmin`, and the finding is loaded `WHERE id = … AND tenant_id =
jwtTenant`. `check_tenant_access` is called against `jwtTenant`. A body `tenant_id` is ignored (or
must equal `jwtTenant`).

### Seam 3 — `fix_field` allow-list — RESOLVED
**Mechanism (see §4 Step 2.4):** a **hardcoded server-side enum→column map** with exactly four
keys (`intro`, `meta_title`, `meta_description`, `focus_keyword`). Anything else → **400**. The
column written is the **map's value selected by lookup/switch**; `fix_field` is **NEVER**
interpolated into a SQL column name and there are **no dynamic-column writes**.

### Seam 4 — Fix-all tier gate (mandatory, explicit) — RESOLVED
**Mechanism (see §4 Step 3, §5):** the bulk capability is a **distinct server path**
(`mode:'fix_all'` on `apply-finding-fix`) whose **own `check_tenant_access(jwtTenant, 4)` runs
FIRST — before it enumerates or loops anything**. The per-write **tier-3 check is retained
underneath** as defense-in-depth. This is an **explicit tier-4 authorization, not rate-limiting**.

### Seam 5 — `user_edited` clobbering (mandatory) — RESOLVED
**Mechanism (see §2 `fix_base_updated_at`, §4 Step 1 stamp, §4 Step 2.5):** `user_edited = false`
is part of the **`UPDATE … WHERE` predicate itself** (for the three `seo_meta` columns), not just
selection/UI. **Optimistic concurrency** adds `updated_at = fix_base_updated_at` (the target row's
version captured when the fix was generated) so a row changed after the finding was generated is
not silently overwritten — this also carries `page_content.intro`, which has no `user_edited`
column. **If 0 rows update → `409 Conflict`**, `is_resolved` is left untouched, and the UI reports
the manual edit was preserved.

**For the gate to re-confirm on the amended spec:** (a) the JWT-derived-tenant + WHERE-clause
tenant guard closes the boundary; (b) the closed enum→column map removes the injection footgun;
(c) the tier-4-first authorization makes Fix-all a real Elite gate; (d) the `user_edited = false`
+ `updated_at` WHERE predicate with 409-on-0-rows makes manual-edit preservation atomic at the DB;
(e) await-then-revalidate ordering removes the stale-repopulation window.

---

## 8. Deploy sequence (after gate GREEN + Scott merges)

1. Scott merges the PR (CC Web source).
2. Scott brings verified post-merge source; **I** apply the additive migration — `fix_field` **and
   `fix_base_updated_at`** (MCP).
3. **I** deploy `ai-proxy`, `generate-monthly-report`, `apply-finding-fix` (MCP), verifying each
   artifact (version bump, function reachable).
4. **I** regenerate Dang's report; verify 8 findings stamped `fix_field`, 3 site-wide `NULL`.
5. End-to-end verify on Dang: generate → apply one content + one meta finding → confirm DB write +
   live page `<head>`/intro updated (ISR purged) + `is_resolved` flipped. Then Elite "Fix all".

---

## 9. Explicitly OUT of scope
No atomic multi-page bulk write · no partial-rollback · no apply for site-wide (`page_slug: null`)
findings · no change to the report-generation cadence · no migration of `scrape-prospect`
(unrelated). Elite = the **same per-finding single-apply repeated** in a server-side loop behind a
tier-4 gate (§4 Step 3) — non-atomic, no rollback. This is not a new bulk-write machine; the
"`mode:'fix_all'`" branch reuses the identical per-write logic and guards.

---

*Spec drafted S263 from live grounding. No code written, nothing deployed.* **Amended (this
session)** to resolve all five §7 seams by server-side design after the Perplexity + Gemini
validator gate (conservative-wins) flagged the original §7 questions as real and not safe to ship
as written. **Awaiting Scott's confirm on these amendments before build** — and on the additive
`fix_field` + `fix_base_updated_at` migration (§2) — then build/merge/deploy.*
