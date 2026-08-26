# Session log — branch `main`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-06-15 14:25 UTC
- Branch: `main`
- Commit: `42935d4` — task[1]: s268 wave2 — custom-color palette fallback in shellCssVars (#197)
- Author: csdevore2
- Files changed:
  - shared/lib/shellCssVars.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-06-15 15:04 UTC
- Branch: `main`
- Commit: `29d8665` — S268 close-out: ROADMAP + S268 handoff (docs only) (#198)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/claude-admiring-bohr-t36tuy.md
  - PROJECT_MANIFEST.d/main.md
  - docs/ROADMAP.md
  - docs/handoffs/pestflow-pro-handoff-S268-shipped.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-08-23 19:52 UTC
- Branch: `main`
- Commit: `4a362ff` — fix(claims): repo-wide capacity-claim sweep + a guard that scans the whole render path (PR E) (#269)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/fix-capacity-claims-sweep.md
  - app/tenant/[slug]/_components/DefaultAboutPage.tsx
  - app/tenant/[slug]/_components/DefaultPestPage.tsx
  - app/tenant/[slug]/_components/forms/ContactFormBoldLocal.tsx
  - app/tenant/[slug]/_components/forms/QuoteForm.tsx
  - app/tenant/[slug]/_components/retiredClaims.test.tsx
  - app/tenant/[slug]/_components/sections/CtaBanner.tsx
  - app/tenant/[slug]/_components/sections/WhyChooseUs.tsx
  - app/tenant/[slug]/_components/sections/ctaBanner.test.ts
  - app/tenant/[slug]/_lib/serviceData.ts
  - app/tenant/[slug]/_shells/bold-local/BoldLocalAboutPage.tsx
  - app/tenant/[slug]/_shells/bold-local/BoldLocalPestPage.tsx
  - app/tenant/[slug]/_shells/bold-local/BoldLocalWhyUs.tsx
  - app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyAboutPage.tsx
  - app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyTrustBar.tsx
  - app/tenant/[slug]/_shells/metro-pro/MetroProPestPage.tsx
  - app/tenant/[slug]/_shells/modern-pro/ModernProAboutPage.tsx
  - app/tenant/[slug]/_shells/rustic-rugged/RusticRuggedAboutPage.tsx
  - shared/lib/noUnverifiedClaims.test.ts
  - src/components/QuoteFormSteps.tsx
  - src/shells/_shared/pestContent.ts
  - src/shells/_shared/verticalCopy.ts
  - src/shells/_shared/verticalCopyPresets.test.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-08-23 20:51 UTC
- Branch: `main`
- Commit: `0971ee1` — fix(about): DB-drive the remaining fabricated stat tiles + close the guard gap (PR F) (#272)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/fix-about-stats-db-driven.md
  - app/tenant/[slug]/[service]/page.tsx
  - app/tenant/[slug]/_components/DefaultAboutPage.tsx
  - app/tenant/[slug]/_components/aboutStatsShells.test.tsx
  - app/tenant/[slug]/_shells/bold-local/BoldLocalAboutPage.tsx
  - app/tenant/[slug]/_shells/bold-local/BoldLocalPestPage.tsx
  - app/tenant/[slug]/_shells/bold-local/BoldLocalWhyUs.tsx
  - app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyAboutPage.tsx
  - app/tenant/[slug]/about/page.tsx
  - shared/lib/noUnverifiedClaims.test.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-08-23 21:17 UTC
- Branch: `main`
- Commit: `8a165bd` — chore(db): add the missing migration files for the S281 vertical CHECK (#273)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/chore-s281-migration-files.md
  - PROJECT_MANIFEST.d/main.md
  - supabase/migrations/20260823210305_s281_business_info_vertical_check.sql
  - supabase/migrations/s281_business_info_vertical_check_rollback.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-08-23 21:31 UTC
- Branch: `main`
- Commit: `8642a3d` — docs: S281 handoff — DB sweep, the seed, and the guard's own blind spot (#275)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/docs-handoff-s281.md
  - docs/handoffs/pestflow-pro-handoff-S281-db-sweep-and-guard.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-08-23 22:06 UTC
- Branch: `main`
- Commit: `d200ce0` — docs(s282): Admin SPA discovery pass — source inventory + rendered dump (NO CODE CHANGES) (#276)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/main.md
  - PROJECT_MANIFEST.d/s282-admin-discovery.md
  - docs/audits/s282-admin-source-inventory.md
  - docs/audits/s282-rendered/ComposerPlatformSelector.html
  - docs/audits/s282-rendered/ComposerTemplates.hvac.html
  - docs/audits/s282-rendered/ComposerTemplates.irrigation-unmapped.html
  - docs/audits/s282-rendered/ComposerTemplates.pest-control.html
  - docs/audits/s282-rendered/DemoBanner.html
  - docs/audits/s282-rendered/FaqItemForm.default.html
  - docs/audits/s282-rendered/FaqItemForm.edit-irrigation-category.html
  - docs/audits/s282-rendered/FaqItemForm.edit-pest-category.html
  - docs/audits/s282-rendered/LeadFunnel.html
  - docs/audits/s282-rendered/PageHelpBanner.html
  - docs/audits/s282-rendered/RemiAddonStrip.html
  - docs/audits/s282-rendered/ShellSelector.html
  - docs/audits/s282-rendered/client-setup.ClientSetupWizard.html
  - docs/audits/s282-rendered/client-setup.Step1BusinessInfo.html
  - docs/audits/s282-rendered/client-setup.Step3Domain.html
  - docs/audits/s282-rendered/onboarding.StepBranding.html
  - docs/audits/s282-rendered/onboarding.StepBusinessInfo.html
  - src/components/admin/__tests__/adminRenderedStrings.test.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-08-26 19:36 UTC
- Branch: `main`
- Commit: `6c45b18` — docs(S303) — ROADMAP: image uploads overwrite in place, plus three related items (#303)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/docs-s303-roadmap-image-upload-items.md
  - docs/ROADMAP.md
- Next recommended action: [Fill in next session: read this line, write what comes next]
