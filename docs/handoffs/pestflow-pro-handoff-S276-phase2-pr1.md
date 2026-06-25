# PestFlow Pro — Handoff S276 (dang-pfp Phase 2 kickoff — PRs 1 + wildcard redirect)

*Session S276 · 2026-06-25 · docs-only close of the Phase 2 kickoff work.*

## Session S276 — dang-pfp Phase 2 kickoff (PRs 1 + wildcard redirect)

### What shipped this session

- **PR #228:** host-preserving `*.com` → `*.ai` 308 redirect as the **FIRST check in `middleware.ts`** (before tenant resolution, early-return). Root cause found by investigate-first: a `*.com` → `*.ai` redirect already existed in `vercel.json` but `permanent:false`, and middleware's `.com` → `/tenant/<slug>` rewrite was serving the 200 duplicate before it ever ran. Guard: `hostname.endsWith('.pestflowpro.com')` AND `extractSubdomain` non-null (apex + `www` both return null via `APEX_HOSTS`). 308, path+query preserved. `vercel.json` flipped to `permanent:true` for consistency. Verified in prod (308/301/200, no loop).
- **PR #229:** shared `seo_meta` SSR metadata infrastructure (see ROADMAP entry). `resolveSiteUrl` (`.ai` host + custom-domain map, 6 call sites refactored), `buildPageMetadata` (precedence + OG→meta fallback), `getSeoMeta` loader (React `cache()` + service-role + slug guard), `generateMetadata` on service/location/blog/home. Regression-gated byte-identical on the no-row path; `revalidate=300` preserved; no `unstable_cache`, no new `dynamic`.
- **Data fix (via Supabase MCP, not a PR):** 12 `seo_meta` `meta_title` rows across 6 non-Dang seed tenants had a truncated wrong-brand suffix (`| Ironcla` / `| Ironcl` — leftover from an "Ironclad" template). Rebuilt each with the correct per-tenant brand taken from the home-page title suffix. Dang's data was already clean and untouched. No cache purge needed (consumer code wasn't deployed yet at fix time).

### Key facts for PR 2 (JSON-LD infrastructure)

- **Single existing JSON-LD emitter:** `app/tenant/[slug]/_components/JsonLdScripts.tsx` (exports `JsonLdScript`). Currently used **ONLY** by `DefaultPestPage` (emits `Service` schema). The 5 named shells emit **NO** per-page `Service`/`FAQ` JSON-LD — that's the net-new surface for PR 2.
- **The bold-local shell DOES already emit** a `LocalBusiness`/`HomeAndConstructionBusiness` `@graph` node at the **layout level** (confirmed in prod HTML on urban-strike). PR 2 must **not duplicate** that — it adds per-**PAGE** `Service` + `FAQPage` schema, layered with the existing org node.
- **`seo_meta` table:** 228 rows / 7 tenants, 100% `meta_title` + `meta_description` coverage, `og_*` ~39% platform-wide (Dang 100%). **FAQ content source:** confirm whether FAQ Q&A lives in `seo_meta`, a dedicated `faq` table, or shell-hardcoded — **death-audit this before drafting PR 2.**
- **Pattern to follow:** PR 2 = shared infra (loader in `_lib/queries.ts` with React `cache()` + service-role + slug guard; a `buildJsonLd` helper in `shared/lib`; wired into the same per-route `generateMetadata` or a server component). **NO `unstable_cache`, NO new `dynamic`, keep `revalidate=300`.**

### Operating rules (unchanged, reaffirmed)

- CC Web cannot push to `main`; **branch + PR only**; Scott merges manually. **No background watcher / no cron / no `send_later`** — that framing is meaningless here, ignore it.
- **Validator gate (Perplexity + Gemini, conservative-wins) required** for caching / SEO / auth / RLS / shell-rendering / routing changes. If the MCPs are unavailable, substitute **two independent web-research passes and SAY SO in the PR body**.
- **Death-audit DB state before drafting any implementation prompt;** count populated text columns with `<> ''` (empty strings inflate `COUNT`).
- **DB-edit tasks are incomplete until cache purge ships the same turn** (`revalidatePath` pattern form with the `'layout'` qualifier).
- All Supabase/Vercel ops run via MCP from Claude.ai directly — **never hand Scott SQL/migrations**. Repo writes = CC Web only.

### Immediate next action

Run the **PR 2 kickoff** (shared service/location/FAQ JSON-LD infrastructure) in a fresh chat. **Death-audit the FAQ content source first.**
