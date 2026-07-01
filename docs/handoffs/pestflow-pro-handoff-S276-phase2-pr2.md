# PestFlow Pro — Handoff S276 (dang-pfp Phase 2 — PR 2: FAQ JSON-LD connective layer)

*Session S276 · docs-only close of the Phase 2 PR 2 work.*

## Session S276 — dang-pfp Phase 2 PR 2 (FAQ JSON-LD connective layer)

### What shipped this session

- **PR #231 — FAQ JSON-LD connective layer** (merged, squash `efb0390`, CI green). The thin infra layer for future per-service FAQ JSON-LD:
  - `app/tenant/[slug]/_lib/faqCategoryMap.ts` (NEW) — versioned `FAQ_CATEGORY_TO_SLUG` map anchored to `SERVICE_SLUGS` from `serviceData.ts` via a **module-load assertion** (a slug typo throws at import — build / first SSR render — never silently at runtime). Derived reverse `SLUG_TO_FAQ_CATEGORY` lookup. `General → null` (home/global bucket, not a service page); `Wasps & Yellow Jackets → wasp-hornet-control` (the canonical `SERVICE_SLUGS` member; `wasp-control` is only a redirect alias, not in the set).
  - `getAllFaqs` / `getServiceFaqs` in `app/tenant/[slug]/_lib/queries.ts` — mirror the existing loader convention (`cache()` + `getServerSupabaseForISR()` service-role + `.eq('tenant_id')` + graceful `[]` + `console.error`). `getAllFaqs` orders deterministically by `category, sort_order, question`. `getServiceFaqs` is slug-guarded (`/^[a-z0-9-]+$/`, the `getSeoMeta` precedent), resolves slug→category via the reverse map, returns `[]` **without a DB call** when no category maps (termite pages, unknown slug), else filters the single cached `getAllFaqs` fetch in memory (no extra round-trip).
  - **No new schema emission** anywhere; `app/tenant/[slug]/faq/page.tsx` untouched (it already SSR-emits `FAQPage` from DB `faqs`); `revalidate=300` preserved; no `unstable_cache`, no new `dynamic`. Skipped the optional `buildServicePageJsonLd` helper (would just forward args to the two existing builders — indirection without payoff; PR 4 calls them directly).
  - **Byte-identical no-op for all non-Dang tenants** (zero `faqs` rows → both loaders return `[]`; nothing calls them yet either, so no live-route behavior change).
- **PR #232 — untrack `tsconfig.tsbuildinfo` build artifact** (merged, `381685b`). Pre-existing repo-hygiene bug found while working PR #231: `tsconfig.tsbuildinfo` (incremental-build cache) was tracked while its sibling `tsconfig.next.tsbuildinfo` was gitignored. `git rm --cached` + added to `.gitignore`. Kept as a **separate** PR, not folded into #231.

### FAQ death-audit result (durable reference — carry forward)

Verified live (read-only) at kickoff:

- Source of truth = single base table `public.faqs` (**NO view**). Columns: `id, tenant_id, question NOT NULL, answer NOT NULL, category NOT NULL DEFAULT 'General', sort_order INT DEFAULT 0, created_at`.
- **NO `page_slug` / service / location column.** FAQs key on `tenant_id + category` only.
- **55 rows, ALL Dang** (`1611b16f-381b-4d4f-ba3a-fbde56ad425b`), zero rows any other tenant. Clean plaintext, no HTML/entities/placeholders (2 answers contain a double-quote — safe via `JSON.stringify`).
- `sort_order` is **uniform within each category** (it orders categories, not rows) → intra-category order is otherwise undefined; the loader MUST order deterministically: `ORDER BY category, sort_order, question`.
- Category labels (exact): Ants, Bed Bugs, Fleas & Ticks, General, Mosquitoes, Roaches, Rodents, Scorpions, Spiders, Wasps & Yellow Jackets.
- **Category ≠ service slug**, and there is NO clean programmatic join → an explicit map is required (`faqCategoryMap.ts`). `General` (18 rows) = home/global bucket, not a service page. `termite-control` / `termite-inspections` have **no** FAQ category → they resolve to zero FAQs (correct — not a gap).

### Rationale correction (durable)

- Google **deprecated FAQ rich results May 7 2026**; a pest-control site was **never eligible** for them anyway (restricted to government/health sites since Aug 2023). So "Google FAQ rich-result compliance" is a dead justification.
- The real value of FAQ JSON-LD is **AI-retrieval** — Perplexity / ChatGPT / Gemini / Bing crawlers parse FAQ markup for citations (AEO). That is the reason to ship this infra.
- The **visible-match deferral to PR 4 still holds**, re-cited to Google's **general** structured-data policy — *"structured data must match the content visible to users"* — which is still in force and **manual-action-eligible** (independent of the deprecated FAQ rich-result feature). Emitting DB-sourced FAQ schema while service pages still visibly render hardcoded `serviceData.ts` FAQs would be a schema/visible mismatch.

### ⚠️ PR 4 dependency (carry verbatim)

When the comic shell renders service pages, the **visible** FAQ block MUST render DB `faqs` via `getServiceFaqs(tenant.id, slug)`, **NOT** `serviceData.ts[slug].faqs`, **BEFORE** emitting `generateFAQSchema` on that page. Precedent for the DB-with-fallback render pattern already exists at `app/tenant/[slug]/_components/sections/FaqTabs.tsx:90`. **Schema and visible content must match.**

### Validator note

The gate was run as a **live Google Search Central check** (not just two self-research passes). It **PASSED on the deferral logic** and **CORRECTED the rationale** — from "Google FAQPage rich-result compliance" (dead: deprecated May 7 2026, vertical never eligible) to AI-retrieval / AEO, with the deferral re-cited to Google's general structured-data-must-match-visible-content policy. The deferral decision (emit in PR 4, at the visible-render switch) is unchanged.

### Operating rules (unchanged, reaffirmed)

- CC Web cannot push to `main`; **branch + PR only**; Scott merges manually. **No background watcher / no cron / no `send_later`** — that framing is meaningless here, ignore it.
- **Validator gate required** for caching / SEO / auth / RLS / shell-rendering / routing changes. If the MCPs are unavailable, substitute independent web-research passes and SAY SO in the PR body.
- **Death-audit DB state before drafting any implementation prompt.**
- All Supabase/Vercel ops run via MCP from Claude.ai directly — never hand Scott SQL/migrations. Repo writes = CC Web only.
- **Session-artifact hygiene:** discard untracked `PROJECT_MANIFEST.d/` and `.claude/scheduled_tasks.lock` — never commit them.

### Immediate next action

Run the **PR 3 kickoff** — register the empty comic shell at `app/tenant/[slug]/_shells/dang/`. Open with a **grep of EVERY `if (tenant.template === …)` chain** across the codebase (there is **NO shell registry** — selection is parallel conditionals in `layout.tsx`, `page.tsx`, `[service]/page.tsx`, and possibly others; do not trust just those three).
