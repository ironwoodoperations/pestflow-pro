# PestFlow Pro — Session Handoff (S149 shipped)

**Handoff date:** April 18, 2026
**Prior chat:** S142 → S148 shipped; S149 attempted/reverted; then S149.1 → S149.10 shipped this session
**Status:** ISR caching is live on all tenant public routes. No pending S149 work.

---

## TL;DR for the fresh chat

1. **S149 complete.** Tenant public routes now serve from Vercel's CDN edge cache with 300s TTL. Admin saves bust on-demand via `revalidateTag` + `revalidatePath`. Verified in production with `x-vercel-cache: HIT` on repeat requests.
2. **Main branch is clean and healthy.** No pending fixes. Next session picks up whatever's next on the roadmap.
3. **Key hard-won lesson: don't trust the build output route table alone.** A route can build as `●` and still be dynamic at runtime. The authoritative ISR signal is `initialRevalidateSeconds` in `.next/prerender-manifest.json`. Details in "Key learnings" below.

---

## Current state (verified in production)

- `main` at S149.10 baseline
- Cache-Control on tenant routes: `public, max-age=0, must-revalidate` (Vercel-standard client-facing ISR header)
- `x-vercel-cache: HIT` on repeat requests — CDN edge caching confirmed working
- Admin save → public page propagation: working via revalidateTag + revalidatePath('layout')
- 5 shells live: metro-pro, modern-pro, clean-friendly, bold-local, rustic-rugged
- Build output: all 10 tenant routes show `●` (SSG/ISR)
- `prerender-manifest.json`: all 10 tenant routes show `initialRevalidateSeconds: 300`

---

## Constants — NEVER change

- Supabase project ID: `biezzykcgzkrwdgqpsar`
- Dang tenant ID: `1611b16f-381b-4d4f-ba3a-fbde56ad425b`
- Demo tenant ID: `9215b06b-3eb5-49a1-a16e-7ff214bf6783`
- Lone Star tenant ID: `41343677-c998-4c8e-b52f-2ddee487e629`
- GitHub repo: `ironwoodoperations/pestflow-pro`
- Branch: `main` only — no PRs, no feature branches
- Model: always `claude-sonnet-4-6` — no exceptions
- Bundle hard limit: 450 kB shared JS (currently 87.3 kB)
- Dev server: `doppler run -- npm run dev`
- All files under 200 lines
- Edge function secrets: Supabase secrets, NEVER Doppler
- `provision-tenant` edge function always deployed with `--no-verify-jwt`

---

## Architecture truth (unchanged, restated for continuity)

### Two product tiers on one codebase

**PestFlow Pro SaaS (template system):**
- Multi-tenant at wildcard subdomain `*.pestflowpro.com`
- 5 reusable Next.js shells
- Shared admin (Vite SPA at `/admin` via middleware rewrite to `/_admin/index.html`)
- Shared Supabase database
- Tenants: Demo, Lone Star, future

**Dang Pest Control (bespoke one-off — NOT part of any S149 work):**
- `dangpestcontrol.com` — custom Vite SPA, separate from Next.js tree
- Reads legacy DB columns `image_url` and `image_urls` — DO NOT drop
- Never touched in shared-platform sessions

### S149 caching architecture (now complete)

Three independent cache layers with explicit invalidation chain:

1. **Data Cache** (`unstable_cache`) — wraps all 12 server-side data fetchers with entity-scoped tags
2. **Full Route Cache** (route-level ISR) — `revalidate = 300` on layout AND every page file
3. **CDN Edge Cache** (Vercel) — honors `initialRevalidateSeconds` from prerender-manifest, serves `x-vercel-cache: HIT`

Admin save flow:
- Admin tab POSTs to `/api/revalidate` with `{ type, tenantId, tenantSlug }`
- Handler calls `revalidateTag(cacheTags.{entity}(tenantId))` → busts Data Cache
- Handler calls `revalidatePath('/tenant/${tenantSlug}', 'layout')` → busts Full Route Cache + CDN edge

---

## S149 as shipped (10 sub-steps)

| Step | Change |
|------|--------|
| S149.1 | Added 5 tag generators to `cacheTags.ts`: testimonials, blog, locations, team, faq |
| S149.2 | Added 5 type cases + `revalidatePath('/tenant/${slug}', 'layout')` to `/api/revalidate/route.ts` |
| S149.3 | Added `getServerSupabaseForISR()` to `server.ts` (plain createClient, no fetch override) |
| S149.4 | Refactored `resolveTenantBySlug` dual-client: tenant lookup outside `unstable_cache`, settings inside |
| S149.5 | Wrapped 7 untagged fetchers in `unstable_cache` with entity tags |
| S149.6 | Wired `triggerRevalidate` into 5 admin tab save handlers (Testimonials, Blog, Locations, Team, FAQ) |
| S149.7 | Added `export const revalidate = 300` to `app/tenant/[slug]/layout.tsx` |
| S149.8 | Added `generateStaticParams() { return [] }` to all 10 tenant page files |
| S149.9 | Diagnostic session — confirmed no dynamic function calls anywhere in render tree |
| S149.10 | Added `export const revalidate = 300` to all 10 tenant page files (layout-level alone wasn't enough) |

---

## File layout after S149

```
app/
  layout.tsx                              # fonts only
  page.tsx                                # marketing home
  api/
    revalidate/route.ts                   # handles 7 entity types + revalidatePath('layout')
  tenant/
    [slug]/
      layout.tsx                          # revalidate = 300 + resolveTenantBySlug
      page.tsx                            # revalidate = 300 + generateStaticParams
      about/page.tsx                      # revalidate = 300 + generateStaticParams
      [service]/page.tsx                  # revalidate = 300 + generateStaticParams
      blog/page.tsx                       # revalidate = 300 + generateStaticParams
      blog/[post]/page.tsx                # revalidate = 300 + generateStaticParams
      contact/page.tsx                    # revalidate = 300 + generateStaticParams
      faq/page.tsx                        # revalidate = 300 + generateStaticParams
      quote/page.tsx                      # revalidate = 300 + generateStaticParams
      reviews/page.tsx                    # revalidate = 300 + generateStaticParams
      service-area/page.tsx               # revalidate = 300 + generateStaticParams
      _lib/queries.ts                     # 12 fetchers all wrapped in unstable_cache
      _shells/                            # 5 shells (unchanged)
shared/
  lib/
    cacheTags.ts                          # 7 generators: page, settings, testimonials, blog, locations, team, faq
    supabase/
      server.ts                           # getServerSupabase (no-store, inside unstable_cache)
                                          # getServerSupabaseForISR (plain, outside unstable_cache)
    tenant/resolve.ts                     # dual-client pattern
middleware.ts                             # unchanged from S148 — subdomain rewrite only, no cache headers
```

---

## Key learnings (S149 specifically)

### 1. Build-output `●` is NOT sufficient evidence of ISR

The Route (app) table in `npm run build` can show `●` (SSG/ISR) while `.next/prerender-manifest.json` shows `initialRevalidateSeconds: null` for the same route. The build marker reflects static analysis; the manifest reflects what Next.js actually emitted. **Always verify ISR via the manifest, not the table.**

Diagnostic chain for ISR debugging, in order of authority:
1. `.next/prerender-manifest.json` → `initialRevalidateSeconds` must be a number, not null
2. `.next/server/app/.../` → should contain `.html` artifacts (absence acceptable only if `generateStaticParams` returns `[]` and on-demand generation works)
3. Compiled chunk inspection → the page's bundle must contain a `revalidate` export
4. Production curl → `x-vercel-cache: HIT` on second request within TTL
5. Build Route table `●` marker (weakest signal; can mislead)

### 2. Layout-level `revalidate` does NOT cascade to child pages

In Next.js 14 App Router, route segment config (`revalidate`, `dynamic`, etc.) is per-segment. A layout's `revalidate = 300` governs the layout segment's caching; page-level ISR TTL in `prerender-manifest.json` comes from the page's own `revalidate` export. The official Next.js docs example explicitly shows the export on BOTH layout AND page for this reason.

**Rule for future ISR work:** if a route has both a layout and pages that need ISR, export `revalidate` from both.

### 3. `generateStaticParams` is mandatory for ISR on dynamic segments

Without `generateStaticParams` on a `[slug]`-style route, `revalidate` is silently ignored at the route level (regardless of what's in the layout). Return `[]` if you don't want build-time pre-rendering — that still enables on-demand ISR. Direct docs quote: *"You must return an empty array from generateStaticParams or utilize export const dynamic = 'force-static' in order to revalidate (ISR) paths at runtime."*

### 4. Middleware Cache-Control manipulation is WRONG

Setting `Cache-Control` or `Vercel-CDN-Cache-Control` on `NextResponse.rewrite()` to force CDN caching does work at a byte-stream level, but it bypasses the ISR invalidation pipeline — `revalidatePath` can no longer bust the CDN copy. Admin saves would appear stuck until the TTL expires. External LLMs (Perplexity + Gemini) both confirmed this independently. **If tenant pages serve `private/no-store`, fix the underlying dynamic rendering cause; don't paper over it with middleware headers.**

### 5. External LLM validation paid for itself twice

Claude Code's first two S149 diagnoses were wrong:
- **First:** "Middleware rewrite blocks Vercel CDN caching" — wrong. Rewrites to ISR routes work fine on Vercel.
- **Second:** "Wrap `resolveTenantBySlug` outer lookup in `unstable_cache`" — wrong. Supabase client wasn't the issue.

The **third diagnosis** (inspecting prerender-manifest + compiled chunks) was right. Perplexity and Gemini agreed on the right direction before Claude Code got there.

Standing rule reinforced: for any caching / auth / payment change, pull a second opinion from Perplexity and Gemini before implementing. Cost is 3 minutes. Multiple times in this session it saved pushes that would have broken things.

### 6. Ask for empirical evidence, not just hypotheses

S149.9 (the diagnostic that actually found the right cause) worked because the prompt forced inspection of `.next/` build artifacts — real files, real JSON — rather than just grepping source. When a bug's symptom (`private/no-store`) can be caused by multiple layers, hypothesis-chasing wastes deploy cycles. Demanding artifact inspection short-circuits that.

---

## Known bugs (carried forward, non-blocking)

- Settings → Hero Media tab label still says "Hero Media" (should be "Master Hero Image" to match body copy from S142.8)
- Services dropdown sometimes broken on service pages (pre-existing; may self-resolve now that all shells are Next.js — re-test)
- Clean-friendly shell has dark-on-dark nav contrast with dark primary palettes. Sales guidance: pair clean-friendly with light primaries (green, teal, sky blue) only. Future fix: add `--color-nav-text` palette var.
- Dashboard queries filter `leads` by hardcoded Demo tenant ID instead of current tenant UUID
- `social_posts.scheduled_at` query returns 400 — actual column is `scheduled_for`
- `faqs` vs `faq_items` table name mismatch. `FaqTab.tsx` writes to `faqs`; `getFaqItems` fetcher reads from `faq_items`. Pre-existing data integrity issue. Decide canonical table and migrate in a dedicated session.

---

## Housekeeping (after S149)

- Upload real Lone Star Master Hero image (replace Ridgeline placeholder)
- Clean up placeholder text leaks in Lone Star pages: "This is showing up in Hero Subtext", "where DOES THIS END UP", "Pest Control ServicesXXXXX"

---

## On the horizon

- Upgrade `generateStaticParams` on tenant pages from `return []` to actual tenant slug list from Supabase. Gives build-time pre-rendering for current tenants; new tenants still get on-demand ISR. ~30 min work. Not urgent.
- Full E2E test flow with Lone Star Pest Solutions (fictional Stripe-sandbox client) — still pending from S128
- Stripe live mode key swap (manual task)
- FAQ table mismatch resolution (see Known bugs)

---

## Someday / evaluate

- Replace Zapier workflows (Scott abandoned Zapier — audit what automations it handled, pick per-workflow replacements)
- Vapi AI phone assistant
- Twilio customer SMS
- Pool / Lawn / HVAC / Roofing verticals (PoolFlow Pro, etc.)
- AI Gateway → LiteLLM (after 10+ paying clients)
- Directus CMS evaluation
- Vercel Edge Config KV store
- Rotate Supabase service role key
- Doppler cleanup (typo vars SUPABSE_URL, SUPBSE_API_SECRET, stale `_2` duplicates)

---

## Session workflow (unchanged)

1. Scott uploads handoff MD at session start
2. Chat generates structured `.txt` prompt files for Claude Code
3. Scott runs: `claude --dangerously-skip-permissions < filename.txt`
4. Claude Code commits after every task, stops at 50% context with plain summary
5. Scott reports Claude Code output back to the chat
6. Chat and Scott decide next steps
7. Session closes with updated handoff MD generated in the chat

### Standing rules for prompts

- READ files before making changes
- State "copy verbatim, fix only import paths" explicitly when porting code
- Commit after every task with descriptive message
- Stop at 50% context; output plain summary only — never generate markdown context files
- Bundle related fixes into single session prompt
- For high-stakes changes (caching, auth, payments): validate with external LLMs (Perplexity + Gemini) BEFORE pushing
- **NEW after S149:** for ISR/caching issues, require prerender-manifest.json inspection as part of the diagnostic, not just grep + build route table

### Communication style

- Scott is direct and fast-moving. Short answers preferred.
- Voice input artifacts common (transcription typos)
- Windows-only dev environment — never reference Mac, Cmd, or Apple products
- When decisions are made, implement them immediately in the next prompt — don't describe and move on

---

## End of handoff
