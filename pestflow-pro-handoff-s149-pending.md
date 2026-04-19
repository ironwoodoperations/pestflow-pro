# PestFlow Pro — Session Handoff (S149 pending fix)

**Handoff date:** April 18, 2026
**Prior chat:** S143 → S148 shipped successfully; S149 diagnosed but reverted
**Next action in fresh chat:** Ship S149 correctly using the diagnosis below
**Kirk status:** NOT blocked by S149 — launch-ready whenever Scott is ready

---

## TL;DR for the fresh chat

1. **5-shell Next.js migration COMPLETE** (metro-pro, modern-pro, clean-friendly, bold-local, rustic-rugged). Working in production.
2. **S144 tag-based data invalidation works.** Admin saves propagate to public pages via `revalidateTag`.
3. **S149 (CDN edge caching) attempted and reverted.** Root cause now known: 7 untagged fetchers in `app/tenant/[slug]/_lib/queries.ts` use `getServerSupabase()` directly (which carries `cache: 'no-store'`), and even one such call in the render path forces the entire route dynamic — nullifying `export const revalidate = 300`.
4. **The fix is straightforward but needs two questions answered before implementing.** See "S149 Open Questions" below.
5. **Dang Pest Control stays on Vite indefinitely.** He is a bespoke one-off site, NOT part of the 5-shell SaaS system. Do not touch his codebase or the legacy `image_url` / `image_urls` DB columns.

---

## Current state (as of handoff)

- `main` branch at S148 baseline (S149 fully reverted)
- Vercel production: Lone Star + Demo serving via Next.js shells, Dang serving via old Vite build
- Cache-Control on tenant routes: `private, no-cache, no-store, max-age=0, must-revalidate` (expected — this is the S148 baseline, S149 is what will fix it)
- Admin save → public page propagation: working via S144's `revalidateTag` chain
- 5 shells live in `app/tenant/[slug]/_shells/`: metro-pro, modern-pro, clean-friendly, bold-local, rustic-rugged

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
- Edge function secrets: Supabase secrets, NEVER Doppler (Doppler is app-level env only)
- `provision-tenant` edge function always deployed with `--no-verify-jwt`

---

## Architecture truth

### Two product tiers on one codebase

**PestFlow Pro SaaS (template system):**
- Multi-tenant at wildcard subdomain `*.pestflowpro.com`
- 5 reusable Next.js shells tenants pick from
- Shared admin (Vite SPA at `/admin` served via middleware rewrite to `/_admin/index.html`)
- Shared Supabase database
- Tenants: Demo (`pestflow-pro`), Lone Star (`lone-star-pest-solutions`), future

**Dang Pest Control (bespoke one-off):**
- `dangpestcontrol.com` — fully custom design, NOT a shell
- Vite SPA codebase (separate from Next.js tree)
- Reads legacy DB columns `image_url` and `image_urls` — DO NOT drop these
- Shares the same Supabase database
- Permanent configuration — never being "ported" into the 5-shell system
- Optional future: port his bespoke design to Next.js at its own route tree. No rush.

### File layout (Next.js side)

```
app/
  layout.tsx                    # root layout — fonts loaded here (Raleway, Oswald)
  page.tsx                      # marketing homepage
  api/
    revalidate/                 # S144 handler — admin POSTs here to invalidate tags
  tenant/
    [slug]/
      layout.tsx                # tenant layout — resolveTenantBySlug + social links + service pages
      page.tsx                  # tenant home (branches per shell)
      [service]/page.tsx        # service detail (ant-control, termite-control, etc.)
      about/page.tsx
      _lib/
        queries.ts              # THE FILE THAT NEEDS S149 FIXES
      _shells/
        metro-pro/              # S142
        modern-pro/              # S145
        clean-friendly/          # S146
        bold-local/              # S147
        rustic-rugged/           # S148
shared/
  lib/
    cacheTags.ts                # S144 — tenant-scoped tag generators
    supabase/
      server.ts                 # getServerSupabase() with cache: 'no-store'
                                # S149.2 added getServerSupabaseForISR() — REVERTED
    tenant/
      resolve.ts                # resolveTenantBySlug — reads tenants + settings
middleware.ts                   # subdomain → path rewrite, no cache manipulation
```

---

## S149 full diagnosis (from the prior chat)

### What S149 was meant to do

Enable Vercel CDN edge caching on tenant routes. After S144, data-layer caching works via `unstable_cache` + `revalidateTag`, but the rendered HTML is regenerated on every request. At scale this wastes function compute and TTFB.

### What was attempted in the prior chat

- **S149.1:** `export const revalidate = 300` added to `app/tenant/[slug]/layout.tsx`
- **S149.2:** Split `getServerSupabase()` into two clients:
  - `getServerSupabase()` — unchanged, still has `cache: 'no-store'` (for use INSIDE `unstable_cache` callbacks, prevents double-caching footgun where `revalidateTag` busts outer cache but inner Data Cache returns stale data)
  - `getServerSupabaseForISR()` — new, no custom fetch (for use OUTSIDE `unstable_cache`)
  - `resolveTenantBySlug` refactored: tenants-row query uses ISR client outside `unstable_cache`, settings query wrapped in `unstable_cache` with settings tag using inner client
- **S149.3:** Added `revalidatePath()` calls alongside `revalidateTag()` in `/api/revalidate/route.ts` — because `revalidateTag` alone does NOT bust the Full Route Cache (critical Next.js 14 gotcha, confirmed by external review from Perplexity)

### Why it didn't work

After deploy, `Cache-Control` header still returned `private, no-cache, no-store`. Verified diagnostic:

**Root cause: 7 functions in `app/tenant/[slug]/_lib/queries.ts` use bare `cache()` (React per-request dedup) instead of `unstable_cache`, and call `getServerSupabase()` directly.** The `cache: 'no-store'` fetch option propagates into the render. Next.js 14 marks any route dynamic if it contains even one `cache: 'no-store'` fetch — `revalidate = 300` is silently overridden.

### The 7 untagged fetchers (inventory)

| Function | Called from | Shape needed |
|---|---|---|
| `getTestimonials(tenantId)` | `page.tsx` (tenant home) | Tag: probably `settings(tenantId)` if admin edits go through settings table, OR new `testimonials(tenantId)` tag |
| `getAllBlogPosts(tenantId)` | `page.tsx` (tenant home) | New tag needed: `blog(tenantId)` |
| `getBlogPost(tenantId, slug)` | Blog detail route | New tag: `blog(tenantId, slug)` or fold into `blog(tenantId)` |
| `getAllLocations(tenantId)` | `[service]/page.tsx` city branch | New tag: `locations(tenantId)` |
| `getLocation(tenantId, slug)` | `[service]/page.tsx` city branch | Same as above or scoped per-location |
| `getFaqItems(tenantId)` | Service pages / home | Tag: `settings(tenantId)` or new `faq(tenantId)` |
| `getTeamMembers(tenantId)` | Tenant home or About page | Tag: `settings(tenantId)` or new `team(tenantId)` |

### Clean functions for reference (already tagged correctly)

| Function | Tags | Pattern to replicate |
|---|---|---|
| `getPageContent` | `page(id, slug)`, `allPages(id)` | ✓ |
| `getAllServicePages` | `allPages(id)` | ✓ |
| `getSocialLinks` | `settings(id)` | ✓ |
| `getHeroMedia` | `settings(id)` | ✓ |
| `getIntegrations` | `settings(id)` | ✓ |

---

## S149 Open Questions (MUST answer before fixing)

Before implementing the fix, the fresh chat MUST resolve these two questions. Do not let Claude Code skip them.

### Q1: What's the admin-side write path and revalidate payload for the 7 untagged entities?

For each untagged function, the fresh chat needs to:

1. Find the admin UI component that writes to that data (likely under `src/features/admin/` or `src/components/admin/`)
2. Identify what table the admin write hits (testimonials, faq_items, team_members, blog_posts, locations — likely these dedicated tables, not settings)
3. Identify what `triggerRevalidate` payload the admin save fires — currently probably `{ type: 'settings', tenantId }` or nothing at all

**Decision matrix for tag shape:**

- **If admin saves already fire `settings` tag** and those entities are semantically "site configuration": wrap the fetcher in `unstable_cache` with `cacheTags.settings(tenantId)`. Simplest.
- **If admin saves DON'T currently fire any revalidate tag** for these entities (likely for blog_posts and locations): extend `cacheTags.ts` with new tag generators (e.g., `cacheTags.blog(tenantId)`), add new cases to `/api/revalidate` handler, wire admin save handlers to POST the new payloads. Then wrap fetchers with matching tags. More work but correct.
- **If admin saves don't use the `triggerRevalidate` helper at all** (direct Supabase writes without POSTing to `/api/revalidate`): fix the admin side first. If these entities are rarely edited, could also accept 300s max staleness via the route TTL as the invalidation mechanism and skip tagging — but then staleness is a product decision, not a bug.

### Q2: Does S144's revalidation flow actually work today?

Test B in the prior chat failed (branding save didn't reflect). This might be:
- Expected because S149 broke something (ruled out — S149 is reverted now)
- Expected because the `/api/revalidate` auth check (tenant_users membership) returns 403 silently
- Expected because Claude Code's S144 implementation of `triggerRevalidate` has a latent bug

Before shipping S149's fix, verify S144's flow:

1. Scott runs the admin branding save test on current (reverted) main: admin → Settings → Branding → change tagline → Save → hard-refresh public site within 10 seconds
2. If it works: S144 is fine, the S149 fix just needs to wrap the untagged fetchers and re-deploy
3. If it DOESN'T work: fix S144 first (likely `/api/revalidate` returning 403 due to tenant_users schema mismatch), then tackle S149

---

## Recommended S149 fix session structure

```
Session prompt structure:
1. Pre-flight: Read queries.ts, list all 7 untagged functions, map each to
   admin write path and current revalidate payload
2. Report Q1 findings: decide tag shape for each function
3. Scott verifies Q2: S144 branding save still works after rollback
4. If Q2 passes: proceed to implementation
   - Wrap each of 7 functions in unstable_cache with approved tag
   - Extend cacheTags.ts with new tag generators if needed
   - Update /api/revalidate handler to handle new tag types
   - Update admin triggerRevalidate callers for new entity types
   - Re-add export const revalidate = 300 (or chosen TTL) to layout.tsx
   - Re-add dual-client pattern in server.ts
   - Re-add revalidatePath() calls in /api/revalidate handler
   - Commit each concern separately
5. Build check (bundle stays under 450 kB, zero TS errors)
6. Local verify (dev server, curl Cache-Control check)
7. Push, production verify 4 tests from original S149 prompt (HIT progression,
   admin save reflects immediately, cross-tenant isolation, Dang untouched)
```

External LLM validation is recommended before the push (Perplexity + Gemini caught the Full Route Cache issue the prior chat would have missed).

---

## Todo list system rules (encoded for any future chat)

Scott uses an HTML todo file that renders in-browser with tap-to-hide persistence. Rules:

### Persistence
- **Stable localStorage key: `pfp_todo`** — NEVER versioned (not `pfp_todo_v18`, `pfp_todo_v22`, etc.)
- Previous versions used versioned keys; this caused dismissed items to resurrect on each update
- Version number appears in HTML `<title>` and `<h1>` sub-line ONLY — for human reference, not in the key
- Reset button in sub-line clears the stable key and reloads

### Color system (9 classes, always the same mapping)
- `red` — Blocking, active crisis
- `green` — Active work, ready, or recently completed
- `blue` — Kirk / Dang launch operational checklist
- `yellow` — Known bugs (non-blocking)
- `orange` — Legal
- `purple` — Post-Kirk features & cleanup
- `teal` — SEO & vertical expansion
- `graydark` — Backlog (future-but-real)
- `gray` — Someday / evaluate

### Structure rules
- Each `<li>` has `data-id="..."` (unique across the file — `act1`, `b1`, `c3b`, `p10`, etc.)
- Click listener toggles `done` class and adds ID to the Set, writes to localStorage
- Each `<li>`: `<strong>Title</strong><br>Description` plus optional `<span class="meta">...</span>` for command hints
- Keep descriptions to 2-3 sentences max

### Content rules
- **REMOVE dead items entirely. Do not just hide them.** Example: Zapier ZAP4 was listed as "deferred pending Stripe live mode" — but Scott abandoned Zapier. Correct action: delete the ZAP4 `<li>` from the HTML entirely. Leaving it as "hidden by default" clutters the markup and breaks if persistence resets.
- When introducing a genuinely NEW item, give it a new unique `data-id`. It renders normally (not pre-dismissed).
- Section order: Active → Kirk → Recently Completed → Housekeeping → Post-Kirk → Known Bugs → Legal → SEO → Backlog → Someday
- Architecture clarifications go in a `.note` div at the top (e.g., "Dang is bespoke, not a shell tenant")

### Version bumping
- Bump `v22 → v23 → v24 ...` when STRUCTURE changes (new sections, color reassignments, major rewording)
- Minor content changes don't require version bump
- Version is display-only, doesn't affect persistence

### CSS boilerplate (maintain exactly as-is across versions)

All styles already match existing files. Copy from the most recent version when creating a new one.

---

## Session workflow (same as always)

1. Scott uploads handoff MD at session start (this document for the fresh chat)
2. Chat generates structured `.txt` prompt files for Claude Code
3. Scott runs: `claude --dangerously-skip-permissions < filename.txt`
4. Claude Code commits after every task, stops at 50% context with plain summary
5. Scott reports Claude Code output back to the chat
6. Chat and Scott decide next steps
7. Session closes with updated handoff MD generated in the chat

### Standing rules for prompts
- Always instruct Claude Code to READ files before making changes
- Always state "copy verbatim, fix only import paths" when porting code (recurring failure mode: Claude Code rebuilds components from scratch)
- Commit after every task with descriptive message
- Stop at 50% context; output plain summary only — never generate markdown context files
- Bundle related fixes into a single session prompt rather than splitting across sessions
- For high-stakes changes (caching, auth, payments): validate with external LLMs (Perplexity + Gemini) BEFORE pushing

### Communication style
- Scott is direct and fast-moving. Short answers preferred.
- Voice input artifacts common (transcription typos)
- Windows-only dev environment — never reference Mac, Cmd, or Apple products
- When decisions are made, implement them immediately in the next prompt — don't describe and move on

---

## Key learnings (S142 → S149)

1. **Cache architecture is layered and easy to misunderstand.** Next.js 14 has three independent caches that do NOT cascade invalidation:
   - React `cache()` — per-request dedup, always fresh on next request
   - Data Cache (`unstable_cache` and default `fetch()` caching) — server-level, tag-invalidated
   - Full Route Cache — CDN edge, TTL-bound, requires `revalidatePath()` to bust immediately (not `revalidateTag`)
   - Using `cache: 'no-store'` inside `unstable_cache` is correct (prevents double-caching)
   - Using `cache: 'no-store'` outside `unstable_cache` kills ISR silently

2. **"Copy verbatim, don't rebuild."** Every shell port had failure risk when Claude Code "improved" markup or renamed props. The rule must be stated EXPLICITLY in every porting prompt.

3. **Diagnostic-first prompts save hours.** For cache bugs especially, forcing Claude Code to inventory/report findings BEFORE proposing fixes prevents wrong-fix iteration loops.

4. **External LLM validation catches what one LLM misses.** Perplexity caught the Full Route Cache gap in S149. Gemini caught the `headers()` dynamic-forcing concern. Cost: 3 minutes of prompt writing. Value: prevented a broken admin-save-appears-stuck deploy.

5. **DevTools Network Payload tab is the source of truth for write bugs.** In S142.10 hours of debugging a save issue ended in 2 minutes once Scott captured the actual POST payload.

6. **The 50% context rule applies to chat sessions, not Claude Code.** Claude Code has its own context management internally. Scott manages chat context via handoff MDs.

7. **Memory file has drift over time.** Some items in Scott's memory file may be stale (e.g., originally mentioned Zapier workflows). Trust the MD handoff over implicit memory for active work.

8. **Architecture is crisp now:**
   - PestFlow Pro SaaS = 5 Next.js shells, shared admin, `*.pestflowpro.com` subdomain
   - Dang = bespoke Vite one-off at `dangpestcontrol.com`
   - Two product tiers, one codebase monorepo, shared Supabase

---

## Kirk launch queue (NOT blocked by S149)

Kirk can launch the moment Scott has these five things ready. No S149 dependency.

1. DNS cutover: A @ → 76.76.21.21 · CNAME www → cname.vercel-dns.com · TTL 300
2. Google Search Console verification code — email to scott@ironwoodoperationsgroup.com
3. Google Place ID
4. Facebook connect via admin Social tab (Zernio OAuth)
5. Click Launch Approved in Reveal Queue

Once DNS propagates and Dang is live on `dangpestcontrol.com`, wait 24-48 hours before considering any further Dang-related changes (like the optional future port to Next.js). The Vite build is stable and Kirk is Scott's first paying client — no experiments.

---

## Known bugs (non-blocking, carry forward)

- Settings → Hero Media tab label still says "Hero Media" (should say "Master Hero Image" to match body copy relabeled in S142.8)
- Services dropdown sometimes broken on service pages (pre-existing from Vite, may self-resolve since all shells are now Next.js — re-test)
- Clean-friendly shell has dark-on-dark nav contrast with dark primary palettes. Sales guidance: pair clean-friendly with light primaries (green, teal, sky blue) only. Future fix: add `--color-nav-text` palette var.
- Dashboard queries filter `leads` by hardcoded Demo tenant ID instead of current tenant UUID
- `social_posts.scheduled_at` query returns 400 — column is actually `scheduled_for`

---

## Housekeeping (after S149 ships)

- Upload real Lone Star Master Hero image (replace Ridgeline placeholder)
- Clean up placeholder text leaks in Lone Star pages: "This is showing up in Hero Subtext", "where DOES THIS END UP", "Pest Control ServicesXXXXX"

---

## Someday / evaluate

- Replace Zapier workflows (Scott abandoned Zapier — audit what automations it handled and pick replacement tooling per workflow)
- Vapi AI phone assistant
- Twilio customer SMS
- Pool / Lawn / HVAC / Roofing verticals (PoolFlow Pro, etc.)
- Ruflo / Claude Flow multi-agent eval (triggers: 10+ paying tenants, new vertical, first dev hire)
- AI Gateway → LiteLLM (after 10+ paying clients)
- Directus CMS evaluation
- Vercel Edge Config KV store
- Rotate Supabase service role key
- Doppler cleanup (typo vars SUPABSE_URL, SUPBSE_API_SECRET, stale _2 duplicates)
- Optional: port Dang's bespoke design to Next.js at its own route tree (separate from 5-shell system). No rush.

---

## End of handoff
