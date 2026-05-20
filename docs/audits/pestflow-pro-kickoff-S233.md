# PestFlow Pro — Session kickoff: S233

## Mode
Continuation of S232. Accordion shell shipped via PR #103, squash commit `37819e2`. All 4 sections currently render "Wiring in S233" placeholders. S233 replaces those placeholders with real tile content and finalizes the Reports → Analytics framing.

## Pattern to mirror
S232 phase contract: death-audit → propose → execute → verify → ship. CC Web stops between phases for Scott review. Stop-on-fail discipline throughout.

## Test tenant
Dang (`dang.pestflowpro.ai/admin`) — tier 4 Elite. Only paying tenant. Tier 4 sees every slot, so regressions surface here first.

## Pre-work artifacts (do not regenerate)
- `docs/audits/s232-analytics-inventory.txt` — every analytics tile catalogued
- `src/components/admin/analytics/AnalyticsHub.tsx` + `AnalyticsSection.tsx` — accordion shell
- `src/components/admin/analytics/sections/{SEO,Social,Performance,Blog}Section.tsx` — placeholder bodies to replace
- `src/components/admin/ReportsTab.tsx` — hub mount above lead UI; existing Analytics grid still present below hub and gets dismantled in Phase 2

## Starting tier-map proposal (finalize in Phase 1)
| Section | proposed minTier | tier 1 behavior |
|---------|------------------|-----------------|
| SEO Analytics | 3 | Locked CTA inside open accordion |
| Social Analytics | 3 | Locked CTA inside open accordion |
| Performance & Reports | 2 | Locked CTA below tier 2 |
| Blog Analytics | 3 | Locked CTA inside open accordion |

Locked sections must render an upgrade CTA inside the open accordion body, NOT hide the section entirely. If FeatureGate does not support a "locked-but-visible" mode today, that gap is the first thing Phase 1 must surface.

## Phases

### Phase 1 — Death audit (read-only)
Re-read `docs/audits/s232-analytics-inventory.txt` against current ReportsTab.tsx. Verify every tile is mounted as inventory describes; flag drift. Confirm FeatureGate supports locked-but-visible CTA mode (read source). Propose final tile-to-section placement + locked-state behavior. Output committed as `docs/audits/s233-phase1-placement.md`. NO code changes in this phase.

### Phase 2 — Tile relocation
Move tile imports + JSX from ReportsTab.tsx's Analytics grid into the matching `sections/<Name>Section.tsx` file. Delete the Analytics grid section from ReportsTab.tsx after relocation. Lead UI block stays. Hub renders real tiles; placeholders deleted.

CRITICAL: Ga4AnalyticsTile is mounted ONLY in SeoInsightsTab.tsx today — pre-existing S231 PR #100 gap. Phase 2 wires Ga4AnalyticsTile into SEOSection. SeoInsightsTab.tsx itself is NOT touched this session; that is F2/F3 cleanup, separate effort.

### Phase 3 — Tier-gating
Wrap each section body in `<FeatureGate minTier={X}>` per the Phase 1 finalized tier map. Validator gate required before this phase (see below).

### Phase 4 — Reports → Analytics rename
- Admin nav label `Reports` → `Analytics`
- `activeTab` enum value `'reports'` → `'analytics'` (grep first, update all call sites)
- PageHelpBanner `featureName="Reports"` → `featureName="Analytics"`
- Banner copy already references "social media activity and SEO health" — leave as-is

### Phase 5 — Production verification
- Open dang.pestflowpro.ai/admin on production
- Tab nav reads "Analytics"
- Each section shows real tiles, no placeholder cards
- Tier 4 (Dang) sees every section unlocked
- localStorage section-expanded state persists across refresh
- Fresh localStorage → SEO Analytics defaults expanded (S232 spec; verify it actually works — was visually all-collapsed in S232 ship screenshots)

### Phase 6 — Ship
- Single squash-merge PR
- Confirm production deploy READY post-merge
- Capture backlog: F2 (SeoInsightsTab ungated Gsc/Ga4 tiles), F3 (Dashboard mini-tiles tier gating)

## Validator gate
Gemini + Perplexity required before Phase 3 — confirm FeatureGate "locked-but-visible CTA" pattern handles the upgrade prompt correctly. Skip validator on Phases 1/2/4/5 (mechanical or read-only).

## Context budget
50% / 60% / 70% notifications. 80% = hard stop + handoff regardless of phase.

---
Entry state: PR #103 squash commit `37819e2` live on main
Authored: 2026-05-20 post-S232 ship
