# PestFlow Pro — S229 Handoff (Shipped)

**Session:** S229 — Zernio analytics edge fn: followers fix + GBP coverage via accounts[]
**Date:** 2026-05-19
**Branch:** feat/s229-zernio-followers-fix
**PR:** #93 (ready for review, awaiting Scott merge)
**CI:** faithful local gate green — tsc --noEmit (0 errors), eslint src/ (0 errors / 164 warnings, all pre-existing), npm run build (exit 0)

One-line: patched `zernio-analytics/index.ts` to iterate `accounts[]` from the Zernio response, surfacing all connected platforms in `data` (including non-posting ones) and wiring `followers` from `acct.followersCount` — engagement/reach computation from `posts[]` left untouched.

---

## What shipped

| File | Change |
|---|---|
| `supabase/functions/zernio-analytics/index.ts` | (1) Type widened: `followers: null` → `followers: number \| null` in the normalized data shape. (2) S229 accounts[] block added after the posts normalization loop — iterates `analyticsBody.accounts[]`, seeds any platform absent from `data` (connected but no posts in window) with `{ followers: null, engagement: 0, reach: 0 }`, then sets `followers = acct.followersCount ?? null`. Additive only — no engagement/reach logic touched. |

Commits: `69ab124` (task[1]: sync repo to deployed v8 — Phase 4 codebase-is-truth resolution).

---

## Two bugs documented

### Bug 1 (Primary): followers hardcoded null on every normalization branch

The pre-S229 normalization loop built `data` from `posts[]` only, with `followers: null` hardcoded in all three branches (youtube, google_business, and the general else). The `accounts[]` array in the Zernio response payload — which contains per-account metadata including `followersCount` — was never read. As a result, `followers` was always `null` in `zernio_runs.data` regardless of what Zernio returned.

**Fix:** After the posts normalization loop, iterate `accounts[]` and set `data[key].followers = acct.followersCount ?? null`. The type annotation was simultaneously widened from `followers: null` to `followers: number | null` so TypeScript accepts real counts.

### Bug 2 (Secondary): non-posting platforms absent from data entirely

`data` was built exclusively from `posts[]`: only platforms that had at least one post in the 30-day window appeared as keys in `data`. Platforms with a connected account but no posts (e.g., Google Business Profile, which Dang doesn't actively post to via Zernio) were silently omitted — not even a zero-row.

This violated the S225 contract (`{fb, ig, yt, gbp}` in `data`) and produced confusing frontend behavior: the tile would show 3 platforms instead of 4 with no explanation.

**Fix:** The accounts[] iteration in the S229 block seeds `data[key] = { followers: null, engagement: 0, reach: 0 }` for any platform key that doesn't already exist in `data` before setting followers. Both bugs fixed by the same accounts[] pass.

---

## GBP followers: null at source (expected, not a bug)

After the S229 fix, `google_business.followers` in `zernio_runs.data` is `null`. This is correct: Zernio's `accounts[]` returns `followersCount: null` for the `googlebusiness` account — GBP follower counts are not available via Zernio's API at source. The `SocialAnalyticsTile` renders `null` followers as `–`, which is the correct UX. A direct GBP API integration path is tracked as a new backlog item (see todo v97).

---

## Deterministic verification result (Dang, data_raw replay)

| Platform | followers | engagement | reach |
|---|---|---|---|
| facebook | null | 350 | 473 |
| instagram | 57 | 32 | 174 |
| youtube | null | 4 | 61 |
| google_business | null | 0 | 0 |

facebook reach=0 is a known platform-level behavior (Facebook withholds reach for pages below threshold — not a code bug). GBP engagement=0 / reach=0 because Dang has no GBP posts in the 30-day window.

---

## Codebase-is-truth

Phase 4 re-check confirmed: deployed v8 was **ahead of repo** (Phase 2 deployed to Supabase before the feature branch was opened). The Phase 4 resolution synced the working file to byte-match deployed v8:
- `zernio-analytics/index.ts`: local now == deployed v8 ✓
- `_shared/auth/requireTenantUser.ts`: byte-identical (no change) ✓
- `_shared/cors.ts`: byte-identical (no change) ✓

Deployed version: still v8 (no out-of-band redeploy since Phase 2 confirmation).

---

## Consumer tolerance (Phase 3 CC-side verification)

| Consumer | Check | Result |
|---|---|---|
| `SocialAnalyticsTile` `StatPill` | Accepts `number \| null \| undefined`; renders `–` for null, `.toLocaleString()` for number | Safe on both paths ✓ |
| `DashboardSocialWidget` aggregation | Sums `engagement ?? 0` + `reach ?? 0` only; `followers` never read | GBP zeros don't affect totals ✓ |
| `ZernioPlatformStats` type | `followers?: number \| null` — no consumer force-casts to `number` without null guard | Type widening safe ✓ |

---

## CI gate (Phase 4)

| Check | Result |
|---|---|
| BL canary (`git diff --name-only origin/main..HEAD -- src/shells app`) | Empty — no shell files touched ✓ |
| `tsc --noEmit` | Exit 0 ✓ |
| `eslint src/` | 0 errors / 164 warnings (pre-existing ceiling) ✓ |
| `npm run build` | Exit 0 ✓ |

---

## Browser checks (Scott, post-merge)

1. Click "Run Check Now" in Dang admin → Social tab — verify fresh `zernio_runs.data` matches deterministic preview above
2. Confirm `SocialAnalyticsTile` renders 4 rows (facebook / instagram / youtube / google_business) with `–` in Followers column for all platforms where null
3. Confirm Dashboard Social mini-tile total (engagement + reach, across N platforms) is unchanged — GBP zeros add nothing to the sum
4. Confirm `instagram.followers = 57` renders as a number (not `–`) once a fresh post-S229 run is stored — this is the primary bug regression test

---

## On the horizon

- **S230 (next):** OAuth-based GSC integration (testing mode — replaces dead service-account path). Kickoff authored this session: `docs/audits/pestflow-pro-kickoff-S230.md`.
- **S231:** OAuth-based GA4 integration (testing mode; depends on shell GA4 tracking script; reuses S230 OAuth client).
- **S227 Phase 8:** Admin onboarding UI for SEO Analytics seeds (keywords, competitors, target_domain override).
- **Vercel Analytics drain-receiver pipeline:** Standalone architecture session — drain receiver edge fn + `vercel_analytics` table + rollup cron + tile (not OAuth pivot).
- **GBP follower counts — new backlog:** Direct GBP API integration for follower counts. Zernio returns `followersCount: null` for `googlebusiness` at source; real GBP followers require a separate Google Business Profile API call. Priority 4, ~1 session, contingent on Dang or future tenant using GBP meaningfully. Tracked in todo v97.
