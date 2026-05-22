# S236 — Outscraper Integration Repo Cleanup: Kickoff

**Session:** S236  
**Date:** 2026-05-21  
**Branch:** feat/s236-outscraper-cleanup  
**Scope:** Repo hygiene only — no schema changes, no edge function behavior changes, no new features

---

## Context

S235 shipped the Outscraper Google review sync integration. The feature is **verified working** (Dang: 46 reviews imported, cron scheduled, vault secret set). However, the deployed edge function v3 source diverged from the repo because CC Web's reported deploys in S235 did not actually update the Supabase platform. Hotfixes were applied via Supabase MCP after the fact.

PR #114 (feat/s235-outscraper-reviews) was merged to main before S236 ran, carrying the broken v1 source. This session corrects the record.

---

## Tasks

### Task 1 — Sync v3 edge function source to repo

Replace `supabase/functions/outscraper-reviews/index.ts` with the canonical v3 source retrieved via `get_edge_function` MCP.

**Key v3 changes vs v1 (already deployed — no platform deploy needed):**
- Endpoint: `/maps/reviews-v2` (was: `/maps/reviews-v3`)
- Param: `reviewsLimit` (was: `limit`)
- Identifier priority: FID → place_id → CID (was: CID → FID → place_id)
- Response shape handling: tries all three Outscraper nesting variants
- Timeout: 60s (was: 30s)
- Self-contained JS (no `_shared/` imports — MCP bundler compatible)

**⚠ DO NOT redeploy.** v3 is already live and working. This task is repo-only.

### Task 2 — Remove "Powered by Outscraper" attribution from TestimonialsTab

In `src/components/admin/TestimonialsTab.tsx`, the Auto-Sync panel description reads:

> Powered by Outscraper · Auto-refresh: {cadence}

Remove the "Powered by Outscraper ·" prefix. Keep only the cadence label.

### Task 3 — PR #114 note

PR #114 was already **merged** when S236 ran (state: MERGED). No close action needed. S236 opens a new PR (#115) with the v3 source sync and attribution fix.

### Task 4 — S235 handoff doc

Write `docs/audits/s235-outscraper-reviews-handoff.md` documenting:
- What was built in S235
- The v1→v3 divergence and what each version fixed
- Verified state at close (46 reviews, cron, vault, secrets)
- What S236 corrects

### Task 5 — This kickoff doc

Write this file (`docs/audits/s236-outscraper-cleanup-kickoff.md`).

---

## Out of scope (do not touch)

- Edge function behavior, auth, or deploy (already correct in Supabase)
- Rate-limit logic or cron schedule
- Vault secret (`outscraper_cron_internal_secret`)
- `OUTSCRAPER_API_KEY` Edge Function Secret
- Testimonials table, schema, or any existing data
- Migration files (already applied and correct)
- Any other edge function

---

## Acceptance criteria

- `supabase/functions/outscraper-reviews/index.ts` matches v3 source from `get_edge_function`
- TestimonialsTab Auto-Sync panel description: no "Powered by Outscraper" text
- `supabase/config.toml` has `[functions.outscraper-reviews] verify_jwt = false` (already present — verify only)
- `docs/migrations/s235-outscraper-reviews-setup.sql` present and annotated apply-as-doc (already present — verify only)
- S235 handoff doc present at `docs/audits/s235-outscraper-reviews-handoff.md`
- Build passes (`npm run build`)
- PR open against main, Scott reviews and merges manually

---

## Files changed in S236

| File | Change |
|------|--------|
| `supabase/functions/outscraper-reviews/index.ts` | Overwritten with canonical v3 source |
| `src/components/admin/TestimonialsTab.tsx` | Removed "Powered by Outscraper ·" from Auto-Sync panel |
| `docs/audits/s235-outscraper-reviews-handoff.md` | New — S235 handoff |
| `docs/audits/s236-outscraper-cleanup-kickoff.md` | New — this file |

No migration. No schema changes. No Supabase deploy needed.
