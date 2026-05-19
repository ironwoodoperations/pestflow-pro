# PestFlow Pro — S228 Handoff (Shipped)

**Session:** S228 — Admin surface cleanup (dashboard redesign + Reports prune + SEO Connect prune)
**Date:** 2026-05-19
**Branch:** s228-admin-surface-cleanup
**PR:** #91 (ready for review, awaiting Scott merge)
**CI:** faithful local gate green — tsc --noEmit (0), eslint src --max-warnings 200 (0 errors / 200 warnings), vite build (0)

One-line: pruned the dead/redundant admin tiles and turned the two dashboard click-out cards into real-data mini-tiles sourced from existing `seo_runs` / `zernio_runs` — pure frontend, no backend changes.

---

## What shipped

| Phase | Area | Change | Files |
|---|---|---|---|
| 2 | Dashboard | "SEO Performance" click-out → real-data mini-tile (tracked-keyword count, best position, last refresh) sourced from `seo_runs` via existing `useSeoRuns` | `src/components/admin/dashboard/DashboardSeoWidget.tsx` |
| 2 | Dashboard | "Social Media" click-out → real-data mini-tile (engagement + reach + last refresh) sourced from `zernio_runs` via existing `useZernioRuns` | `src/components/admin/dashboard/DashboardSocialWidget.tsx` |
| 2 | Dashboard | Removed Recent Leads list; Leads Per Month now full-width; pruned dead `recentLeads`/`statusBadge` | `src/components/admin/dashboard/DashboardHome.tsx` |
| 2-fix | Dashboard | Hoisted mini-tile `Card` to module scope (`react/no-unstable-nested-components` — was failing CI lint) | both widgets |
| 3 | Reports | Removed the entire "Advanced Analytics" section (header + both charts) | `src/components/admin/ReportsTab.tsx` |
| 3 | Reports | Deleted `LeadSourceChart.tsx` (single-consumer, fully orphaned) | `src/components/admin/reports/LeadSourceChart.tsx` (deleted) |
| 3 | Reports | Removed `SocialVolumeChart` usage from Reports only — **file kept** (shared with `social/SocialAnalyticsTab`) | `ReportsTab.tsx` |
| 3 | Reports→Blog | Split Blog Analytics out of `SocialSeoReport`; relocated to top of Blog tab | `reports/SocialSeoReport.tsx`, `BlogTab.tsx` |
| 4 | SEO Connect | Removed GSC, GA4, Ahrefs, Bing cards; kept PageSpeed + S227 SEO Analytics tile; Vercel downgraded to a clear working link-out | `seo/SeoConnectTab.tsx` |
| 4 | SEO Connect | Pruned orphaned `SearchConsoleMockPreview`/`GA4MockPreview` (+ dead helper consts); `SeoConnectTab` now prop-less; trimmed dead `connect*` destructuring | `seo/SeoConnectPreviews.tsx`, `seo/SeoConnectTab.tsx`, `SEOTab.tsx` |

Commits: `360069a` (Phase 1 audit) · `6e7a936` + `8c88ff7` (Phase 2) · `bd66789` (Phase 3) · `2e979fc` (Phase 4).

Kept untouched (conversion-tile keep-decision, kickoff revision): Dashboard 4 lead stat cards + Quick Links; Reports `ReportsStatCards`, Lead Status panel, `LeadFunnel`, SEO Coverage, S227 SeoAnalyticsTile.

---

## Real data confirmed (Dang, via Supabase MCP)

- **Dashboard SEO mini-tile:** 20 tracked keywords · best position 27 · last refreshed 2026-05-18 17:32Z (from latest successful `seo_runs` rankings).
- **Dashboard Social mini-tile:** 515 engagement · 226 reach · across 3 platforms · last refreshed 2026-05-18 16:27Z (sum across `zernio_runs` latest success).

---

## Decisions / flags

**Vercel Analytics — DEFERRED to S229+ (standalone backlog, NOT folded into the OAuth pivot).**
4a investigation (time-boxed, ~2 doc queries): Vercel Web Analytics exposes **no public pull/query REST API**. The only programmatic export is **Log Drains** — a raw `vercel.analytics.v2` event NDJSON firehose you self-host, ingest, store, and aggregate. Auth is Bearer team token (not OAuth) but moot — there is no aggregate endpoint. Lift = a full ingestion pipeline (drain receiver edge fn + new `vercel_analytics` table + rollup cron + tile), which is **not** the S227 single-edge-fn-pull clone and violates S228's "no new backend." It is a *logging pipeline*, not a connector — so it is explicitly **NOT** part of the S230/S231 OAuth-pivot work; it is its own architecture session. The SEO Connect Vercel card is downgraded to "Active on Vercel / View detailed metrics" with a working dashboard link.

**Orphaned `settings.integrations.*` keys (NO DB delete):** `google_search_console_url`, `google_analytics_id`. These go dark after the GSC/GA4 card removals — no reader remains. Ahrefs/Bing were static cards with no settings reads → no additional orphans. Confirmed orphan set = exactly 2.

**Social mini-tile followers omitted (not "—"):** `zernio_runs.followers` is NULL on all platforms (the S229 bug). The followers slot is intentionally omitted for a clean two-metric design (engagement + reach, both populate today). S229 backfills followers automatically — **zero S228 rework** needed regardless.

**Blog Analytics minTier 3 → 2 (intentional, not a regression):** old home was the `minTier={3}` "Advanced Reports & Trends" wrapper; new home (Blog tab) is `minTier={2}`. Basic-tier customers who blog should see their blog health — a genuine improvement, confirmed with Scott. ContentTab (the kickoff's nominal "Content section") is a master-detail page editor with no analytics slot; Blog tab is the semantically correct home (BlogAnalyticsSection's own empty state points users "to the Blog tab").

---

## Edge functions / tables / cron

**No changes this session.** Pure frontend. `seo-analytics`, `zernio-analytics`, `pagespeed-proxy` edge fns and `seo_runs`/`zernio_runs`/`seo_meta` tables untouched. No migrations, no cron edits.

---

## Verification matrix result

| # | Check | Result |
|---|---|---|
| 1 | tsc --noEmit (full project, deps installed) | ✅ exit 0 |
| 2 | eslint src --ext .ts,.tsx --max-warnings 200 (ci-job cmd) | ✅ exit 0 — 0 errors / 200 warnings (== ceiling) |
| 3 | npm run lint / eslint . (Validate-job cmd) | ✅ 0 errors |
| 4 | vite build | ✅ exit 0 |
| 5 | Dangling-ref sweep (`LeadSourceChart`, `SearchConsoleMockPreview`, `GA4MockPreview`) | ✅ 0 refs |
| 6 | `SocialVolumeChart` consumers | ✅ social tab only (file correctly kept) |
| 7 | `BlogAnalyticsSection` consumers | ✅ BlogTab only (correctly relocated) |
| 8 | Shell/app files touched | ✅ none — BL canary structurally unaffected |
| 9 | Dashboard mini-tile data (MCP cross-check) | ✅ 20kw/pos27, 515eng/226reach |
| 10 | Browser pass (Dashboard / Reports / Blog / SEO Connect / BL canary) | ⚠️ Pending — Scott post-merge (harness #5) |

Cell 10 requires a browser session signed in as Dang admin (deferred to Scott per harness limitation #5). No code changes pending.

---

## Key learnings

1. **Kickoff "stat-row vs Row-3" ambiguity (F1) — procedural lesson.** The kickoff's "Top stat row → REPLACE SEO Performance / Social Media" did not match code reality (the stat row was 4 *lead* cards; SEO/Social were *separate Row-3 widgets*). Caught at the Phase 1 death audit and surfaced as a blocking flag before any code. **Lesson for future kickoff authoring:** describe target-state changes against actual component boundaries, not a mental screenshot model — the death audit is the safety net but an accurate kickoff saves a stop-point round trip.
2. **Vercel "no aggregate API" capability gap — architectural insight.** Vercel Web Analytics has no read API; only a Log Drains event firehose. Any future "Vercel analytics in PFP" work is an ingestion-pipeline session, not a connector clone. Preserved here so it isn't re-investigated cold.

---

## On the horizon

- **S229 (next):** Zernio follower + GBP fix in `zernio-analytics` edge fn — restores `followers` + `gbp` block. Kickoff authored this session: `docs/audits/pestflow-pro-kickoff-S229.md`.
- **S230:** OAuth-based GSC integration (testing mode — replaces dead service-account path).
- **S231:** OAuth-based GA4 integration (testing mode; depends on shell GA4 tracking script).
- **Standalone backlog (NOT OAuth pivot):**
  - S227 Phase 8 — admin onboarding UI for SEO Analytics seeds.
  - Vercel Analytics drain-receiver pipeline — drain receiver edge fn + `vercel_analytics` table + rollup cron + tile (architecture session).
  - v94 engineering items (`seo_last_runs` hotspot, cron-overlap guard, per-(tenant,kind) freshness) — in `docs/audits/s227-validator-decisions.md`.

**Before merging #91:** Scott to browser-verify the Dashboard / Reports / Blog / SEO Connect surfaces + BL canary per the matrix cell 10 list.
