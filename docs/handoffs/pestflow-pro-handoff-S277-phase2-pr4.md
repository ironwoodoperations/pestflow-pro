# PestFlow Pro — Handoff S277 (dang-pfp Phase 2 — PR 4: comic shell fill SHIPPED)

*Session S277 · docs-only close of Phase 2 PR 4.*

## What shipped (PR #236, squash 1a3b0be, merged)
Filled the empty `dang-comic` scaffold (PR 3) with the real comic design, wired the SEO read-paths, restored dropped schema, and added the color-authority guard. **No activation** — no `branding.theme` written; every `dang-comic` branch is unreachable → byte-identical render for all existing tenants incl. live Dang. +927/−110, 15 files. `tsc`/`eslint`/`next build` clean.

### Workstreams delivered
- **WS1 — color authority.** `computeShellCssVars` `dang-comic` early-return guard (pins primary/accent/btn to canonical `#F26B0F`, returns base map, bypasses the `branding.primary_color` #F97316 shadow) + `SHELL_THEMES['dang-comic']` base entry. Mirrors the bold-local guard; fires ONLY for `template==='dang-comic'`. `DANG_TOKENS` expanded to the full 4-color comic system + type scale. Fonts: Bangers + Open Sans via `next/font/google` (G3 decision, CLS grounds, mirrors bold-local).
- **WS2 — 5 components filled.** `DangComicNavbar` (two desktop states + distinct mobile 3-button/hamburger/left-slide-drawer, `'use client'`), `DangComicFooter`, `DangComicHome` (10-section spec order), `DangComicPestPage`, `DangComicAboutPage`. Shared `DangComicDevices.tsx` = authored inline-SVG burst/shield/cloud/sunburst.
- **WS3 — FAQ visible-render + schema (debt-c).** `[service]/page.tsx` fetches `getServiceFaqs(tenant.id, slug)` → passes to `DangComicPestPage`, which renders the SAME array it emits via `generateFAQSchema`, gated `length>0`. Does NOT render `serviceData.ts` faqs. Uncategorized/termite slugs → `[]` → no FAQ block, no schema.
- **WS4 — schema restoration (debt-a).** `websiteSchema` re-emitted (home branch), `aboutSchema` (about branch). Layout `localBusinessSchema` untouched. `generateServiceSchema` DEFERRED.
- **WS5 — comic contact page (descoped per Scott).** `DangComicContactPage` = comic hero + chrome around the SHARED `ContactForm` (`hideContactSidebar`), mirrors `ModernProContactPage`; 4th branch added to `contact/page.tsx`. No bespoke form (known parity gap → Phase 3).
- **WS7 — seo_meta data fixes (operator via MCP, verified).** Two rows on tenant `1611b16f-381b-4d4f-ba3a-fbde56ad425b`: (1) `termite-inspections` meta_description was Longview cross-contamination → restored to clean Tyler termite-inspection copy (sourced from the row's correct `og_description`); (2) referral post `wed-rather-pay-you-than-google-...` meta_title was truncated ("...in Tyl") → restored to full "Earn $75 Per Referral – Pest Control Referral Program in Tyler, TX" (66 chars). Pure data UPDATEs, no DDL → no migration file. Invisible to the live Vite site (it hardcodes SEO, ignores seo_meta); surface only once the SSR comic shell renders post-cutover.

### Validator gate (G1/G2/G3)
No Perplexity/Gemini MCP → two independent web-research passes (disclosed in PR body). G1 (color-authority guard), G2 (FAQ render-then-emit matches Google's visible-content policy, SSR/ISR-safe), G3 (next/font over <link>, CLS) — all confirmed conservative-wins.

## ⚠️ PRE-CUTOVER BURN-DOWN (carry verbatim — blocking items marked)
The shell is built but NOT visually pixel-faithful to the live Dang site yet — by design; the branded assets live in the out-of-scope Vite repo / WordPress and were not reachable during the build, so placeholders shipped. All items below MUST be resolved (or consciously accepted) BEFORE a `dang-comic` cutover:

- **(BLOCKING) 3 brand-color approximations.** Only orange `#F26B0F` is exact/canonical. Cyan `#29ABE2`, yellow `#FFD100`, green `#39B54A` are flagged APPROX in `DangComicFonts.ts`. Correct to real brand values before cutover.
- **(BLOCKING) Real comic chrome assets.** `DangComicDevices.tsx` burst/shield/cloud/sunburst are authored SVG stand-ins, NOT the real DANG! burst logo or the live cloud dividers. Side-by-side with dangpestcontrol.com they read as approximations. Swap in the real assets (extract from the live WordPress site — the DANG! burst, cloud divider, halftone textures are public files). The shell is token-first specifically so this swap is localized.
  - Real files already on hand (operator has them): `apple-touch-icon.png` (180×180 transparent DANG! burst — low-res, favicon-grade), `dang-pest-homepage-img-1.webp` + `dang-pest-homepage-img2.webp` (1920×1080 "Meet Kirk" / "Get Free Pest Control For Life" video posters), `Longview.webp`. Still NEEDED as files: full-res header DANG! burst + the cloud-divider PNG (shown as screenshots, not yet saved off the live site).
- **(BLOCKING for parity) Video embeds.** The two homepage videos render as poster-frame placeholders (cyan border + play affordance). Real embed URLs/IDs not yet available — swap in before cutover.
- **(SHOULD-FIX) Service-grid tiles use placeholder bug glyphs**, not the real Group-A Supabase-storage service-card images (`General.jpg`, `Termite.jpg`, etc. under `tenant-assets/1611b16f-.../site-media/`) — which ARE reachable now. Wire the real storage images.
- **(DEFERRED, decide) `generateServiceSchema`** on the comic pest page — no other shell pest page emits it; revisit whether Dang should.
- **(PHASE-3 GAP) Comic bespoke quote form** — contact renders the shared neutral `ContactForm`, not the live site's full comic quote form (First/Last, address block, Service-checkbox grid, two verbatim consent strings). Descoped by Scott in PR 4; revisit at Phase 3 parity if it matters.
- `resolveSiteUrl` custom-domain TODO (read `tenant_domains WHERE verified=true`); footer "Powered by PestFlow Pro" `.ai` cleanup; PR 1.5 dashboard-write → ISR revalidation — all standing, non-blocking.

## Immediate next action
**PR 5 — server-side sitemap/robots** (the last build PR of Phase 2), then **Phase 3 (prove parity-or-better)** where the asset/color burn-down naturally lands, then **Phase 4 (gated cutover)**.

## Parked (not needed now)
Asset-harvester extension of `tools/teardown/` — a reusable "pull a prospect's real assets off their live site" stage for the future rebuild-customer business line. Genuinely useful later, NOT on the critical path for dang-pfp. Do not build until the rebuild-service line is actively being productized.
