# QA REPORT — Shared `seo_meta` SSR metadata infrastructure (Phase 2, PR 1)

**Branch:** `feat/seo-meta-metadata-infra`

---

## Build / typecheck / lint / tests

| Gate | Command | Result |
|------|---------|--------|
| Typecheck | `tsc --noEmit -p tsconfig.next.json` | ✅ exit 0, no errors |
| Build | `next build` | ✅ Compiled successfully; all `app/tenant/*` routes prerender as `●` (SSG/ISR) or `ƒ` (dynamic); `revalidate` intact |
| Lint | `eslint app/tenant shared/lib/*` | ✅ 0 errors (only pre-existing `react-refresh/only-export-components` warnings, which fire on every page exporting `generateMetadata` incl. untouched privacy/terms; new shared files are warning-free) |
| Unit tests | `vitest run` | ✅ **99/99 tests pass** |

**Pre-existing test-suite failures (NOT caused by this PR):** 8 suites under `supabase/functions/*` fail at *import* time with `Only URLs with a scheme in: file and data are supported by the default ESM loader. Received protocol 'https:'`. These are Deno edge-function tests that import from `https://` URLs (Deno convention); vitest's Node ESM loader cannot resolve them. They collect **0 tests** and are unrelated to this diff (no edge function was touched).

---

## Non-Dang tenant verification (`urban-strike`, subdomain `urban-strike`)

Verified deterministically against **live DB-shaped inputs** (rows pulled read-only from Supabase `biezzykcgzkrwdgqpsar` this session) via `shared/lib/buildPageMetadata.test.ts` (9 assertions, all green). The dev server requires Doppler + live Supabase, so exercising the pure helpers against the actual row shapes is the strongest deterministic proof and ships as a permanent regression test.

### 1. Service page canonical now resolves to `.ai` (not `.com`) ✅
`resolveSiteUrl({slug:'urban-strike', subdomain:'urban-strike'})` → `https://urban-strike.pestflowpro.ai`.
For `pathname:'/pest-control'`, canonical = `https://urban-strike.pestflowpro.ai/pest-control`. Asserted `.not.toContain('.pestflowpro.com')`.

### 2. A page WITH a `seo_meta` row picks up its title ✅
Live `urban-strike` `home` row → `meta_title = "Dallas TX Pest Control | Urban Strike"`.
`buildPageMetadata(urbanStrike, {pathname:'/', seoMeta: homeRow, …})`:
- `title` = `"Dallas TX Pest Control | Urban Strike"` (from the row)
- `alternates.canonical` = `https://urban-strike.pestflowpro.ai`
- `metadataBase.href` = `https://urban-strike.pestflowpro.ai/`
- `openGraph.title` = the row's `og_title`

### 3. A page WITHOUT a row falls back unchanged ✅ — see Regression below.

### 4. OG → meta fallback for empty `og_*` ✅
Live service rows store `og_title=''`, `og_description=''`. `buildPageMetadata` resolves `openGraph.title` to the chosen **meta** title (`"General Pest Control Dallas TX | Urban Strike"`) and `openGraph.description` to the meta description — empty strings correctly treated as absent.

---

## REGRESSION GATE — byte-identical for the no-row / generic-fallback path ✅

**Claim proven:** for a page with **no `seo_meta` row**, the resolved `title`/`description` (and their OG mirrors) are byte-identical to what the route emitted before this PR. The single intended delta is the canonical **host** (`.com` → `.ai`, PR #228) and the now-per-path canonical (both explicitly in scope).

**Why byte-identical follows from the precedence chain.** Before this PR, the 4 PART D routes had no own `generateMetadata`; they inherited the layout's:
```
title       = tenant.meta_title       || businessName
description  = tenant.meta_description || `${businessName} — professional pest control services`
```
`buildPageMetadata`'s precedence is `seo_meta → tenant settings.seo → fallback`. With `seoMeta = null`:
- middle tier = `tenant.meta_title` / `tenant.meta_description` (the exact values the layout used), and
- the generic `fallback` passed by each route is `{title: businessName, description: "${businessName} — professional pest control services"}` — identical to the layout's `|| …` tail.

So the resolved strings collapse to exactly the prior expression.

**Proof route — home (`/`) on `urban-strike` with empty tenant `settings.seo`:**

| Field | Before PR (layout-inherited) | After PR (`buildPageMetadata`, no row) | Identical? |
|-------|------------------------------|----------------------------------------|------------|
| `title` | `Urban Strike Pest Defense` | `Urban Strike Pest Defense` | ✅ |
| `description` | `Urban Strike Pest Defense — professional pest control services` | same | ✅ |
| `openGraph.title` | `Urban Strike Pest Defense` | same | ✅ |
| `openGraph.description` | `…professional pest control services` | same | ✅ |
| `alternates.canonical` | `https://urban-strike.pestflowpro.`**`com`** | `https://urban-strike.pestflowpro.`**`ai`** | **intended delta (PR #228)** |

Asserted by `buildPageMetadata.test.ts` → `describe('REGRESSION GATE …')`:
- empty tenant SEO → generic fallback strings (byte-identical);
- tenant-level SEO present → middle tier used verbatim;
- canonical = `.ai`, `.not.toContain('.pestflowpro.com')`.

---

## Validator gate — second opinions (reconciliation)

Perplexity / Gemini MCPs are **not available in this environment**, so per the spec I ran **two independent web-research passes** instead: (1) Claude Code WebSearch, (2) Tavily `advanced`. **Stated explicitly here and in the PR body.** Full reconciliation is in the PR body; summary:

- **(a) per-route `generateMetadata` reading a CMS-like source under ISR** — both passes confirm the standard App-Router pattern (Vercel Academy's own example fetches by slug inside `generateMetadata` and sets canonical/OG/twitter). ISR is provided by the `revalidate = 300` segment config, not the loader. ✅ matches design.
- **(b) React `cache()` vs `unstable_cache`** — Next.js docs: non-`fetch` DB/CMS loaders may use either `react.cache()` (per-request dedup) **or** `unstable_cache` (cross-request persistence). `unstable_cache` is forbidden by the spec; `cache()` is the existing fetcher pattern and the conservative choice. **Conservative-wins → `cache()`.** ✅
- **(c) `metadataBase` + absolute canonical** — docs confirm both absolute canonical URLs and `metadataBase`-relative resolution are valid; combining them (absolute canonical + `metadataBase` for relative OG images) is safe belt-and-suspenders. ✅

---

## Out of scope (untouched, per spec)
- Dashboard `seo_meta` WRITE path + revalidate-on-write → PR 1.5.
- Diff-and-take-better logic → PR 4.
- Comic shell → later PR.
- About page `generateMetadata` (not in PART D's list; about retains layout-inherited metadata and only gets the `resolveSiteUrl` refactor for its JSON-LD).
