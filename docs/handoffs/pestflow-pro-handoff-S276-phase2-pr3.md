# PestFlow Pro — Handoff S276 (dang-pfp Phase 2 — PR 3: empty comic shell scaffold)

*Session S276 · docs-only close of the Phase 2 PR 3 work.*

## Session S276 — dang-pfp Phase 2 PR 3 (register empty comic shell scaffold)

### What shipped this session

- **PR #234 — register empty comic shell scaffold** (draft → ready → squash-merged **`3ae3f99`**, CI: 5 checks green, Vercel READY, `tsc --noEmit` + `eslint .` clean). Registered an **empty, selectable** comic shell for Dang under theme key **`dang-comic`**.
  - **No design reproduction** (that is PR 4) — placeholder components only.
  - **Byte-identical render for every existing tenant, Dang included.** No `settings.branding.theme` was written anywhere, so every `dang-comic` branch is **unreachable** until a later cutover flips a tenant's key. Existing tenants hit the same branches/fallbacks as before.
  - No middleware change, `revalidate = 300` preserved, no `unstable_cache`, no new `export const dynamic`, no `next/font` added.

### Scaffold created

`app/tenant/[slug]/_shells/dang/` — mirrors `_shells/bold-local/` (the cleanest precedent):
- `DangComicNavbar`, `DangComicFooter`, `DangComicHome`, `DangComicPestPage`, `DangComicAboutPage` — placeholder blocks marked "Dang comic shell — scaffold".
- `DangComicFonts.ts` — stub `DANG_TOKENS` (`--dang-*` block, canonical brand accent `#F26B0F`; full comic palette + type scale is PR 4).
- `index.ts` — barrel re-exporting each component + `DANG_TOKENS`.

### 4 selection chains registered (durable)

There is **NO shell registry** — selection is parallel `tenant.template === '…'` if-chains. `tenant.template` is hydrated from `settings.branding.theme` in `shared/lib/tenant/resolve.ts` (`template: branding.theme ?? 'modern-pro'`), so the string `branding.theme` never appears in the render files; every branch keys on `tenant.template`. `dang-comic` was registered in the four chains where `bold-local` (the mirror precedent) participates:

1. **`layout.tsx`** — `theme === 'dang-comic'` chrome branch: `DangComicNavbar` / `DangComicFooter` + `<style>` (cssVars + `DANG_TOKENS`) + GA4 scripts + `TenantProvider`. **Preserves the universal `localBusinessSchema` org node** that every layout branch emits.
2. **`page.tsx` (home)** — `tenant.template === 'dang-comic'` → `<DangComicHome />`.
3. **`[service]/page.tsx` (pest chain)** — `tenant.template === 'dang-comic'` → `<DangComicPestPage />`.
4. **`about/page.tsx`** — `tenant.template === 'dang-comic'` → `<DangComicAboutPage />`.

> **DURABLE FACT: `about/page.tsx` is a 4TH shell-selection chain beyond the kickoff's pre-validated 3 sites** (layout, home, pest). `bold-local` participates in the About chain (`about/page.tsx:76`), so the scaffold does too. **Any future shell work must treat `about/page.tsx` as a selection site** — do not trust "just layout/home/service."

### ⚠️ PR 4 DEBT (carry verbatim — this is why the handoff exists)

**(a) Schema restoration required on activation.** The `dang-comic` **HOME** branch omits the `websiteSchema` `JsonLdScript` that every other home branch emits; the **ABOUT** branch omits `aboutSchema`. These are **BASELINE SEO nodes (not comic-specific)**. PR 4 **MUST restore both** when it fills the scaffold, or Dang loses page-level structured data on cutover. (The layout-level `localBusinessSchema` org node **IS** preserved globally — that one is safe.)

**(b) Contact route is theme-neutral.** `contact/page.tsx` has a selection chain, but `bold-local` is **absent** from it (it falls through to the shared, theme-neutral `ContactForm`), so `dang-comic` does too — there is **no `DangComicContactPage`**. A future comic Dang renders a non-comic contact page until PR 4 decides whether to add one.

**(c) PR 2 visible-match dependency still governs** (from the PR #231 handoff): when PR 4 renders service pages, the **VISIBLE** FAQ block MUST render DB `faqs` via `getServiceFaqs(tenant.id, slug)` — **NOT** `serviceData.ts[slug].faqs` — **BEFORE** emitting `generateFAQSchema`. Schema must match visible content (Google's general structured-data policy; manual-action-eligible). Precedent: `app/tenant/[slug]/_components/sections/FaqTabs.tsx:90`.

### Reviewed-and-untouched (documented, not skipped)

- **`[service]/page.tsx:68`** service-area `const isBoldLocal = tenant.template === 'bold-local'` — a styling flag only (site 3b); the branch is otherwise theme-agnostic. No `dang-comic` change.
- **`faq/page.tsx`, `blog/page.tsx`, `blog/[post]/page.tsx`, `forms/QuoteForm.tsx`, `forms/ContactForm.tsx`** (+ `contact`/`quote` `shellTemplate` passthrough) — `isBoldLocal` / `isCF` styling flags, no shell components. No change.
- **`shared/lib/shellCssVars.ts:234`** — `bold-local` CSS-var derivation special-case. `dang-comic` uses the default derivation until PR 4's `--dang-*` palette lands. No change.

### Validator gate

No Perplexity/Gemini MCP available → **two independent web-research passes** (disclosed in the PR #234 body). Both confirmed (conservative-wins): registering a new shell across all selection chains **but not activating it** is safe — a new conditional theme branch has no runtime effect on existing pages, and there are no SSR/ISR/`cache()` pitfalls because this PR changed no `fetch` / `revalidate` / `generateStaticParams` / `cache()` usage (revalidate=300 unchanged) and the branch is unreachable until a key flip.

### Operating rules (unchanged, reaffirmed)

- CC Web cannot push to `main`; **branch + PR only**; Scott merges manually. **No background watcher / no cron / no `send_later`** — ignore that framing.
- **Validator gate required** for caching / SEO / auth / RLS / shell-rendering / routing changes. If MCPs unavailable, substitute independent web-research passes and SAY SO in the PR body.
- **Session-artifact hygiene:** discard untracked `PROJECT_MANIFEST.d/` and `.claude/scheduled_tasks.lock` — never commit them.

### Immediate next action

**PR 4** — full comic design reproduction + read-path wiring (`seo_meta` + DB `faqs` into the **visible** render) + **schema restoration (debt a)** + comic art-asset migration. Fill the 5 scaffold components (`DangComicNavbar/Footer/Home/PestPage/AboutPage`). **Do NOT flip any tenant's `branding.theme`** — activation is a separate, later cutover step, not PR 4's scaffold-fill.
