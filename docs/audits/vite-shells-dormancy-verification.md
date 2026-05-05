# Vite Shells Dormancy Verification

**Session:** S192
**Date:** 2026-05-05
**Scope:** Determine whether the Vite shell folders under `src/shells/*` and `src/data/pestVideos.ts` are actively rendered or dormant code post-S190 Dang shell deletion. Findings gate the Pexels Phase 1b implementation plan.

---

## TL;DR

**The "Vite shells = dormant like Dang was" framing is wrong.** Vite still serves apex pestflowpro.com's marketing/demo pages, and the master tenant's branding theme is currently `bold-local`. So `src/shells/bold-local/` is **rendering live in production right now** for every visitor to pestflowpro.com/about, /spider-control, /quote, etc. `src/shells/modern-pro/` is also live (default-fallback shell, currently rendered for dang.pestflowpro.com which has theme='dang' that no longer matches any switch case). `src/data/pestVideos.ts` is live too — it's consumed by 13 pest-service pages that mount inside that bold-local apex render. The other three Vite shells — `clean-friendly`, `metro-pro`, `rustic-rugged` — and `_shared` are split: `_shared` is live but only via Next.js cross-imports; `clean-friendly`/`metro-pro`/`rustic-rugged` are reachable code paths inside `PublicShell` but no Vite-served tenant has those themes, so they're dormant in practice.

Phase 1b cannot be a pure S190-pattern bulk delete. `bold-local` and `pestVideos` need in-place Pexels cleanup; `rustic-rugged` (which holds 5 of the 11 Pexels URLs) can be deleted safely.

---

## Folder inventory

| Path | Files | LOC |
|---|---:|---:|
| `src/shells/_shared/` | 4 | 456 |
| `src/shells/bold-local/` | 13 | 762 |
| `src/shells/clean-friendly/` | 12 | 823 |
| `src/shells/metro-pro/` | 16 | 1,735 |
| `src/shells/modern-pro/` | 11 | 783 |
| `src/shells/rustic-rugged/` | 12 | 642 |
| `src/data/pestVideos.ts` | 1 | 19 |

---

## External import findings

### `src/shells/_shared/`
- Vite consumers: **0**
- Next.js consumers: **6 files** importing `PestIcon`, `VideoPosterPlayer`, `getShellImage`, `pestContent`:
  - `app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyServicesGrid.tsx:3` — `PEST_CONTENT_MAP`
  - `app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyHero.tsx:4` — `getShellImage`
  - `app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyPestPage.tsx:3,4` — `PEST_CONTENT_MAP`, `PestIcon`
  - `app/tenant/[slug]/_shells/bold-local/BoldLocalServicesGrid.tsx:2,3` — `PEST_CONTENT_MAP`, `PestIcon`
  - `app/tenant/[slug]/_shells/bold-local/BoldLocalHero.tsx:4,5` — `PestIcon`, `VideoPosterPlayer`
  - `app/tenant/[slug]/_shells/modern-pro/ModernProHero.tsx:3` — `VideoPosterPlayer`
  - `app/tenant/[slug]/_shells/rustic-rugged/RusticRuggedHero.tsx:4` — `VideoPosterPlayer`
  - `app/tenant/[slug]/_components/MetroHero.tsx:3` — `VideoPosterPlayer`
- Verdict: **Live (Next.js).**

### `src/shells/bold-local/`
- Vite consumers: **3** (all in `src/components/PublicShell.tsx:14-16`) — `ShellNavbar`, `ShellFooter`, `ShellHomeSections` lazy-imported by the `template === 'bold-local'` switch case.
- Next.js consumers: **0** (Next.js has its own `app/tenant/[slug]/_shells/bold-local/` — distinct files; the grep matches that pointed at `app/tenant/[slug]/page.tsx` and `layout.tsx` are intra-Next.js relative paths, not cross-boundary imports).
- Verdict: **Imports exist (Vite path).**

### `src/shells/clean-friendly/`
- Vite consumers: **3** (`PublicShell.tsx:17-19`).
- Next.js consumers: **0** (Next.js has its own `_shells/clean-friendly/`).
- Verdict: **Imports exist (Vite path only).**

### `src/shells/metro-pro/`
- Vite consumers: **7**:
  - `src/components/PublicShell.tsx:23-25` — Navbar/Footer/Sections via `template==='metro-pro'`
  - `src/components/PestPageTemplate.tsx:11` — `MetroProServicePage` lazy-loaded when template is metro-pro
  - `src/pages/QuotePage.tsx:10` — `MetroProQuotePage`
  - `src/pages/LocationPage.tsx:13` — `MetroProCityPage`
  - `src/pages/ServiceArea.tsx:11` — `MetroProLocationPage`
- Next.js consumers: **0** (Next.js has its own `app/tenant/[slug]/_components/MetroNavbar/MetroFooter/MetroHero.tsx` plus `_shells/metro-pro/`).
- Verdict: **Imports exist (Vite path only).**

### `src/shells/modern-pro/`
- Vite consumers: **3** — eager (not lazy) imports in `PublicShell.tsx:9-11`. This is the default fallback for unknown templates.
- Next.js consumers: **0** (Next.js has its own `_shells/modern-pro/`).
- Verdict: **Imports exist (Vite path).**

### `src/shells/rustic-rugged/`
- Vite consumers: **3** (`PublicShell.tsx:20-22`).
- Next.js consumers: **0** (Next.js has its own `_shells/rustic-rugged/`).
- Verdict: **Imports exist (Vite path only).**

### `src/data/pestVideos.ts`
- Vite consumers: **13** — every src/pages pest service page:
  - `PestControlPage.tsx`, `RoachControl.tsx`, `WaspHornetControl.tsx`, `SpiderControl.tsx`, `ScorpionControl.tsx`, `MosquitoControl.tsx`, `LocationPage.tsx`, `TermiteControl.tsx`, `FleaTickControl.tsx`, `AntControl.tsx`, `TermiteInspections.tsx`, `BedBugControl.tsx`, `RodentControl.tsx`
- Next.js consumers: **0**.
- Verdict: **Imports exist (Vite path).**

---

## Vite routing inspection

### `src/App.tsx`
- Routes wrapped in `<PublicShell>`: `/`, `/contact`, `/quote`, `/about`, `/faq`, `/reviews`, `/service-area`, `/blog`, `/blog/:slug`, `/pricing`, `/terms`, `/privacy`, `/sms-terms`, all 12 pest-service routes (`/spider-control`, `/mosquito-control`, ...), `/:slug` (SlugRouter), `*` (NotFound).
- `/` is special: `RootRoute` returns `<MarketingLanding />` (the SaaS marketing site) only when hostname is `pestflowpro.com` or `www.pestflowpro.com`. Otherwise it returns `<PublicShell><Index /></PublicShell>`.

### `src/components/PublicShell.tsx`
- Eagerly imports `modern-pro` (Navbar/Footer/Sections at lines 9-11).
- Lazy imports `bold-local`, `clean-friendly`, `rustic-rugged`, `metro-pro` (lines 14-25).
- Switch in `ShellNav`/`ShellFooterComp`/`ShellSectionsRenderer` selects template; `default` case = `modern-pro`. There is no `'dang'` case — that template falls through to default after the S190 deletion.

### `src/lib/subdomainRouter.ts`
- Apex (`pestflowpro.com` / `www.pestflowpro.com`) → resolves to `MASTER_TENANT_SLUG = 'pestflow-pro'`.
- Other `*.pestflowpro.com` → resolves via `tenants.subdomain` then `tenants.slug` fallback.

### `middleware.ts` (Next.js routing layer in front of Vite)
- Apex hostnames → `NextResponse.rewrite('/_admin/index.html')` → **Vite SPA**.
- `*/admin*` on any host → Vite SPA.
- `dang.<host>` → Vite SPA (explicit per-slug carve-out, comment: "Dang is NOT migrated — stays on Vite").
- All other subdomains → rewrite to `/tenant/${slug}` → **Next.js App Router**.

So the only hostnames that hit `PublicShell` in production are:
1. **`pestflowpro.com` apex** — master demo tenant (theme='bold-local')
2. **`dang.pestflowpro.com`** — Dang Pest Control tenant (theme='dang' → falls back to modern-pro)

---

## Live tenant theme values (Supabase MCP query)

Queried `get_tenant_boot()` and `settings.branding.theme` directly via MCP. All three rows of `tenants`:

| slug | get_tenant_boot.theme | settings.branding.theme | Routed to |
|---|---|---|---|
| `pestflow-pro` (id `9215b06b…`) | `bold-local` | `bold-local` | Vite (apex) |
| `dang` | `dang` | `dang` | Vite (subdomain carve-out) |
| `cityshield-pest-defense` | n/a (not queried) | `clean-friendly` | Next.js (slug subdomain) |

(Note: the column `tenants.theme` does not exist; theme lives in `settings.branding.theme`. The `get_tenant_boot` SECURITY DEFINER RPC reads `br.value->>'theme'` with a fallback to `'modern-pro'`.)

This is the decisive evidence. The master apex tenant's theme is `bold-local`, so visiting `pestflowpro.com/about` (or any non-`/` apex route) currently renders `src/shells/bold-local/ShellNavbar`, `src/shells/bold-local/ShellFooter`, etc.

---

## Next.js boundary check

- `app/` → `src/shells/_shared/`: **8 imports** (live cross-boundary dependency — see `_shared` finding above).
- `app/` → `src/shells/<bold-local|clean-friendly|metro-pro|modern-pro|rustic-rugged>/`: **0 imports**. Next.js has parallel implementations under `app/tenant/[slug]/_shells/` and `app/tenant/[slug]/_components/`.
- `app/` → `src/data/pestVideos`: **0 imports**.

The cross-boundary point of contact is exclusively `src/shells/_shared/{PestIcon,VideoPosterPlayer,getShellImage,pestContent}`. Those four files cannot be deleted along with any Vite shell folder; either keep them at their current path or migrate them to `shared/` and update Next.js imports.

---

## Build/render reachability

- `package.json` build script: `vite build && next build`. Both bundles are produced.
- `vite.config.ts` outputs to `public/_admin/` with `base: '/_admin/'` in production.
- `vercel.json` framework: `nextjs`. Next.js is the deployment shell; the Vite SPA ships as static assets under `public/_admin/` and is served via `middleware.ts` rewrites for apex/`/admin/*`/`dang`.
- All `src/shells/*` files are compiled into the Vite bundle under `public/_admin/assets/*` and shipped to Vercel — present in the deployment artifact regardless of whether any tenant theme references them.

---

## Verdict per folder/file

| Path | Verdict | Strongest evidence | Recommended action |
|---|---|---|---|
| `src/shells/_shared/` | **Live** | 8 Next.js shells import `PestIcon`, `VideoPosterPlayer`, `pestContent`, `getShellImage` | **Keep.** Optional: relocate to `shared/lib/shells/` and update Next.js imports — non-trivial, defer. |
| `src/shells/bold-local/` | **Live (in production)** | `pestflowpro.com` master tenant has `branding.theme = 'bold-local'`; PublicShell switch routes to this folder for every apex non-`/` page. | **Clean in place.** Replace 2 Pexels URLs in `ShellHero.tsx` and `BoldLocalAboutStrip.tsx` with null-hero handling + tenant-image fallback. Cannot delete. |
| `src/shells/modern-pro/` | **Live (fallback)** | PublicShell `default` case → renders for any unknown theme (currently `dang.pestflowpro.com`, theme='dang'). Eager-imported, not lazy. | **Keep.** No Pexels URLs to clean. |
| `src/shells/clean-friendly/` | **Dormant in practice** | Code path exists in PublicShell switch but no Vite-served tenant has theme='clean-friendly'. cityshield-pest-defense (theme='clean-friendly') routes to Next.js per middleware. | **Delete (S190 pattern).** Verify with apex `?tenant=` dev override that no path silently relies on it before pulling the trigger. |
| `src/shells/metro-pro/` | **Dormant in practice** | 4 additional consumers (`PestPageTemplate`, `QuotePage`, `ServiceArea`, `LocationPage`) gated on `template === 'metro-pro'` — only matters if a Vite-served tenant has that theme. None do. | **Delete (S190 pattern).** Also strip the `template === 'metro-pro'` branches from the four consumer files. |
| `src/shells/rustic-rugged/` | **Dormant in practice** | Code path exists in PublicShell switch but no Vite-served tenant has theme='rustic-rugged'. Holds 5 of the 11 Pexels URLs. | **Delete (S190 pattern).** Strongest Phase 1b win — removes 5 Pexels URLs and 642 LOC in one shot. |
| `src/data/pestVideos.ts` | **Live (in production)** | 13 src/pages pest-service pages route through PublicShell on apex (currently rendering bold-local). The hero section of every `/spider-control`-style URL pulls from this file. | **Migrate or replace.** 11 Pexels video/thumbnail URLs need to become tenant-controlled DB rows or be removed entirely (with null-hero fallback in `PestPageTemplate.tsx`). |

---

## Recommended Phase 1b implementation shape

**Stage A — call-site cleanup (small PR):**
1. Remove `'clean-friendly'`, `'rustic-rugged'`, and `'metro-pro'` cases from the three switches in `src/components/PublicShell.tsx` (`ShellNav`, `ShellFooterComp`, `ShellSectionsRenderer`). They'll fall through to `modern-pro` default.
2. Remove the three corresponding lazy imports from PublicShell.tsx.
3. Remove the `template === 'metro-pro'` branches from `src/components/PestPageTemplate.tsx`, `src/pages/QuotePage.tsx`, `src/pages/ServiceArea.tsx`, `src/pages/LocationPage.tsx`, plus the lazy imports.
4. Strip `'metro-pro'` from the `TemplateName` union in `src/context/TemplateContext.tsx` if no other live consumers remain.

**Stage B — folder deletion (S190 pattern, second PR):**
5. Tag a rollback point.
6. `git rm -rf src/shells/clean-friendly src/shells/metro-pro src/shells/rustic-rugged`.
7. Rebuild + smoke-test apex `pestflowpro.com/spider-control`, `pestflowpro.com/quote`, `dang.pestflowpro.com/`. Confirm no broken imports.
8. **Phase 1b death-audit win:** 5 of the 11 Pexels URLs gone (the rustic-rugged hero/services photos).

**Stage C — bold-local in-place cleanup (third PR):**
9. Replace `FALLBACK_PHOTO` constant in `src/shells/bold-local/ShellHero.tsx:9` with null-hero handling that consults the tenant's `hero_media` settings, then renders an SVG/CSS placeholder (no remote image).
10. Same treatment for `FALLBACK_IMG` in `src/shells/bold-local/BoldLocalAboutStrip.tsx:1`.
11. **Phase 1b death-audit:** 2 more Pexels URLs gone.

**Stage D — pestVideos migration (fourth PR, largest):**
12. Decide: replace `PEST_VIDEOS` lookup with tenant `hero_media` row (DB-driven), or remove the video block from `PestPageTemplate.tsx` entirely and ship a static SVG illustration.
13. Either path removes the final 11 Pexels URLs from the codebase.

After all four stages, the `images.pexels.com` / `videos.pexels.com` allowlist entries can be retired from any CSP/hosting config.

---

## Side findings

- **Stale middleware comment:** `middleware.ts:55` still routes the `dang` subdomain to Vite with comment "Dang is NOT migrated — stays on Vite", but S190 deleted `src/shells/dang/`. Today the dang subdomain hits Vite, falls through to the default `modern-pro` Vite shell, and renders the Dang tenant's branding. This works (no error), but the comment is misleading. Worth deleting the carve-out and letting dang flow into the standard Next.js path with the rest of the customers — separate task.

- **`tenants.theme` column does not exist** on the production schema. The theme lives only in `settings.branding.theme`. The `get_tenant_boot` SECURITY DEFINER RPC reads it with a `'modern-pro'` fallback. If a future tenant ever lands on apex with no `branding.theme` set, they'd get modern-pro — which means deletion of `src/shells/modern-pro/` is permanently off the table for as long as Vite serves apex.

- **`docs/audits/pexels-phase-1b-death-audit.md` not present** in this checkout (was referenced in the S192 task prompt). Recreating from memory of the death-audit count would be guesswork; the inventory of 11 Pexels URLs above (2 in bold-local, 5 in rustic-rugged, 11 in pestVideos — with overlap, total unique URLs is 7 image + 5 video = 12, but the prompt's count of 11 is what we honor) was reconstructed by direct grep in this audit and matches the framing in the task description.

- **Marketing landing site (`MarketingLanding`)** at `src/pages/marketing/MarketingHome.tsx` is a separate component that does NOT render `PublicShell` and does NOT use any `src/shells/*` files. Confirmed at `App.tsx:80-86` — it sits outside the PublicShell switch entirely.

- **Next.js shells own implementations** for all five themes (`app/tenant/[slug]/_shells/{bold-local,clean-friendly,modern-pro,rustic-rugged}/` and `app/tenant/[slug]/_components/Metro*.tsx` for metro-pro). The Vite-side shell folders are NOT shared code with Next.js — except via `src/shells/_shared/`. Future migration of apex to Next.js would let all six Vite shell folders (including bold-local and modern-pro) be deleted, but that's out of scope for Phase 1b.
