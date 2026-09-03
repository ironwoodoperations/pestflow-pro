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
- Next recommended action: **pls launch checklist — flip `settings.seo.noindex` off first.** The site is finished and invisible: every metadata, JSON-LD and service-area fix from S293-S302 is being emitted to crawlers told not to look. Then decide `custom_domain` (after de-noindexing, so the indexed URLs are not the ones being replaced), then `notifications.lead_email` (blocked on §6.4). After that: S300's turf content entry needs five owner facts, and its `page_content` row must land AFTER the entry or the tile links to a 404. Deploy state is verified in `docs/ROADMAP.md` — `generate-monthly-report` IS deployed at v15; do not re-propagate the merged-but-undeployed claim from the older logs in this directory.

---
## Session — 2026-09-01 15:45 UTC
- Branch: `main`
- Commit: `d879f3c` — S311 — deterministic modern-pro review selection + per-tenant nav logo height (#313)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/fix-s311-pls-homepage-review-selection-logo-height.md
  - app/tenant/[slug]/_shells/modern-pro/ModernProNavbar.tsx
  - app/tenant/[slug]/_shells/modern-pro/ModernProTestimonials.tsx
  - app/tenant/[slug]/_shells/modern-pro/modernProTestimonialSelection.test.tsx
  - app/tenant/[slug]/page.tsx
  - shared/lib/tenant/resolve.ts
  - shared/lib/tenant/types.ts
- Next recommended action: **Two S311 close-ritual drafts are awaiting Scott's confirmation and
  are NOT committed** — the `docs/ROADMAP.md` update and
  `docs/handoffs/pestflow-pro-handoff-S311-shipped.md`. Commit both once he confirms; they carry
  the follow-up list below.

  **READ THIS BEFORE REASONING ABOUT ANY dang RENDER PATH: dang's public site is NOT served by
  this repo.** `dang.pestflowpro.ai` returns 404. Kirk's live site is `dangpestcontrol.com`, served
  from a SEPARATE STANDALONE REPO, and `tenants.custom_domain` for dang is
  `admin.dangpestcontrol.com` (which does not resolve — NXDOMAIN). `ModernProTestimonials`, and
  every other `app/tenant/[slug]/` shell, never renders for dang. This is easy to get wrong because
  dang's `testimonials`, `page_content` and `settings` rows ARE here and reachable from the admin —
  the data is here, the public render is not. It cost two wrong conclusions in one session.

  Carried from S311: `getTestimonials()` still has no total order and four shells still consume it
  (BoldLocal/CleanFriendly sort `featured` with a non-total comparator and no empty-text filter;
  RusticRugged takes `[0]`); `RusticRuggedTestimonials.tsx:5` holds a hardcoded invented
  testimonial; `'Licensed since 2017'` and `'Free 2-year warranty'` are tenant facts still sitting
  in the irrigation preset; set pls `settings.branding.logo_height_px` to 32 once Vercel is READY
  on main (S311 shipped the field and wrote no value). **DECISION PENDING, do not touch:** dang has
  six `testimonials` rows with `source='Google'` and `google_review_id` NULL, initials-only names,
  all six at clock time `15:01:36.775`, against 49 `google_outscraper` rows that all carry a real
  ID. Also: the ROADMAP's "S300 guard is at state 2 of 3" line is STALE — S310 landed
  `artificial-turf` in `IRRIGATION_CONTENT_MAP`, so the guard is at state 3 of 3 and closed; the
  pending ROADMAP draft corrects it. PR #312 (S309 gate) is untouched and still blocked on the
  Perplexity + Gemini verdicts.

---
## Session — 2026-09-02 14:50 UTC
- Branch: `main`
- Commit: `328664b` — S313 — make password-reset-request observable (logging only) (#318)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/fix-s313-password-reset-observability.md
  - REVIEW_S313_PASSWORD_RESET_OBSERVABILITY.md
  - docs/ROADMAP.md
  - supabase/functions/password-reset-request/index.ts
  - supabase/functions/password-reset-request/passwordResetLogging.test.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-02 16:13 UTC
- Branch: `main`
- Commit: `f41c42f` — S317 — carry the platform brand into the edge functions (#320)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/fix-s317-platform-brand-edge-functions.md
  - src/__tests__/platformBrand.test.tsx
  - supabase/functions/_shared/emailTemplates/authEmails.ts
  - supabase/functions/_shared/sendEmail.ts
  - supabase/functions/invite-team-member/index.ts
  - supabase/functions/notify-new-lead/index.ts
  - supabase/functions/notify-support-ticket/index.ts
  - supabase/functions/notify-upgrade/index.ts
  - supabase/functions/password-reset-request/index.ts
  - supabase/functions/provision-tenant/index.ts
  - supabase/functions/send-credentials-email/index.ts
  - supabase/functions/send-intake-email/index.ts
  - supabase/functions/send-onboarding-email/index.ts
  - supabase/functions/send-reveal-ready/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-03 01:00 UTC
- Branch: `main`
- Commit: `195db2f` — S323 PR A — the lawn catalog: presets in code, deliberately inert (#330)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/claude-support-tickets-rls-policies-xbwg8a.md
  - app/tenant/[slug]/[service]/page.tsx
  - app/tenant/[slug]/_lib/serviceData.ts
  - shared/lib/seoSchema.test.ts
  - shared/lib/seoSchema.ts
  - src/lib/__tests__/adminVerticalPreset.test.ts
  - src/lib/__tests__/lawnCatalog.test.ts
  - src/lib/adminVerticalPreset.ts
  - src/shells/_shared/lawnContent.ts
  - src/shells/_shared/serviceEntry.ts
  - src/shells/_shared/verticalCopy.test.ts
  - src/shells/_shared/verticalCopy.ts
  - src/shells/_shared/verticalCopyPresets.test.ts
  - supabase/functions/_shared/provisioningSeed.test.ts
  - supabase/functions/_shared/verticalCopy.ts
  - supabase/functions/generate-monthly-report/narrationPrompt.test.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-03 13:10 UTC
- Branch: `main`
- Commit: `ba4d134` — S325 — gate demo affordances on the tenant's demo_mode row, not the hostname (#332)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/claude-support-tickets-rls-policies-xbwg8a.md
  - src/components/admin/SocialTab.tsx
  - src/components/admin/TierToggle.tsx
  - src/components/admin/__tests__/demoAffordance.test.tsx
  - src/components/ironwood/IronwoodSocial.tsx
  - src/lib/demoAffordance.ts
  - src/pages/admin/Dashboard.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-03 13:18 UTC
- Branch: `main`
- Commit: `15dc873` — docs(S324): land the provisioning write-set investigation in the repo (#333)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/claude-support-tickets-rls-policies-xbwg8a.md
  - PROJECT_MANIFEST.d/main.md
  - docs/audits/INVESTIGATION_S324_PROVISIONING_WRITE_SET.md
- Next recommended action: [Fill in next session: read this line, write what comes next]
