# dang-pfp Phase 2 PREREQ — Shell-Mechanism Death-Audit (read-only, source-of-truth on `main`)

**Date:** 2026-06-25 · **Scope:** 100% read-only investigation. No build, no code changes, no migrations.
**Branch HEAD audited:** `main` @ `168b987` (PR #225 merged).
**Why:** Prior shell-architecture notes are from **S265 (2026-06-14) and are STALE** — S267/S268 shipped theming changes after. This doc reports what is **literally on `main` today**, with exact paths + line refs, as the build basis for the Dang comic shell.

> **One-line bottom line:** The comic shell goes under **`app/tenant/[slug]/_shells/dang/`** (NOT `src/shells/`), is wired by **adding a branch to the per-`tenant.template` if-chains in `layout.tsx` + `page.tsx` + `[service]/page.tsx`** (there is no registry), and **all of its per-route SEO — seo_meta-driven titles/descriptions, self-canonical, Service/PestControlService/FAQPage JSON-LD — is NET-NEW infrastructure**: the existing shells SSR a LocalBusiness/WebSite/Article/About/FAQ set but emit **no per-route metadata and no per-service/location schema**.

---

## 1. Shell registry + selection

**1a. Where shells physically live.** ✅ Confirmed `app/tenant/[slug]/_shells/` — 5 shell dirs:
`bold-local/`, `clean-friendly/`, `metro-pro/`, `modern-pro/`, `rustic-rugged/`.
`src/shells/` exists but contains **only** `src/shells/_shared/` (4 files: `PestIcon.tsx`, `pestContent.ts`, `VideoPosterPlayer.tsx`, `getShellImage.ts`). **No shell component directories live under `src/shells/`.** `src/shells/_shared/` is NOT dead — it is imported by the Next app, e.g.:
```
app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyHero.tsx:4
  import { getShellImage } from '../../../../../src/shells/_shared/getShellImage';
```
So: shared utils under `src/shells/_shared/` are live; shell **components** are exclusively under `app/tenant/[slug]/_shells/`.

**1b. The registry/selection.** ⚠️ **There is NO registry map/object and NO single switch.** Shell selection is an inline `if (tenant.template === '…')` chain, **duplicated across three route files** as parallel chains:
- `app/tenant/[slug]/layout.tsx:118–212` — nav/footer + CSS-var injection + LocalBusiness JSON-LD per theme. Default fallback: **modern-pro** (lines 197–212).
- `app/tenant/[slug]/page.tsx:78–183` — homepage section composition per theme. Default fallback: **metro-pro** (lines 171–182).
- `app/tenant/[slug]/[service]/page.tsx:139–155` — per-theme PestPage. Default fallback: `DefaultPestPage`.
```ts
// page.tsx
if (tenant.template === 'modern-pro') { … }
if (tenant.template === 'bold-local') { … }
if (tenant.template === 'clean-friendly') { … }
if (tenant.template === 'rustic-rugged') { … }
return ( /* metro-pro default */ );
```
Note the **two different default fallbacks** (layout→modern-pro, home→metro-pro).

**1c. Where the template key is read.** `shared/lib/tenant/resolve.ts` → `resolveSettings()`:
```ts
// shared/lib/tenant/resolve.ts:30
template: branding.theme ?? 'modern-pro',
```
Source = `settings` table row `key='branding'`, JSONB `value.theme`. Fallback default `'modern-pro'`. Resolved by `resolveTenantBySlug` (wrapped in React `cache()`), which first resolves the tenant from `tenants` by `slug` OR `subdomain` (line 66–70), then reads `settings` keys `branding`/`business_info`/`seo` (line 7–11). It is **JSONB `settings.branding.theme`, NOT a `tenants` column and NOT a `get_tenant_boot` RPC.**

**1d. Is `src/shells/` referenced by the Next public app?** Only `src/shells/_shared/*` (getShellImage, pestContent, PestIcon, VideoPosterPlayer) is imported by app shells. No shell components there. (`src/lib/shellThemes.ts` is a separate file — see §4, Vite-only.)

> **VERDICT (1): contradicts-assumption.** `_shells/` is correct (good), but the build assumption of a "registry that associates theme key → shell component" is FALSE — selection is scattered parallel if-chains keyed on `tenant.template`. Registering the comic shell = adding a branch to **each** of `layout.tsx`, `page.tsx`, `[service]/page.tsx` (and any other route that forks on template), not editing one map. `src/shells/` is dead for components → comic shell lives at `app/tenant/[slug]/_shells/dang/`.

---

## 2. Tenant-scoped public read path

**2a/2b. The loader + scoping.** Shared module `app/tenant/[slug]/_lib/queries.ts` — **per-table `supabase.from(...)` SELECTs**, each `.eq('tenant_id', tenantId)`, each wrapped in React `cache()`. **Not an RPC**; there is no `get_tenant_boot`.
```ts
// queries.ts:5–13 (representative)
export const getPageContent = cache(async (tenantId, pageSlug) => {
  const supabase = getServerSupabaseForISR();
  const { data } = await supabase.from('page_content').select('*')
    .eq('tenant_id', tenantId).eq('page_slug', pageSlug).maybeSingle();
  return data;
});
```
Loaders present: `page_content`, `blog_posts`, `location_data`, `testimonials`, `team_members`, plus `settings` (`social_links`/`hero_media`/`integrations`/`seo`/`business_info`). **`faqs` is NOT in queries.ts** — read inline server-side in `app/tenant/[slug]/faq/page.tsx:53`. ⚠️ **`seo_meta` is NOT read anywhere in `app/`** (only `src/components/**` Vite admin + the Vite-only `src/components/StructuredData.tsx`). ⚠️ **`image_library` is NOT read in `app/`** (only `src/hooks/useImageLibrary.ts`, Vite admin).

**2c. Read client.** `getServerSupabaseForISR()` (`shared/lib/supabase/server.ts:31`) uses **`SUPABASE_SERVICE_ROLE_KEY`** — **service role, RLS bypassed.** NOT the anon key. Instantiated per call.
```ts
// shared/lib/supabase/server.ts:31–35
export function getServerSupabaseForISR() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnv();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
}
```
Tenant isolation on the public path is therefore enforced **entirely by the app-level `.eq('tenant_id', …)` filters**, not by RLS.

> **VERDICT (2): closed, with flags.** Read path is well-defined (per-table cached SELECTs, service-role, `.eq` tenant scoping). But **the comic shell needs a `seo_meta` loader that does not exist today**, and `image_library` is likewise absent from the SSR path. Service-role means tenant scoping must be coded carefully in every new query.

---

## 3. SSR metadata emission (current mechanism)

**3a. `generateMetadata` coverage.** Exists in **only 5 places**: `layout.tsx:29` + the 4 legal pages (`privacy`, `terms`, `sms-terms`, `accessibility`). **No `generateMetadata` on** home, `[service]` (service + service-area), blog index, `blog/[post]`, about, contact, reviews, faq. Those routes inherit the **layout's tenant-level** title/description:
```ts
// layout.tsx:33–35
const title = tenant.meta_title || businessName;
const description = tenant.meta_description || `${businessName} — professional pest control services`;
```
`tenant.meta_title/meta_description` come from `settings.seo` (resolve.ts:49–50) — **one generic pair per tenant, NOT per-page `seo_meta`.**

**3b. Canonical.** Set via `shared/lib/tenantSeoMetadata.ts:20` `alternates: { canonical: url }`, but `url` includes a path **only if `pathname` is passed**:
```ts
// tenantSeoMetadata.ts:14–20
const siteUrl = `https://${tenant.subdomain ?? tenant.slug}.pestflowpro.com`;
const url = opts.pathname ? `${siteUrl}${opts.pathname}` : siteUrl;
return { alternates: { canonical: url }, openGraph: {…}, twitter: {…} };
```
Only the 4 legal pages pass `pathname` (e.g. `privacy/page.tsx` passes `pathname: '/privacy'`). The **layout passes none** → every non-legal route (home/service/location/blog) emits `canonical = siteUrl` (the **root**). Also note `siteUrl` is hardcoded to `*.pestflowpro.com` — **not** the custom domain `dangpestcontrol.com`.

**3c. JSON-LD (server-side).** `JsonLdScript` is a **pure server component** (no `'use client'`, no hooks) that writes `<script type="application/ld+json">` into raw HTML (`app/tenant/[slug]/_components/JsonLdScripts.tsx`). Server-emitted schema today:
| Schema | Where | Coverage |
|---|---|---|
| LocalBusiness | `layout.tsx` (every theme branch) | all routes |
| WebSite | `page.tsx` (home) | home |
| AboutPage | `about/page.tsx`, `DefaultAboutPage.tsx` | about |
| FAQPage | `faq/page.tsx:70` `generateFAQSchema(faqs)` | faq |
| Article/BlogPosting | `blog/[post]/page.tsx:36` | blog posts |
| **Service** | **`DefaultPestPage.tsx:48` ONLY** | **fallback templates only** |
| PestControlService / location | — | **none** |

⚠️ The 5 named shell PestPages (`ModernProPestPage`, `BoldLocalPestPage`, `CleanFriendlyPestPage`, `RusticRuggedPestPage`, `MetroProPestPage`) emit **no Service JSON-LD** — only the `DefaultPestPage` fallback (for unrecognized templates) does. The `[service]` service-area branch emits **no** location schema.

**3d. Does any route read `seo_meta` for SSR title/desc/canonical?** **No.** Server metadata is derived from `settings.seo` + hardcoded per-legal-page strings. The only code reading `seo_meta` is the **Vite SPA** (`src/components/StructuredData.tsx`, a `'use client'` component using `react`-`useEffect` + `useTenant`) and admin editors — all client-side, none in `app/`.

> **VERDICT (3): contradicts-assumption (the big one).** Per-route SSR metadata from `seo_meta` (title/description/self-canonical) and per-service/location JSON-LD **do not exist in the public Next app today** — the existing shells ship a generic, layout-level title/description, a root-pointing canonical, and only LocalBusiness/WebSite/About/FAQ/Article schema. The S276 matrix's **"diff-and-take-better SSR guard" has nothing on the SSR side to diff against**: rendering `seo_meta` server-side per route is **net-new infrastructure** the comic shell (or a shared metadata layer) must introduce, not a tweak to an existing mechanism.

---

## 4. Shell color authority (post-S267/S268 state)

**4a. `computeShellCssVars` — the server authority.** `shared/lib/shellCssVars.ts` (311 lines). `computeShellCssVars(template, primaryColor, accentColor)` returns the `--color-*` map; `shellCssVarsString()` serializes it; the **layout injects it server-side**:
```ts
// layout.tsx:94–96, then per-theme: <style dangerouslySetInnerHTML={{ __html: cssVars }} />
const cssVars = shellCssVarsString(
  computeShellCssVars(tenant.template, tenant.primary_color, tenant.accent_color));
```
`branding.primary_color` flows through to `--color-primary` for modern-pro / clean-friendly / metro-pro / rustic-rugged (preset + custom paths, lines ~247+). The file's own header calls it the *"server-side equivalent of applyShellTheme() from src/lib/shellThemes.ts."*

**4b. `BL_TOKENS` — bold-local still hardcodes its own palette.** `app/tenant/[slug]/_shells/bold-local/BoldLocalFonts.ts:17` defines a hardcoded `--bl-*` token list (charcoal surfaces `#0F1216`, amber accent `#F5A623`, etc.). It is injected **separately** from `computeShellCssVars`:
```ts
// layout.tsx:169 (bold-local branch)
<style dangerouslySetInnerHTML={{ __html: cssVars + `:root{${BL_TOKENS}}` }} />
// layout.tsx:172 — the shell PAINTS from --bl-*, not from --color-*:
style={{ backgroundColor: 'var(--bl-surface)', color: 'var(--bl-text)' }}
```
And `computeShellCssVars` has an explicit **bold-local guard that ignores `primary_color`** (charcoal canonical, S267):
```ts
// shellCssVars.ts:230–243
if (template === 'bold-local') {
  const resolvedAccent = accent && /^#[0-9a-f]{6}$/i.test(accent) ? accent : base['--color-accent'];
  vars['--color-accent'] = resolvedAccent; vars['--color-primary'] = resolvedAccent; …
  return vars;  // surfaces stay fixed charcoal; primary_color cannot re-warm the shell
}
```
`clean-friendly` follows the same pattern with `CF_TOKENS` (`layout.tsx:152`).

**4c. `src/lib/shellThemes.ts` — Vite-SPA-only, off the public path.** Imported **only** by `src/` files (`src/main.tsx`, `src/context/TenantBootProvider.tsx`, `src/components/**`, `src/pages/intake/**`). The Next app (`app/`, `shared/`) **does not import it**; `shellCssVars.ts` references it **only in comments** as its "server twin." So `applyShellTheme()` runs only in the Vite admin/SPA, never on a public tenant page.

**Single authority for a public page TODAY:** `computeShellCssVars` (in `shared/lib/shellCssVars.ts`), server-injected via `<style>` in `layout.tsx`, is the authority for the legacy `--color-*` system. **But** the two newest shells (bold-local, clean-friendly) paint from a **parallel hardcoded token block** (`--bl-*` / `--cf-*`) that `primary_color` does **not** flow into. So the practical three-source picture is:
1. `computeShellCssVars` → `--color-*` — **live, server-injected, primary flows** (for the 4 palette-driven shells).
2. per-shell `--bl-*` / `--cf-*` hardcoded token blocks — **live, server-injected, palette-independent** (bold-local, clean-friendly).
3. `src/lib/shellThemes.ts` `applyShellTheme()` — **Vite-SPA-only, OFF the public Next path** (effectively retired for public render).

> **VERDICT (4): partially-resolved.** The Vite/SPA fork (source #3) is off the public path — good, one source gone. `computeShellCssVars` is the single server authority for `--color-*`. **But a per-shell hardcoded-palette fork (`--bl-*`/`--cf-*`) is the live norm for high-design shells**, deliberately bypassing `primary_color`. For the comic shell this is actually the **precedent to follow**: Dang wants a FIXED brand palette and the DB `branding.primary_color = #F97316` is **shadowed/wrong** (live canonical is `#F26B0F`). So inject `#F26B0F` as **one authority via a hardcoded `--dang-*` (comic) token block** + a bold-local-style guard branch in `computeShellCssVars` that ignores `primary_color`. "One authority" is achievable, but it is **token-block + computeShellCssVars guard (two coordinated edits)**, not a single function.

---

## BLOCKING FLAGS FOR PHASE 2

- **(A) `src/shells/` is dead for components — comic shell MUST go under `app/tenant/[slug]/_shells/dang/`.** The S265-era "build under `src/shells/`" assumption is STALE; only `src/shells/_shared/` (shared utils) is live there. *(contradicts-assumption)*
- **(B) No central shell registry.** Selection is parallel `if (tenant.template === …)` chains in `layout.tsx`, `page.tsx`, and `[service]/page.tsx` (plus PestPage variants). Registering the comic shell = adding a branch to **each** route's chain, keyed on `branding.theme`. Mind the **two inconsistent default fallbacks** (layout→modern-pro, home→metro-pro). *(contradicts-assumption)*
- **(C) Per-route SSR metadata is net-new, not a tweak.** `generateMetadata` exists only on `layout` + 4 legal pages; service/location/blog inherit a **generic tenant-level** title/description; **canonical defaults to the site ROOT** for non-legal routes; **`seo_meta` is never read server-side**. The S276 diff-and-take-better guard requires building a per-route `seo_meta`-driven metadata layer (title/description/self-canonical) from scratch. *(contradicts-assumption)*
- **(D) Per-page Service / PestControlService JSON-LD does not exist in the named shells.** Only `DefaultPestPage` (fallback) emits `Service`; the 5 real shells emit none, and location pages emit no schema. Dang's matrix (Service+FAQPage on services, PestControlService on locations) is **all net-new** in the comic shell. *(contradicts-assumption)*
- **(E) No `seo_meta` (or `image_library`) loader in the SSR read path.** `app/tenant/[slug]/_lib/queries.ts` must gain a tenant-scoped `seo_meta` reader; the read client is **service-role (RLS bypassed)**, so every new query must carry its own `.eq('tenant_id', …)`. *(needs-decision)*
- **(F) Color authority partially forked + canonical domain unresolved.** `computeShellCssVars` is the server authority for `--color-*`, but bold-local/clean-friendly paint from hardcoded `--bl-*`/`--cf-*` blocks ignoring `primary_color`. Comic shell should adopt that token-block pattern with the **single canonical `#F26B0F`** (DB `#F97316` is shadowed — do not use) + a `computeShellCssVars` guard branch. Separately, `siteUrl` is hardcoded to `*.pestflowpro.com`; the **`dangpestcontrol.com` canonical/OG host is unresolved** and blocks correct canonicals at cutover. *(needs-decision)*

---

*Read-only audit. No DB writes, no code changes, no migrations. All findings verified against files on `main` @ `168b987` this session.*
