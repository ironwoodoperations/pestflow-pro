# REVIEW — S260-4 (v2): report link→text fix + retire no-photos rule

**Branch:** `feat/s260-4-report-link-text-drop-photos-rule`
**File:** `supabase/functions/generate-monthly-report/index.ts` (only file changed)
**Deploy:** operator redeploys via MCP + regenerates after merge.

---

## Change 1 — "Fix it here" link → plain text

The report renders inside a **bare-sandbox iframe** (S260-1), which cannot navigate, so the `<a href>` "Fix it here →" link was dead. Replaced the per-finding anchor with a muted plain-text hint:

```diff
- `<a class="fix" href="${escapeHtml(f.admin_deeplink)}">Fix it here →</a>`
+ `<p class="fixhint">Open your SEO → Pages tab and look for the page marked "Needs update."</p>`
```

- CSS: `.fix` (link styling) → `.fixhint` (muted grey italic, `#6b7280`).
- `admin_deeplink` is left in the `Finding` shape (harmless) — only the rendered link is removed. This pairs with S260-3: the report points the owner at the new per-page "Needs update" badges instead of a broken link.

## Change 2 — remove the "all images empty" / no-photos rule

Deleted the CONTENT-section rule that flagged a page when all five `page_content` image columns were empty:

```diff
- const imagesAllEmpty = !p.image_url && !p.page_hero_image_url && !p.image_1_url && !p.image_2_url && !p.image_3_url
- if (imagesAllEmpty && !NON_SERVICE_SLUGS.has(slug)) {
-   findings.push({ ... "has no photos. Real photos of your team and work build trust..." ... })
- }
```

**Rationale:** image presence isn't fully represented in `page_content` — service-page hero images are template-driven and live outside the DB. The rule fired false positives on pages that visibly have photos (verified against the live site), accounting for 17 of 28 current findings. Telling an owner to "add photos" to a page that already has a great photo destroys trust in the accurate findings.

- Also removed the now-unused `NON_SERVICE_SLUGS` constant (grep-confirmed it was referenced only by its definition and this deleted rule).
- The intro-text "very little intro text" content rule is **kept** — it reads `page_content.intro`, a real column.

## Scope / safety

- ✅ No other detection rule touched (meta, keyword, intro-text content, engagement, technical all unchanged). The `content` `ransRules.push('content')` log entry stays — intro-text still runs.
- ✅ Did **not** touch narration, the RPC persist call, the viewer, or the iframe. No scripts added to the iframe.
- ✅ `verify_jwt=false` stays pinned in `config.toml` (not modified here).
- ✅ Net diff: −9 / +3, one file. `admin_deeplink` field retained (no type churn).
- Note: `page_content`'s image columns are still in the SELECT (line ~121) — left as-is to avoid touching the shared query that feeds the intro rule; the columns are simply no longer read. Harmless.

## Expected post-deploy (operator verifies)

- Rendered HTML has **no `<a class="fix">` anchor** and **no finding containing "no photos"**.
- Regenerated Dang report: findings drop ~28 → ~11; service + legal pages lose their "Needs update" badge; report shows the plain-text Pages-tab hint.
