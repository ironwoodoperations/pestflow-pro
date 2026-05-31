# PROJECT_MANIFEST — PestFlow Pro

**Framework Version: Ironwood v3.1** — installed 2026-05-16
**Workflow:** branch + PR + manual merge (see GIT_RULES.md)
**Last Updated:** 2026-05-16 by framework upgrade session

> ⚠️ This file is preserved from the S117 (April 2026) snapshot with the v3.1
> upgrade banner appended above. Session log entries S118–S222 are not
> reflected here yet; the working state of record between this manifest
> being updated is the SuperClawed session handoff thread.

---

## Status

| Field | Value |
|-------|-------|
| Current Phase | **Operate** — active feature additions on live multi-tenant platform |
| Sprint Goal | Framework v3.1 upgrade (this session). Next sprint: Reports tab GA4/GSC/PageSpeed wiring (per S222 plan). |
| Sprint Status | On Track |
| Blocking Risks | Stripe live mode not yet cut over — no real billing active |
| Next Decision Needed | Reports tab build — GCP project org parent (Cloud Identity vs user-owned), in flight at start of S222 |
| Recommended Next Owner | Claude Code Web (per kickoff from Scott) |

---

## What the App Is

PestFlow Pro is a white-label SaaS platform for pest control companies.
Scott (Ironwood Operations Group) sells it 1-on-1. Clients never self-serve.

**Two surfaces:**
- `/ironwood` — Scott's CRM (pipeline, prospects, reports, integrations, team, support inbox)
- `/admin` — Client dashboard (content, SEO, blog, social, testimonials, locations, reports, CRM, team, billing, support tickets, settings)

---

## Active Tenants

| Name | Slug | Template | Status |
|------|------|----------|--------|
| PestFlow Pro (demo) | pestflow-pro | modern-pro | Live — Demo |
| Cypress Creek Pest Control | cypress-creek-pest-control | modern-pro | Live — Active |
| Dang Pest Control | dang | dang (custom) | Live — Active (paying customer) |

---

## Critical Constants

```
Live URL:         https://pestflowpro.com
Ironwood Ops:     https://pestflowpro.com/ironwood
Demo Admin:       admin@pestflowpro.com / pf123demo
Demo Tenant ID:   9215b06b-3eb5-49a1-a16e-7ff214bf6783
Supabase ID:      biezzykcgzkrwdgqpsar
GitHub:           https://github.com/ironwoodoperations/pestflow-pro
Dev server:       doppler run -- npm run dev → localhost:8080
Model:            claude-sonnet-4-6 (ALWAYS — never any other string)
```

---

## Open Items

| # | Item | Severity | Owner | Notes |
|---|------|----------|-------|-------|
| 1 | **Stripe live mode cutover** | 🔴 BLOCKING | Scott (manual) | Swap keys in Doppler + Vercel, register webhook. |
| 2 | **Kirk DNS → Dang custom domain** | 🟡 High | Kirk + Scott | `verified = false` in tenant_domains. |
| 3 | **Reports tab build — Google APIs wiring** | 🟡 High | CC Web | GA4, GSC, PageSpeed via service account. 10-step plan, ~40-50h CC Web work. |
| 4 | **GCP migration to Ironwood Workspace** | 🟡 High | Scott | In-flight at start of S222. |
| 5 | **Framework v3.1 upgrade** | 🟢 In Progress | This session | Branch+PR+hooks workflow upgrade into pestflow-pro |

---

## Decisions Log

| Date | Decision | Made By | Rationale |
|------|----------|---------|-----------|
| 2026-05-16 | Upgrade pestflow-pro to Ironwood Framework v3.1 with manual-merge default | Scott | Paying customer in production — keep manual review gate |
| 2026-05-16 | Service account (not OAuth) for Reports tab Google API auth | Scott + validator gate | Avoids 4-6 week sensitive-scope verification |
| 2026-04-11 | PROJECT_MANIFEST.md replaces session-context .md files | Scott | Process standard |
| 2026-04-10 | Mailboxes: Resend sends from noreply@pestflow.ai; reply-to varies by type | Scott | (since deprecated — Google Workspace) |
| 2026-04-10 | Dang custom domain verified=false until Kirk confirms DNS | Scott | No premature DNS flip |
| 2026-03-xx | Archive before delete — soft-archive pattern | Scott | No hard deletes without archive step |

---

## Session Log

| Session | Date | Key Completions |
|---------|------|-----------------|
| S1–S107 | Mar 2026 | Full platform build, all 4 shells, Dang shell, multi-tenancy |
| S108–S117 | Mar–Apr 2026 | Marketing landing, bundle.social, SMS hotfixes, Dang content restore, custom domain routing, mailbox wiring, support ticket system, 5 HTML email templates, pg_cron scheduled posts |
| S118–S221 | Apr–May 2026 | (Manifest backfill pending — see SuperClawed session handoff thread. Major work includes Next.js shell ports, S142.7 image schema rename, S171 Stripe automation removal, S203 demo tenant seeds, S209 legal apex routes, S212 security sprint, S213c-B 27-fn edge audit, S217 webhook auto-provision LOCKED, S218 Zernio image attach fix, S219 LinkedIn+TikTok composer, S220 provision-tenant v72, S221 provisioning observability suite PR #80) |
| S222 (in progress) | 2026-05-16 | Reports tab Google APIs planning + GCP migration to Ironwood Workspace (paused mid-session for framework upgrade) |
| Framework v3.1 upgrade | 2026-05-16 | This session. Branch: `chore/upgrade-framework-v3-1`. Adds `.claude/hooks` (require-pr, protect-files, session-end), `.claude/commands` (office-hours, investigate, qa, review, ship), `.github/workflows/ci.yml` (Validate gate), `GIT_RULES.md`, PR template. Merges settings.json: preserves curated permissions, removes `Bash(git push origin main)`, adds hooks block. Customizes protect-files.sh for env/doppler/migrations/auth-shared/provisioning/stripe/RLS paths. Auto-merge available at repo level but disabled per-PR by default. |

---

## Session Boot Command (v3.1)

```bash
doppler run -- claude --dangerously-skip-permissions \
  "Pre-flight: read CLAUDE.md, GIT_RULES.md, SKILL.md, PROJECT_MANIFEST.md.
   Read the last 3 Session Log entries in PROJECT_MANIFEST.md.
   Verify .claude/settings.json exists and require-pr hook is active.
   State: Current Phase, Task ID, current Branch (or to-be-created),
   proposed plan in 3–5 bullets.
   If scope is unclear: invoke /office-hours.
   Do not touch any file until I confirm the plan."
```

---

## Key File Paths (S117 state — confirmed still valid for non-Next.js admin paths)

```
src/pages/admin/Dashboard.tsx          ← Client admin shell
src/pages/IronwoodOps.tsx              ← Ironwood CRM shell
src/components/admin/SupportTab.tsx    ← Support tickets (client side)
src/components/ironwood/SupportPanel.tsx ← Support inbox (Scott side)
src/pages/CustomPage.tsx               ← Public custom page renderer
src/pages/SlugRouter.tsx               ← Routes /:slug
src/components/admin/ContentTab.tsx    ← Content editor + New Page modal
src/shells/dang/                       ← Full custom Dang shell
src/lib/shellThemes.ts                 ← CSS custom property shell definitions
supabase/functions/provision-tenant/   ← Full tenant provisioning (PROTECTED)
supabase/functions/ironwood-provision/ ← JWT wrapper (PROTECTED)
supabase/functions/stripe-webhook/     ← (PROTECTED)
supabase/functions/create-checkout-session/ ← (PROTECTED)
supabase/functions/_shared/auth/       ← (PROTECTED) Shared auth modules (C2 pattern)
```

---
## Session — 2026-05-17 17:07 UTC
- Branch: `claude/pagespeed-tile-wiring-PXGkH`
- Commit: `f750fe0` — s224: PageSpeed tile wiring (both surfaces)
- Author: Claude
- Files changed:
  - docs/migrations/s224-pagespeed-runs-rollback.sql
  - docs/migrations/s224-pagespeed-runs.sql
  - src/components/admin/ReportsTab.tsx
  - src/components/admin/reports/SitePerformanceTile.tsx
  - src/components/admin/seo/SeoConnectPreviews.tsx
  - src/components/admin/seo/SeoConnectTab.tsx
  - src/components/admin/seo/pageSpeedShared.ts
  - src/hooks/usePageSpeedRuns.ts
  - supabase/functions/_shared/cors.ts
  - supabase/functions/pagespeed-proxy/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-17 17:07 UTC
- Branch: `claude/pagespeed-tile-wiring-PXGkH`
- Commit: `45a6c8c` — s224: session manifest log + build info
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
  - tsconfig.tsbuildinfo
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-17 17:18 UTC
- Branch: `claude/pagespeed-tile-wiring-PXGkH`
- Commit: `01e4bdd` — s224: manifest session log
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-17 20:32 UTC
- Branch: `s225-zernio-analytics`
- Commit: `0e79a4d` — fix: break session-end manifest churn loop (#83)
- Author: csdevore2
- Files changed:
  - .claude/hooks/session-end.sh
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-17 21:42 UTC
- Branch: `s225-zernio-analytics`
- Commit: `f72f8b6` — task: S225 — Zernio social-analytics surface (skeleton)
- Author: Claude
- Files changed:
  - src/components/admin/ReportsTab.tsx
  - src/components/admin/reports/SocialAnalyticsTile.tsx
  - src/hooks/useZernioRuns.ts
  - supabase/functions/zernio-analytics/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-17 21:42 UTC
- Branch: `s225-zernio-analytics`
- Commit: `44006d0` — chore: S225 session log + build info
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
  - tsconfig.tsbuildinfo
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-17 21:59 UTC
- Branch: `s225-zernio-analytics`
- Commit: `c92a507` — task: S225 — consumer #2, Social page analytics widget
- Author: Claude
- Files changed:
  - src/components/admin/SocialTab.tsx
  - src/components/admin/social/useSocialData.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 02:30 UTC
- Branch: `main`
- Commit: `04e15d0` — S225: Zernio social-analytics surface (skeleton) (#84)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.md
  - src/components/admin/ReportsTab.tsx
  - src/components/admin/SocialTab.tsx
  - src/components/admin/reports/SocialAnalyticsTile.tsx
  - src/components/admin/social/useSocialData.ts
  - src/hooks/useZernioRuns.ts
  - supabase/functions/zernio-analytics/index.ts
  - tsconfig.tsbuildinfo
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 02:43 UTC
- Branch: `main`
- Commit: `e2ae04a` — chore: align framework to current revision (subagents + cleanup) (#86)
- Author: csdevore2
- Files changed:
  - .claude/agents/planner.md
  - .claude/agents/security-reviewer.md
  - .gitignore
  - IRONWOOD_MASTER_CONTEXT_v7_LEGACY.md
  - IRONWOOD_OPS_PROCESS_STARTER_v2.md
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 03:03 UTC
- Branch: `s226-zernio-api-wiring`
- Commit: `7220c94` — docs(s226): add S226 kickoff brief — wire Zernio Analytics API
- Author: csdevore2
- Files changed:
  - docs/audits/s226-kickoff.txt
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 15:04 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `0483f6a` — S227 Step 1: death audit — schema divergence + collisions surfaced
- Author: Claude
- Files changed:
  - docs/audits/s227-death-audit.txt
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 15:27 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `cf44690` — S227 Step2+Phase1: validator decisions + seo_runs migration (applied via MCP)
- Author: Claude
- Files changed:
  - docs/audits/s227-validator-decisions.md
  - docs/migrations/s227-seo-runs-rollback.sql
  - docs/migrations/s227-seo-runs.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 15:27 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `5d14423` — chore: session manifest log entries for S227 Step 1 + Phase 1
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 15:54 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `5066060` — S227 Phase 3: weekly Run Now rate-limit RPCs + 429 gate in seo-analytics (deployed v6)
- Author: Claude
- Files changed:
  - docs/migrations/s227-seo-run-now-rpc-rollback.sql
  - docs/migrations/s227-seo-run-now-rpc.sql
  - supabase/functions/seo-analytics/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 15:55 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `076eabc` — chore: session manifest log entries for S227 Phase 2 + Phase 3
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 15:56 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `12faef2` — chore: session manifest log entry for S227 smoke re-test
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 16:10 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `4a1e289` — chore: session manifest log entry for S227 green smoke
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 16:28 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `032be2f` — S227 Phase 4: queue-pull cron dispatcher + normalize_tier (applied via MCP)
- Author: Claude
- Files changed:
  - docs/migrations/s227-seo-cron-rollback.sql
  - docs/migrations/s227-seo-cron.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 16:29 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `e171ba7` — chore: session manifest log entry for S227 Phase 4
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 16:34 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `36c17be` — S227 Phase 5: useSeoRuns hook (per-kind subtree, runNow with 429 handling)
- Author: Claude
- Files changed:
  - src/hooks/useSeoRuns.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 16:34 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `1ffb085` — chore: session manifest log entry for S227 Phase 5
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 17:06 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `0817edf` — S227 Phase 6: SeoAnalyticsTile component (3 sections, per-kind states, rate-limit-aware Run Now)
- Author: Claude
- Files changed:
  - src/components/admin/reports/SeoAnalyticsTile.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 17:06 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `bc5eed0` — chore: session manifest log entry for S227 Phase 6
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 17:35 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `aa357a8` — S227 Phase 6.5: fix domain_intersection semantics (competitor-gap), v94 backlog
- Author: Claude
- Files changed:
  - docs/audits/s227-validator-decisions.md
  - docs/migrations/s227-seo-runs.sql
  - supabase/functions/seo-analytics/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 17:35 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `47b8158` — chore: session manifest log entry for S227 Phase 6.5
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 18:15 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `4ab4e88` — S227 Phase 7: mount SeoAnalyticsTile on Reports tab + SEO Connect tab (both minTier=3)
- Author: Claude
- Files changed:
  - src/components/admin/ReportsTab.tsx
  - src/components/admin/seo/SeoConnectTab.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 18:15 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `eebf5f4` — chore: session manifest log entry for S227 Phase 7
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 18:26 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `8752fdd` — chore: session manifest log entry
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-18 18:38 UTC
- Branch: `claude/dataforseo-seo-analytics-Jja9a`
- Commit: `c47673b` — chore: session manifest log entry
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-19 17:23 UTC
- Branch: `main`
- Commit: `fcceded` — S231 Phase 0.5 — Admin UI cleanup round 2 (#96)
- Author: csdevore2
- Files changed:
  - src/components/admin/SEOTab.tsx
  - src/components/admin/SocialTab.tsx
  - src/components/admin/reports/SocialAnalyticsTile.tsx
  - src/components/admin/seo/SeoInsightsTab.tsx
  - src/components/admin/seo/SeoOverviewTab.tsx
- Next recommended action: Merge PR #97 (Phase 0.75 Reports restructure) + browser-pass, then proceed to S231 GA4 integration (PR 2)

---
## Session — 2026-05-19 (S231 Phase 0.75 + GA4 start) UTC
- Branch: `feat/reports-restructure-phase-0-75`
- PR: #97
- Author: Claude
- Files changed:
  - src/components/admin/ReportsTab.tsx (remove LeadFunnel, 2-col SEO/Social grid, Blog tile)
  - src/components/admin/reports/BlogAnalyticsTile.tsx (new — published count, last-30d count, most recent post; view tracking backlog)
  - src/components/admin/reports/SeoCoverageTile.tsx (extracted from SocialSeoReport)
  - src/components/admin/reports/SocialPostsTile.tsx (extracted from SocialSeoReport)
- Next recommended action: Scott merges PR #97 + browser-pass on dang.pestflowpro.ai/admin, then PR 2 (S231 GA4 OAuth integration) proceeds

---
## Session — 2026-05-19 18:25 UTC
- Branch: `feat/s231-ga4-integration`
- Commit: `2585c65` — chore: tsbuildinfo after S231 Phase 1 type-check
- Author: csdevore2
- PR: #99 (OPEN) — https://github.com/ironwoodoperations/pestflow-pro/pull/99
- Files changed:
  - tsconfig.tsbuildinfo
- Next recommended action: Phase 1 (feat/s231-ga4-integration PR #99) needs browser-pass. Phase 2-5 done on feat/s231-phase2-ga4-pipeline PR #100. Next: wait 24-48h for GA4 data, then manual token insert for Dang and full browser-pass (Phase 6-9).

---
## Session — 2026-05-19 (S231 Phase 2-5) UTC
- Branch: `feat/s231-phase2-ga4-pipeline`
- PR: #100 (OPEN) — https://github.com/ironwoodoperations/pestflow-pro/pull/100
- Author: Claude
- Files changed:
  - supabase/functions/ga4-analytics/index.ts (new — GA4 Data API, two calls, same auth pattern as S230)
  - docs/migrations/s231-ga4-runs.sql + rollback (applied via MCP as s231_ga4_runs)
  - docs/migrations/s231-ga4-cron.sql + rollback (applied via MCP as s231_ga4_cron)
  - src/hooks/useGa4Runs.ts (new — mirrors useGscRuns)
  - src/components/admin/seo/Ga4AnalyticsTile.tsx (new — 4 stat pills + channels + top pages)
  - src/components/admin/ReportsTab.tsx (Ga4AnalyticsTile mounted after Gsc, minTier=3)
  - src/components/admin/seo/SeoInsightsTab.tsx (Ga4AnalyticsTile mounted after Gsc, all tiers)
- Next recommended action: Scott merges PR #100. Full browser-pass blocked until GA4 tracking live 24-48h + manual token insert for Dang. Phase 1 PR #99 also awaiting merge + browser-pass.

---
## Session — 2026-05-19 21:44 UTC
- Branch: `feat/s232-analytics-hub-scaffold`
- Commit: `a376488` — task[s232-phase1]: analytics hub Phase 1 death audit / inventory
- Author: Claude
- Files changed:
  - docs/audits/s232-analytics-inventory.txt
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-20 13:51 UTC
- Branch: `feat/s232-analytics-hub-scaffold`
- Commit: `57517b0` — task[s232-phase2]: analytics hub accordion shell
- Author: Claude
- Files changed:
  - src/components/admin/ReportsTab.tsx
  - src/components/admin/analytics/AnalyticsHub.tsx
  - src/components/admin/analytics/AnalyticsSection.tsx
  - src/components/admin/analytics/sections/BlogSection.tsx
  - src/components/admin/analytics/sections/PerformanceSection.tsx
  - src/components/admin/analytics/sections/SEOSection.tsx
  - src/components/admin/analytics/sections/SocialSection.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-20 13:52 UTC
- Branch: `feat/s232-analytics-hub-scaffold`
- Commit: `6142037` — chore: S232 session manifest + build info
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
  - tsconfig.tsbuildinfo
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-20 14:03 UTC
- Branch: `feat/s232-analytics-hub-scaffold`
- Commit: `0ef45d5` — S232 Phase 2 hotfix: restore lead UI below Analytics Hub
- Author: Claude
- Files changed:
  - src/components/admin/ReportsTab.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-20 14:03 UTC
- Branch: `feat/s232-analytics-hub-scaffold`
- Commit: `15f7d8b` — chore: S232 Phase 2 hotfix manifest log
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-20 14:08 UTC
- Branch: `feat/s232-analytics-hub-scaffold`
- Commit: `7a538b6` — S232 Phase 2 hotfix: drop LeadFunnel mount (match main)
- Author: Claude
- Files changed:
  - src/components/admin/ReportsTab.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-20 15:43 UTC
- Branch: `docs/s233-phase1-placement`
- Commit: `4170b4f` — docs[s233-phase1]: analytics hub placement death-audit
- Author: csdevore2
- PR: #106 (OPEN) — https://github.com/ironwoodoperations/pestflow-pro/pull/106
- Files changed:
  - docs/audits/s233-phase1-placement.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-20 15:53 UTC
- Branch: `feat/s233-phase2-tile-relocation`
- Commit: `709a05b` — task[s233-phase2]: analytics hub tile relocation
- Author: csdevore2
- PR: #107 (OPEN) — https://github.com/ironwoodoperations/pestflow-pro/pull/107
- Files changed:
  - src/components/admin/ReportsTab.tsx
  - src/components/admin/analytics/sections/BlogSection.tsx
  - src/components/admin/analytics/sections/PerformanceSection.tsx
  - src/components/admin/analytics/sections/SEOSection.tsx
  - src/components/admin/analytics/sections/SocialSection.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-20 16:44 UTC
- Branch: `feat/s233-phase3-fallbacks-and-gate-drop`
- Commit: `c6970e7` — task[s233-phase3]: section fallback cards + outer gate drop
- Author: csdevore2
- PR: #108 (OPEN) — https://github.com/ironwoodoperations/pestflow-pro/pull/108
- Files changed:
  - src/components/admin/ReportsTab.tsx
  - src/components/admin/analytics/sections/BlogSection.tsx
  - src/components/admin/analytics/sections/PerformanceSection.tsx
  - src/components/admin/analytics/sections/SEOSection.tsx
  - src/components/admin/analytics/sections/SocialSection.tsx
  - src/components/common/LockedSectionCard.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-20 17:06 UTC
- Branch: `feat/s233-phase4-reports-to-analytics-rename`
- Commit: `22b25e9` — task[s233-phase4]: rename Reports tab to Analytics
- Author: csdevore2
- PR: #109 (OPEN) — https://github.com/ironwoodoperations/pestflow-pro/pull/109
- Files changed:
  - src/components/admin/ReportsTab.tsx
  - src/pages/admin/Dashboard.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-21 03:22 UTC
- Branch: `docs/s234-kickoff`
- Commit: `9bf826a` — docs[s234]: Wave 1 death audit — places API refactor
- Author: csdevore2
- PR: #112 (OPEN) — https://github.com/ironwoodoperations/pestflow-pro/pull/112
- Files changed:
  - docs/audits/s234-places-api-refactor-audit.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-21 03:39 UTC
- Branch: `docs/s234-kickoff`
- Commit: `861dc4e` — docs[s234]: Wave 2 spec (FINAL) + validator gate (PASS)
- Author: csdevore2
- PR: #112 (OPEN) — https://github.com/ironwoodoperations/pestflow-pro/pull/112
- Files changed:
  - docs/audits/s234-places-api-refactor-spec.md
  - docs/audits/s234-validator-gate.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-21 16:21 UTC
- Branch: `feat/s234-places-api-server-refactor`
- Commit: `0d84a05` — qa[s234]: QA report + edge fn v3 (SAB fallback query chain)
- Author: csdevore2
- PR: #113 (OPEN) — https://github.com/ironwoodoperations/pestflow-pro/pull/113
- Files changed:
  - QA_REPORT_S234.md
  - supabase/functions/places-reviews/index.ts
- Next recommended action: Scott must seed google_place_id for Dang manually (QA report Option B) to verify happy path, then merge #113.

---
## Session — 2026-05-21 (S235) UTC
- Branch: `feat/s235-outscraper-reviews`
- Commit: `93bf14f` — task[s235]: outscraper-reviews edge fn + migration + TestimonialsTab refresh panel
- Author: Claude
- PR: #114 (OPEN) — https://github.com/ironwoodoperations/pestflow-pro/pull/114
- Files changed:
  - docs/migrations/s235-outscraper-reviews-setup.sql (new)
  - docs/migrations/s235-outscraper-reviews-rollback.sql (new)
  - supabase/functions/outscraper-reviews/index.ts (new, deployed v1 via MCP)
  - supabase/config.toml (outscraper-reviews verify_jwt=false entry)
  - src/components/admin/TestimonialsTab.tsx (Google Reviews Auto-Sync panel)
  - PROJECT_MANIFEST.md
- Migration applied to production (MCP): testimonials_tenant_google_review_id_unique partial unique index, rate-limit-cleanup cron extended to 12h retention, outscraper_cron_dispatch() SECURITY DEFINER function, outscraper-daily-dispatch cron at 0 2 * * *
- Next recommended action: Scott must (1) create vault secret outscraper_cron_internal_secret via SQL Editor, (2) add OUTSCRAPER_API_KEY to edge fn secrets in Supabase Dashboard, (3) optionally add provision-tenant fire-and-forget block (blocked by protect-files hook — code snippet in PR #114 description), then merge #114 and test Refresh Now against Dang admin.

---
## Session — 2026-05-22 03:01 UTC
- Branch: `feat/s236-outscraper-cleanup`
- Commit: `28557cd` — task[s236]: sync outscraper-reviews v3 source + strip attribution text
- Author: csdevore2
- Files changed:
  - docs/audits/s235-outscraper-reviews-handoff.md
  - docs/audits/s236-outscraper-cleanup-kickoff.md
  - src/components/admin/TestimonialsTab.tsx
  - supabase/functions/outscraper-reviews/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-22 03:32 UTC
- Branch: `main`
- Commit: `8d2c315` — task[s235]: outscraper-reviews — automated Google review sync (#114)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.md
  - docs/migrations/s235-outscraper-reviews-rollback.sql
  - docs/migrations/s235-outscraper-reviews-setup.sql
  - src/components/admin/TestimonialsTab.tsx
  - supabase/config.toml
  - supabase/functions/outscraper-reviews/index.ts
  - tsconfig.tsbuildinfo
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-22 17:50 UTC
- Branch: `claude/bold-goodall-cyENR`
- Commit: `d89182a` — hotfix[s236.5]: provision-tenant outscraper fire-and-forget initial sync
- Author: Claude
- Files changed:
  - supabase/functions/provision-tenant/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-22 17:51 UTC
- Branch: `claude/bold-goodall-cyENR`
- Commit: `972672e` — chore[s236.5]: session log entry for provision-tenant outscraper hotfix
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-22 18:24 UTC
- Branch: `claude/bold-goodall-cyENR`
- Commit: `d7d410c` — fix: break session-end manifest hook infinite-churn loop
- Author: Claude
- Files changed:
  - .claude/hooks/session-end.sh
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-22 19:52 UTC
- Branch: `claude/modest-einstein-aodiq`
- Commit: `cd0a712` — docs[s237]: Wave 2 spec — S237a/S237b split, bucket_id, validator gate
- Author: Claude
- Files changed:
  - docs/audits/s237-image-library-spec.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-26 17:38 UTC
- Branch: `claude/modest-einstein-aodiq`
- Commit: `3e9d5e3` — investigate[s237b]: Wave 1 death audit — composer wiring
- Author: Claude
- Files changed:
  - docs/audits/s237b-composer-wiring-audit.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-26 19:09 UTC
- Branch: `s242/wave1-investigate`
- Commit: `9001138` — investigate[s242]: Wave 1 death audit — auto-attach repo-side findings
- Author: Claude
- Files changed:
  - docs/audits/s242-auto-attach-spec.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-26 19:20 UTC
- Branch: `s242/wave1-investigate`
- Commit: `7dd5ddc` — investigate[s242]: OQ2 evidence (Case 2 P0) + OQ3/OQ4/OQ5 locked decisions
- Author: Claude
- Files changed:
  - docs/audits/s242-auto-attach-spec.md
## Session — 2026-05-26 19:34 UTC
- Branch: `s243/wave1-investigate`
- Commit: `990ff58` — investigate[s243]: Wave 1 audit — AI proxy attack surface + migration target
- Author: Claude
- Files changed:
  - docs/audits/s243-ai-proxy-audit.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-27 12:41 UTC
- Branch: `s243/wave1-investigate`
- Commit: `4a764f5` — investigate[s243]: Wave 2 addendum — proxy contract & migration plan
- Author: Claude
- Files changed:
  - docs/audits/s243-ai-proxy-audit.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-27 12:49 UTC
- Branch: `s243/wave1-investigate`
- Commit: `83e26f0` — investigate[s243]: resolve composer_schedule (tier 2) + content_queue_schedule (tier 1)
- Author: Claude
- Files changed:
  - docs/audits/s243-ai-proxy-audit.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-27 13:12 UTC
- Branch: `s243/wave1-investigate`
- Commit: `41e3e02` — S243 Wave 2 revision: validator-gate fixes
- Author: Claude
- Files changed:
  - docs/audits/s243-ai-proxy-audit.md
## Session — 2026-05-27 13:47 UTC
- Branch: `s243/wave3-ai-proxy`
- Commit: `1719830` — S243 Wave 3: route all Anthropic calls through ai-proxy
- Author: Claude
- Files changed:
  - .github/workflows/ci.yml
  - CLAUDE.md
  - docs/audits/s243-migration.sql
  - src/components/admin/BlogPostEditor.tsx
  - src/components/admin/ContentPageForm.tsx
  - src/components/admin/ContentTab.tsx
  - src/components/admin/seo/SeoKeywordsTab.tsx
  - src/components/admin/seo/useSeoAiGenerate.ts
  - src/components/admin/social/ContentQueueTab.tsx
  - src/components/admin/social/NewCampaignModal.tsx
  - src/components/admin/social/useComposer.ts
  - src/components/ironwood/RedirectMapPanel.tsx
  - src/lib/ai/aiFeatures.ts
  - src/lib/ai/callAi.ts
  - src/lib/ai/generateBlogDraft.ts
  - src/lib/ai/generateBlogSeo.ts
  - supabase/functions/_shared/aiAuth.ts
  - supabase/functions/ai-proxy/index.ts
  - tsconfig.tsbuildinfo
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-27 17:50 UTC
- Branch: `s243/wave3-ai-proxy`
- Commit: `f9b911a` — S243 Wave 3: fill operator UUID allowlist
- Author: Claude
- Files changed:
  - supabase/functions/_shared/aiAuth.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-27 22:05 UTC
- Branch: `s242-session1-backend`
- Commit: `5cd6421` — s242 session1: QA report + review doc
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_S242_session1.md
  - docs/audits/REVIEW_S242_session1.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-28 03:07 UTC
- Branch: `s242-session1-backend`
- Commit: `85b4383` — s242 session1: fold in Scott decisions (F1 drop Supavisor, F3 Sonnet) + URL guards
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_S242_session1.md
  - docs/audits/REVIEW_S242_session1.md
  - docs/audits/s242-auto-attach-audit.md
  - supabase/functions/process-campaign-job/index.ts
  - supabase/functions/tag-image-vision/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-28 17:24 UTC
- Branch: `s245-pr2-offboard-consumers`
- Commit: `31939f9` — s245 PR2: offboard consumer + cron backstop
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_S245_PR2.md
  - docs/audits/REVIEW_S245_PR2.md
  - docs/migrations/s245-offboard-queue-cron.sql
  - supabase/config.toml
  - supabase/functions/_shared/offboardDrain.ts
  - supabase/functions/offboard-tenant/index.ts
  - supabase/functions/process-offboard-queue/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-28 17:38 UTC
- Branch: `s245-pr1-offboard-foundation`
- Commit: `7f0b148` — s245 PR1: durable offboard foundation (audit + outbox + RPC replace)
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_S245_PR1.md
  - docs/audits/REVIEW_S245_PR1.md
  - docs/migrations/s245-offboard-foundation-rollback.sql
  - docs/migrations/s245-offboard-foundation.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-29 12:07 UTC
- Branch: `cleanup/revalidate-grep-and-provision-url`
- Commit: `1e52b7b` — cleanup: surface /api/revalidate body shape (item 1); defer provision URL fix
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_cleanup_revalidate.md
  - docs/audits/REVIEW_cleanup_revalidate.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-29 13:10 UTC
- Branch: `feature/s242-session2-frontend`
- Commit: `28b0e92` — feat(s242): campaign image-strategy UI + targeted tagging + campaign_jobs realtime
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_S242_session2.md
  - docs/audits/REVIEW_S242_session2.md
  - src/components/admin/MediaTab.tsx
  - src/components/admin/social/CampaignJobsPanel.tsx
  - src/components/admin/social/CampaignsTab.tsx
  - src/components/admin/social/ImageStrategyChooser.tsx
  - src/components/admin/social/NewCampaignModal.tsx
  - src/hooks/useImageLibrary.ts
## Session — 2026-05-29 12:30 UTC
- Branch: `cleanup/jwt-config-and-env`
- Commit: `7fa465b` — cleanup: pin ai-proxy verify_jwt=false in config.toml (item 3); defer .env.example
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_cleanup_jwt_env.md
  - docs/audits/REVIEW_cleanup_jwt_env.md
  - supabase/config.toml
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-29 14:00 UTC
- Branch: `hotfix/campaigns-tier-pro-not-elite`
- Commit: `b46baf4` — hotfix: AI Campaigns tier gate Elite → Pro across submission, worker, ai-proxy/internal
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_hotfix_campaigns_tier_pro.md
  - docs/audits/REVIEW_hotfix_campaigns_tier_pro.md
  - supabase/functions/ai-proxy/index.ts
  - supabase/functions/generate-social-batch/index.ts
  - supabase/functions/process-campaign-job/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-29 16:05 UTC
- Branch: `chore/sync-tenant-isolation-migration`
- Commit: `095b2e4` — chore: sync 20260529151005_sweep_findings_tenant_isolation_hardening migration
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_sync_tenant_isolation_migration.md
  - docs/audits/REVIEW_sync_tenant_isolation_migration.md
  - supabase/migrations/20260529151005_sweep_findings_tenant_isolation_hardening.sql
## Session — 2026-05-29 15:19 UTC
- Branch: `cleanup/auth-edge-fn-batch`
- Commit: `8a61bf8` — cleanup: config.toml audit + .env.example + scrape-prospect → ai-proxy operator route + UUID auth + CI grep widening
- Author: Claude
- Files changed:
  - .env.example
  - .github/workflows/ci.yml
  - docs/audits/QA_REPORT_cleanup_auth_edge_fn_batch.md
  - docs/audits/REVIEW_cleanup_auth_edge_fn_batch.md
  - supabase/functions/_shared/aiAuth.ts
  - supabase/functions/scrape-prospect/analyzeSite.ts
  - supabase/functions/scrape-prospect/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-29 18:55 UTC
- Branch: `investigate/tier-gate-ux`
- Commit: `bbf9eea` — docs(s247): tier-gate UX death audit (Wave 1)
- Author: Claude
- Files changed:
  - docs/audits/s247-tier-gate-ux-audit.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-29 18:59 UTC
- Branch: `investigate/tier-gate-ux`
- Commit: `576771f` — docs(s247): tier-gate UX Wave 2 spec
- Author: Claude
- Files changed:
  - docs/audits/s247-tier-gate-ux-spec.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-29 19:09 UTC
- Branch: `investigate/tier-gate-ux`
- Commit: `72c93c1` — feat(s247): tier-gate UX — pre-emptive upgrade prompt replaces raw 403
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_s247_tier_gate_ux.md
  - docs/audits/REVIEW_s247_tier_gate_ux.md
  - src/components/admin/MediaTab.tsx
  - src/components/common/UpgradePrompt.tsx
  - src/components/common/useTierGate.ts
  - src/lib/requestUpgrade.ts
  - src/lib/tierInfo.ts
  - supabase/functions/notify-upgrade/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-29 19:13 UTC
- Branch: `investigate/tier-gate-ux`
- Commit: `e320dde` — docs(s247): record validator-gate ratification + remaining human gates
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_s247_tier_gate_ux.md
  - docs/audits/REVIEW_s247_tier_gate_ux.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-30 03:05 UTC
- Branch: `fix/media-already-tagged-skipped`
- Commit: `43a1658` — fix(s248): MediaTab — interpret tag-image-vision skipped, surface "Already tagged"
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_s248_already_tagged.md
  - docs/audits/REVIEW_s248_already_tagged.md
  - src/components/admin/MediaTab.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-30 03:50 UTC
- Branch: `chore/s248-mcp-trail-sync`
- Commit: `384d206` — chore(s248): sync MCP trail — logos write-scoping migration + notify-upgrade v26 parity
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_s248_mcp_trail_sync.md
  - docs/audits/REVIEW_s248_mcp_trail_sync.md
  - supabase/functions/notify-upgrade/index.ts
  - supabase/migrations/20260529181502_logos_bucket_tenant_folder_write_scoping.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-30 13:33 UTC
- Branch: `claude/charming-franklin-Q9GJr`
- Commit: `a2fc6bd` — chore(s248): notify-upgrade — full-escape consistency pass
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_s248_notify_upgrade_escape_consistency.md
  - docs/audits/REVIEW_s248_notify_upgrade_escape_consistency.md
  - supabase/functions/notify-upgrade/index.ts
## Session — 2026-05-30 14:33 UTC
- Branch: `chore/s248-trail-sync-seo-grep`
- Commit: `0354326` — chore(s248): sync 3 RLS-lint migrations + SEO-helper usage grep
- Author: Claude
- Files changed:
  - docs/audits/QA_REPORT_s248_trail_sync_seo_grep.md
  - docs/audits/REVIEW_s248_trail_sync_seo_grep.md
  - supabase/migrations/20260530135952_s248_rls_lint_a_b_lockdown_and_searchpath.sql
  - supabase/migrations/20260530141451_s248_rls_lint_c_revoke_internal_dispatchers.sql
  - supabase/migrations/20260530141524_s248_rls_lint_c_revoke_public_on_two_dispatchers.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-31 14:16 UTC
- Branch: `claude/youthful-hawking-33FUq`
- Commit: `4a89736` — feat(s249): data-driven standalone-tenant routing via render_model
- Author: Claude
- Files changed:
  - docs/migrations/s249-render-model-rollback.sql
  - middleware.ts
  - supabase/migrations/20260530144952_s248_rls_lint_c_revoke_seo_helpers_authenticated.sql
  - supabase/migrations/20260531141254_s249_add_tenants_render_model.sql
- Next recommended action: PR #141 open (draft). Scott merges → sets Vercel env `STANDALONE_TENANT_SLUGS=dang` (Production, dashboard not .env) → redeploy. Then Claude.ai applies the render_model migration via MCP (byte-identical to repo file, reconcile timestamp) + runs prod smoke test (dang/ → 404 standalone-admin-only-404; dang/admin/ → SPA; coastal-pest/ → shell; verify render_model backfill).
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-05-31 16:46 UTC
- Branch: `feature/s250-social-video`
- Commit: `69b9e67` — feat(s250): video support in composer + media_type-aware post displays
- Author: Claude
- Files changed:
  - src/components/admin/social/ComposerImagePicker.tsx
  - src/components/admin/social/EditPostModal.tsx
  - src/components/admin/social/LegacyComposer.tsx
  - src/components/admin/social/PostCard.tsx
  - src/components/admin/social/PostPreviewModal.tsx
  - src/components/admin/social/useComposer.ts
  - src/components/admin/social/usePublishPost.ts
  - src/components/admin/social/useSocialData.ts
- Note: full S250 set is 4 commits — (1) edge repo-sync to deployed v51/v55, (2) media_type migration+rollback, (3) edge type-derivation, (4) this frontend commit.
- Next recommended action: PR #142 open (draft, VALIDATOR-GATED). Hold merge for Scott's Perplexity+Gemini sign-off. Post-merge: orchestrator redeploys post-to-social + publish-scheduled-posts via MCP from repo files (copy-verbatim), applies the media_type migration, then PROD smoke on Dang (dang.pestflowpro.ai/admin → Social): upload .mp4 → <video> preview; publish-now video attaches; schedule video ~10min → cron path lands WITH video; existing image posts unchanged.
- Next recommended action: [Fill in next session: read this line, write what comes next]
