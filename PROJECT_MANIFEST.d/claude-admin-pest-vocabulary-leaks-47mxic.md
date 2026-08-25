# Session log — branch `claude/admin-pest-vocabulary-leaks-47mxic`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-25 15:50 UTC
- Branch: `claude/admin-pest-vocabulary-leaks-47mxic`
- Commit: `de3286e` — S297 — kill the live pest vocabulary leaks in the admin SPA
- Author: Claude
- Files changed:
  - docs/audits/s282-rendered/client-setup.ClientSetupWizard.html
  - docs/audits/s282-rendered/client-setup.Step1BusinessInfo.html
  - docs/audits/s282-rendered/client-setup.Step3Domain.html
  - docs/audits/s282-rendered/onboarding.StepBusinessInfo.html
  - src/components/admin/BlogPostEditor.tsx
  - src/components/admin/ContentPageForm.tsx
  - src/components/admin/ContentTab.tsx
  - src/components/admin/LocationsTab.tsx
  - src/components/admin/__tests__/adminRenderedStrings.test.tsx
  - src/components/admin/client-setup/steps/Step1BusinessInfo.tsx
  - src/components/admin/client-setup/steps/Step3Domain.tsx
  - src/components/admin/onboarding/StepBusinessInfo.tsx
  - src/components/admin/seo/SeoInlineEditor.tsx
  - src/components/admin/seo/SeoPagesTab.tsx
  - src/components/admin/settings/BusinessInfoSection.tsx
  - src/components/admin/settings/businessInfoDefaults.ts
  - src/components/admin/social/ComposerCaptionEditor.tsx
  - src/components/admin/social/NewCampaignModal.tsx
  - src/components/admin/social/useComposer.ts
- PR: #297 (DRAFT, no auto-merge — Scott merges). CI green pending at time of writing.
- Next recommended action: S297 fixed the five briefed pest placeholder/default leaks
  plus seven more of the identical class found in the same tree, and added a live guard
  (12 renders x 6 admin components x {irrigation, unrecorded}) to adminRenderedStrings.test.tsx.
  Both required mutations were run and both go red. REPORTED BUT DELIBERATELY NOT FIXED,
  in priority order:
    1. seo/useSeoFixChain.ts:21-27 — four AI SYSTEM PROMPTS hardcode "pest-control
       companies"/"pest-control websites". S293 PR B de-pested seoPrompts.ts and missed
       this file. It feeds GENERATED COPY, so its blast radius is larger than any
       placeholder in S297. Best candidate for the next session.
    2. src/pages/admin/OnboardingLive.tsx:44,51 — identical placeholder class
       ('Apex Pest Solutions', 'TPCL-12345'); :51 label is copy, not a placeholder.
    3. src/pages/admin/Dashboard.tsx:53 — 'Overview of your pest control business'
       renders to EVERY tenant on the admin landing screen. Copy, not a placeholder.
    4. Next shells (app/tenant/[slug]/_shells/) — six *PestPage.tsx components, five
       hardcoded nav/footer/service arrays, and `|| 'Pest Control'` render fallbacks.
       Much larger and a different class; needs its own session.
    5. common/metricHelp.ts:148-150 ('Pest pages'), seo/SeoPagesTab.tsx:27 (badge label),
       social/ComposerCaptionEditor.tsx:24 (all-pest emoji palette — needs a
       vertical-keyed set, i.e. registry work).
  OPEN LIMIT in the guard: BusinessInfoSection and LocationsTab paint a "Loading..." stub
  under renderToStaticMarkup and this repo has neither jsdom nor @testing-library/react,
  so their defaults are asserted as VALUES and LocationsTab's three placeholders only by
  their derivation. Mounting those two needs a DOM.
  NOT DONE: session-close ritual (docs/ROADMAP.md update + docs/handoffs/ entry) — Scott
  had not confirmed at time of writing.

---
## Session — 2026-08-25 16:05 UTC
- Branch: `claude/admin-pest-vocabulary-leaks-47mxic`
- Commit: `b4b5436` — S297 — the dashboard tab subtitle: the first line every tenant reads
- Author: Claude
- Files changed:
  - src/components/admin/__tests__/adminRenderedStrings.test.tsx
  - src/pages/admin/Dashboard.tsx
  - src/pages/admin/dashboardTabCopy.ts
- PR: #297 (DRAFT, no auto-merge — Scott merges). Scott APPROVED all twelve prior fixes
  without splitting, confirmed TPCL-12345 stays in the matcher, and called ONE addition
  before merge: Dashboard.tsx:53 — item 3 on the previous entry's not-fixed list.
- Next recommended action: Dashboard.tsx:53 is DONE, so the previous entry's list
  renumbers. Scott overruled my report-only call on it and was right: I had classified
  it correctly as COPY rather than a placeholder, but 'dashboard' is the DEFAULT tab, so
  the subtitle was the first line every tenant read on every login, and the other
  thirteen subtitles in TAB_SUBTITLES were already trade-neutral — the pest one was the
  outlier, not the design. Now 'Overview of your business'; the map moved to
  src/pages/admin/dashboardTabCopy.ts (Dashboard.tsx is behind a lazy tab graph and the
  router, so a test cannot import it for one constant). Deliberately NOT vertical-keyed:
  a page header must not be able to paint blank while useAdminPreset's effect is in
  flight — a tradeoff an empty-when-unrecorded PLACEHOLDER accepts and a HEADER does not.
  Guard extended to all FOURTEEN subtitles, so a pest subtitle on any future tab goes red.
  Four mutations now run against the S297 guard, all red as required:
    A. a sixth leaking placeholder in a guarded component
    B. emptying the component list (explicit length assertion; without it the suite
       silently drops 54 -> 42 tests and still reports green)
    C. restoring the original dashboard subtitle
    D. a pest subtitle on a DIFFERENT tab (blog)
  STILL REPORTED AND NOT FIXED, in priority order (Scott's scope decision):
    1. seo/useSeoFixChain.ts:21-27 — four AI SYSTEM PROMPTS hardcode "pest-control
       companies"/"pest-control websites". S293 PR B de-pested seoPrompts.ts and missed
       this file. Feeds GENERATED COPY, so blast radius exceeds any placeholder in S297.
       HIGHEST-VALUE NEXT SESSION.
    2. src/pages/admin/OnboardingLive.tsx:44,51 — identical placeholder class
       ('Apex Pest Solutions', 'TPCL-12345'); :51 label is copy. Scott: stays a follow-up.
    3. Next shells (app/tenant/[slug]/_shells/) — six *PestPage.tsx components, five
       hardcoded nav/footer/service arrays, `|| 'Pest Control'` fallbacks, and
       _lib/serviceData.ts:31. Scott: explicitly OUT. Needs its own session.
    4. common/metricHelp.ts:148-150 ('Pest pages'), seo/SeoPagesTab.tsx:27 (badge label),
       social/ComposerCaptionEditor.tsx:24 (all-pest emoji palette — needs a
       vertical-keyed set, i.e. registry work).
    5. src/pages/marketing/sections/MarketingCTA.tsx:60 — 'your pest control business'.
       Public MARKETING site, not the admin; noted while sweeping, never in S297 scope.
  OPEN LIMIT in the guard, unchanged: BusinessInfoSection and LocationsTab paint a
  "Loading..." stub under renderToStaticMarkup and this repo has neither jsdom nor
  @testing-library/react, so their defaults are asserted as VALUES and LocationsTab's
  three placeholders only by their derivation. Mounting those two needs a DOM.
  STATE AT WRITING: 1087 tests pass, tsc clean, lint 223 warnings / 0 errors (unchanged
  baseline), vite build green. CI re-running on b4b5436 after the push.
  NOT DONE: session-close ritual (docs/ROADMAP.md update + docs/handoffs/ entry) — Scott
  has still not confirmed; standing orders require his sign-off before committing those.
