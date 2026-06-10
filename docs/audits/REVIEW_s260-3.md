# REVIEW — S260-3: "Needs update" badges on SEO → Pages list

**Branch:** `feat/s260-3-needs-update-badges`
**Goal:** Surface a per-page "Needs update" badge on the admin SEO → Pages list for any page with open (unresolved) findings from the latest monthly report. Free for ALL tiers — no tier gating.

---

## Files changed

| File | Change |
|------|--------|
| `src/components/admin/seo/seoTypes.ts` | New `FindingSeverity` type; added optional `needsUpdate` / `findingCount` / `findingSeverity` to `SeoPageRow`. |
| `src/components/admin/seo/useSeoTab.ts` | `loadAll()` gains ONE query against `report_findings`, reduces rows into a `Map<slug, {count, topSeverity}>`, and attaches the per-slug summary in `makeRow`. |
| `src/components/admin/seo/SeoPagesTab.tsx` | Renders the badge in the SEO-status cell when `needsUpdate` is true, colored by severity. |
| `docs/audits/REVIEW_s260-3.md`, `docs/audits/QA_REPORT_s260-3.md` | This review + QA. |

## Data path

1. **Query (light payload):**
   ```ts
   supabase.from('report_findings').select('page_slug, severity')
     .eq('tenant_id', tenantId).eq('is_resolved', false).not('page_slug', 'is', null)
   ```
   Only `page_slug` + `severity` are pulled (no `problem`/`suggested_fix`). Site-wide findings (`page_slug` null) are excluded server-side, so they never badge a row. Multi-row read → plain `await` (no `.maybeSingle()`), per the rule.
2. **Reduce:** into `Map<slug, { count, topSeverity }>`. `topSeverity` is the highest severity present (high > medium > low) via `SEVERITY_RANK`.
3. **Attach:** in `makeRow`, `needsUpdate: !!f`, `findingCount: f?.count`, `findingSeverity: f?.topSeverity`. Rows with no findings get `needsUpdate=false` and undefined count/severity. Because every Pages-tab row flows through `makeRow` keyed on its `slug`, core/static/service_area/blog rows all badge uniformly.
4. **Render:** a pill `Needs update (n)` shown beneath the existing `✓ Configured` / `⚠ Missing` pill, in a `flex-col gap-1` cell so both can show. Severity colors (bordered, to stay visually distinct from the solid Configured/Missing pills):
   - high → `red-50 / red-700 / border-red-300`
   - medium → `amber-50 / amber-700 / border-amber-300`
   - low → `slate-50 / slate-600 / border-slate-300`

## Constraint compliance

- ✅ **No tier gating** — badge renders for every tenant/tier (no `FeatureGate` wrapping; it sits inside the existing `minTier={2}` SEO tab gate only because the whole tab already is — unchanged from before).
- ✅ **No `suggested_fix` / `problem`** read or displayed — presence + severity + count only.
- ✅ **Additive display only** — search and the four existing filters (type/status/SEO) are untouched; the badge is not a hard filter and hides no rows.
- ✅ Did **not** touch the report iframe viewer, the edge function, or `report_findings` writes.
- ✅ Files <200 lines (SeoPagesTab 173, useSeoTab 198, seoTypes 89). Vite build green; SEOTab chunk 41 kB, main index 270 kB — under the 450 kB cap.
- ✅ `.not('page_slug','is',null)` filters site-wide findings; `.maybeSingle()` rule held (n/a — this is a list read).

## Join verified against live data (Dang tenant `1611b16f…`)

- 20 distinct page-scoped slugs have open findings; **all 20 resolve to a real Pages-tab row** (every one exists in `page_content`) — confirmed by SQL cross-check. So each badges.
- 3 site-wide findings (`page_slug` null) exist and are correctly excluded by the query → they do not badge or break any row.

## Flag (out of scope — not changed here)

The task's QA sample expected legal pages (Privacy/Terms/SMS Terms) to be clean with no badge. Live data shows each currently has **1 low-severity** open finding (likewise `accessibility`), so they **will** badge. The badge faithfully reflects `report_findings`; the likely source is the generator's "all images empty" LOW rule, which is not suppressed for legal slugs (`NON_SERVICE_SLUGS` covers only home/about/contact/quote/faq/blog). Changing that is an edge-function concern, explicitly out of scope for this PR — flagging for a later session.
