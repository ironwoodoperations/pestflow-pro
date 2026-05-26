# S243 — AI Proxy (Emergency) — Wave 1 Death Audit

**Session:** S243 (Wave 1 — investigate only)
**Date:** 2026-05-26
**Branch:** `s243/wave1-investigate`
**Author:** Claude Code (Web)
**Status:** Wave 1 audit. **STOP at gate** — Scott reviews before Wave 2 (spec) unlocks. No code, no spec, no merge.
**Originating evidence:** S242 Wave 1 P0 (PR #122, `docs/audits/s242-auto-attach-spec.md` → `## OQ2 evidence`). S242 is paused until S243 ships.

> 🛑 **STOP CONDITION TRIPPED — P3.** The exposed key is **not** behind the admin login wall. The Vite admin SPA builds to `public/_admin/` (the Next.js static dir) and is served as unauthenticated static JS at `https://<domain>/_admin/assets/*.js`. A SPA delivers its JS — with any build-inlined `VITE_ANTHROPIC_API_KEY` — to the browser *before* the client-side login gate runs. **The production key is fetchable by anonymous users, not just logged-in admins.** This invalidates the staged-rotation assumption: see §3 and Open Question OQ-R. Scott pinged.

---

## 1. Threat-model summary

- **Where the key lives:** `VITE_ANTHROPIC_API_KEY`, read via `import.meta.env.VITE_ANTHROPIC_API_KEY` in 9 frontend modules (10 fetch call sites). Vite **inlines `VITE_`-prefixed vars into the JS bundle at build time** — the value becomes a string literal in the shipped chunk.
- **How it's served:** `vite.config.ts` sets `base: '/_admin/'` and `build.outDir: 'public/_admin'`. Next.js serves `public/` at the web root, so the admin bundle is downloadable at `https://pestflowpro.ai/_admin/assets/<chunk>.js` (and per-tenant hosts). Static assets have **no auth**.
- **Who can extract it:** anyone who can load `/_admin/` or fetch an asset URL — i.e. **any anonymous visitor**, not merely a logged-in admin or a holder of the shared `admin@demo.com` credential. The React login gate protects *data/API*, not the *static JS*.
- **Abuse vector:** extracted key → unlimited direct calls to `api.anthropic.com/v1/messages` billed to the platform Anthropic account. No per-tenant cap, no attribution, no kill-switch short of rotating the key (which breaks all 9 features until redeploy).
- **Rotation-window tradeoff:** the kickoff's staged plan ("rotate last, after all 9 migrate") assumed login-gated exposure. **§3 shows the key is publicly reachable**, so the marginal risk of an extra migration window is higher than assumed. OQ-R asks Scott to confirm rotate-immediately (accepting a feature-break window now) vs. rotate-last.

---

## 2. Call-site inventory (P1 + P2)

**P2 widening grep** (`grep -rn "api.anthropic.com|VITE_ANTHROPIC|anthropic-dangerous-direct-browser-access" src/ public/`): 10 source files matched. Nine are the call sites below. The tenth, `src/components/admin/ContentPageForm.tsx:225`, references `VITE_ANTHROPIC_API_KEY` **only in button UI text** (`title={!apiKey ? 'Set VITE_ANTHROPIC_API_KEY to enable' : ...}`) and triggers `ContentTab.generateAI` via an `onGenerateAI` prop — **not an independent Anthropic call.** `grep "x-api-key" src/` → the same 9 modules. **No 10th call site. Migration scope = 9 modules / 10 calls** (stop condition "25+" not tripped).

**`.env` scrub target:** `.env.example:3` → `VITE_ANTHROPIC_API_KEY=your-anthropic-key-here`. Wave 3 must remove/rename. (No real key tracked in git; `public/_admin/assets/*.js` is **git-ignored** — the local build artifact here contains only the var *name* in error strings, since this env built without a key.)

| # | Site (file:lines) | Feature | model / max_tokens | `system`? | Response handling | stream | tools / vision | Trigger gating |
|---|---|---|---|---|---|---|---|---|
| 1 | `social/NewCampaignModal.tsx:109–123` | AI Campaign post batch | sonnet-4-6 / 4000 | no | `content[0].text`, strip ```` ```json ````, `JSON.parse` (array) | no | none | admin, `canAccess(3)` Pro+ (SocialTab) |
| 2 | `social/useComposer.ts:95–99` (`generateCaptions`) | Single-post captions | sonnet-4-6 / 1000 | no | `content[0].text`, split `---CAPTION---` | no | none | admin; per-tier **daily limit** (`aiDailyLimit`) |
| 3 | `social/useComposer.ts:118–122` (`getSmartSchedule`) | Best post time | sonnet-4-6 / 300 | no | `content[0].text`, strip, `JSON.parse` | no | none | admin (composer) |
| 4 | `social/ContentQueueTab.tsx:116–129` | Bulk smart schedule | sonnet-4-6 / 500 | no | `content[0].text`, strip, `JSON.parse` (array) | no | none | admin (queue tab) |
| 5 | `admin/ContentTab.tsx:140–144` | Service-page copy | sonnet-4-6 / 1000 | no | `content.map(i=>i.text).join`, strip, `JSON.parse` | no | none | admin (Content tab) |
| 6 | `admin/seo/SeoKeywordsTab.tsx:31–44` | SEO keyword ideas | sonnet-4-6 / 1000 | no | `content.map(...).join`, strip, `JSON.parse` (array) | no | none | admin (SEO tab) |
| 7 | `admin/seo/useSeoAiGenerate.ts:34–48` | SEO metadata | sonnet-4-6 / 512 | **yes** | `content[0].text`, strip, `JSON.parse` | no | none | admin (SEO tab) |
| 8 | `ironwood/RedirectMapPanel.tsx:170–~205` | URL redirect mapping | sonnet-4-6 / 2048 | no | `content[0].text`, `JSON.parse` | no | none | **Ironwood-only** (`admin@pestflowpro.com`) |
| 9 | `lib/ai/generateBlogDraft.ts:33–52` | Blog draft | sonnet-4-6 / 3500 | **yes** | `content[0].text`, strip, `JSON.parse`; throws on `!res.ok` | no | none | admin (Blog editor) |
| 10 | `lib/ai/generateBlogSeo.ts:36–~54` | Blog SEO meta | sonnet-4-6 / 600 | **yes** | `content[0].text`, strip, `JSON.parse` | no | none | admin (Blog editor) |

**Cross-cutting P1 facts:**
- **Every** call uses `model: 'claude-sonnet-4-6'` (CLAUDE.md non-negotiable #1) and the `anthropic-dangerous-direct-browser-access: 'true'` header (#3).
- **Auth reality:** all 10 are behind the admin login (8 tenant-admin surfaces, 1 daily-limited composer, 1 Ironwood-ops). **None is anon-triggerable at the UI** — but the *bundle* that contains the key is (see §3). The proxy only needs to serve authed admins.
- Request bodies are uniform: `{ model, max_tokens, messages:[{role:'user',content}], system? }`. **No `temperature`, no `tools`, no `stream`, no image content anywhere.**
- Response handling is uniform: read `content[0].text` (two sites `.map().join()` multi-block), strip ```` ```json ```` fences, `JSON.parse` — except #2 (text split) and the proxy is behavior-preserving so it just returns the raw Anthropic JSON.

## 3. Bundle exposure scope (P3) — **stop condition**

- **No Next.js `src/app`/`src/pages` import of the 9 modules.** `grep` confirms the modules are lazy-loaded only by the **Vite SPA** (`src/pages/admin/Dashboard.tsx:19` `lazy(() => import('../../components/admin/ContentTab'))`, etc.). The public Next.js marketing pages do **not** statically import them, so the key is not in the marketing entry chunk that auto-loads for homepage visitors.
- **But the architecture is hybrid and the admin bundle is public static.** `package.json` `build = build:vite && build:next`. `vite.config.ts`: `base:'/_admin/'`, `outDir:'public/_admin'`, code-split chunks (`ContentTab-*.js`, `SEOTab-*.js`, `SocialTab-*.js`, `BlogTab-*.js`, `ProspectDetail-*.js`). Next.js serves everything under `public/` at the web root.
- **Consequence:** the admin chunks live at predictable, unauthenticated URLs (`/_admin/assets/*.js`). Code-splitting does **not** protect the key — it only defers *loading*; the file is still fetchable directly. Loading `/_admin/` itself ships the chunks to any browser before the React auth check runs. **The production key is reachable without logging in.**
- **Verdict:** the S242 threat model ("logged-in admins only") understated the exposure. This trips the stop condition. **Rotation urgency is now a Scott decision (OQ-R), and the staged "rotate last" plan should be reconsidered.** It does *not* change the migration design (proxy + 9 call sites) — only the timing of rotation.

## 4. CLAUDE.md state (P4)

The pattern was institutionalized by **NON-NEGOTIABLE RULE #3** (verbatim):

> **3. Anthropic browser header:** `'anthropic-dangerous-direct-browser-access': 'true'` — required on every fetch

There is no surrounding rationale paragraph; it sits in the numbered "NON-NEGOTIABLE RULES (violating any of these breaks the app)" list. Two adjacent rules also govern AI calls:

> **1. Model string:** always `claude-sonnet-4-6` — never any other string, ever
> **5. Strip backticks before JSON.parse** — `text.replace(/```json|```/g, '').trim()`

No other CLAUDE.md entry references Anthropic, AI, or browser-direct API access. **Wave 3 must rewrite #3** (its premise — browser-direct calls — is the vulnerability). Rules #1 and #5 remain valid and move *inside* the proxy (model pinning) / stay at call sites (parse). Wave 2 spec proposes the replacement language; Wave 1 does not edit CLAUDE.md.

## 5. Reuse inventory (P5 auth · P6 rate-limit · P7 logging)

### P5 — Auth (template: `seo-analytics/index.ts` + `_shared/auth/requireTenantUser.ts`)
- **Canonical helper** `requireTenantUser(req, requestedTenantId)` → `{ user:{id,email}, tenantId, role }`. Reads `Authorization: Bearer`, `supabase.auth.getUser(token)`, looks up `profiles.tenant_id`+`role`, enforces `profile.tenant_id === requestedTenantId`. `requireTenantAdmin(...)` adds `role === 'admin'`. Throws `AuthError(status, {error})` with `.toResponse()`.
- **`seo-analytics` is the exact shape to copy:** deploy `verify_jwt: true`; `getCorsHeaders(req)`; dual-caller detection — **user JWT** → `requireTenantUser` gate; **service_role JWT** (decoded `role` claim) → internal/cron path. This dual path lets S242's `tag-image-vision` (or any cron) reuse the same proxy later.
- **Coverage gap = the open decision, not a blocker:** the helper enforces *admin identity + tenant ownership* (the locked requirement) but **not tier** (`canAccess(3)`). If server-side tier gating is chosen (OQ-G), Wave 2 adds a small tier read (`settings.subscription` per tenant) — a modest helper extension, not a from-scratch build. Stop condition ("doesn't cover admin case at all") **not** tripped.
- **Ironwood edge case:** site #8 (`RedirectMapPanel`) is Ironwood-ops (`admin@pestflowpro.com`), which may not map to a normal `profiles.tenant_id`. The proxy needs an Ironwood/platform-admin path (or that one call routes differently). Flagged in OQ-I.

### P6 — Rate-limiting (template: `api-quote/index.ts` + `rate_limit_events`)
- Table (`20260511000000_s213a_rate_limit_events.sql`): `rate_limit_events(id BIGSERIAL, key TEXT, created_at TIMESTAMPTZ DEFAULT now())`, index `(key, created_at DESC)`, RLS service-role only.
- Pattern: count `key = '<scope>:<id>'` where `created_at >= now()-window` via `.select('id',{count:'exact',head:true})`; if `>= threshold` → 429; else insert one event row. `api-quote` uses `api-quote:<ip>`, 5 / 10 min.
- **Reuse for proxy:** `key = 'ai-proxy:<tenant_id>'` (per-tenant, since callers are authed). **Caveat:** the `rate-limit-cleanup` cron deletes rows `> 1 hour` old — fine for short windows (per-minute/hour), but a **daily/monthly token quota cannot use this table** (rows vanish). A durable per-tenant usage counter would be a separate table. Window/threshold numbers = Wave 2.

### P7 — Logging / audit (template: `send-credentials-email/index.ts`)
- Pattern: structured `console.log/error` with a **correlation id** (`cid`) + `user.email`; sensitive state also persisted to a DB table (`provisioning_status`).
- **For the proxy:** log every call — `tenant_id, user_id, model, input/output tokens (from Anthropic `usage`), feature_hint (if passed), status, ts` — to console (cheap, in Supabase logs) and recommend a dedicated `ai_proxy_log` table for billing/abuse attribution. Schema finalized in Wave 2.

## 6. Edge-case complexity (P8 vision/tools · P9 streaming)

- **P8 — vision / tools / structured output:** **none of the 10 current calls** send image content, define `tools`, or use a JSON/structured-output mode. They achieve "JSON" purely via prompt instructions + client-side strip-and-parse. The proxy MVP needs **text-only** forwarding. *Forward-looking:* S242's `tag-image-vision` will send image blocks — but that is a **cron→edge-fn** path (service-role), and can either reuse this proxy's service-role branch or stay a separate function. To avoid rework, the proxy should **pass `messages`/`system`/`tools`/`max_tokens` through opaquely** rather than whitelisting fields, so future vision/tool payloads work unchanged.
- **P9 — streaming:** **zero** sites set `stream: true`. Every feature consumes a single JSON response. **Streaming is not load-bearing for any feature** → the proxy MVP is a simple request→JSON-response forwarder; no SSE plumbing. Stop condition ("streaming load-bearing for >1–2 features") **not** tripped.

## 7. Open questions for Scott (binary)

- **OQ-R — Rotation timing [escalated by §3].** The key is publicly reachable, not login-gated.
  - **(A)** Rotate **immediately** now (breaks all 9 AI features until the proxy ships + redeploy), then migrate. *Shortest exposure.*
  - **(B)** Keep the staged plan — migrate all 9, deploy, **rotate last** — accepting a continued public-exposure window for the migration sprint. *(Kickoff's current locked sequence; §3 weakens its premise.)*
  *Recommendation: (B) only if the migration lands within days; otherwise (A) with a brief maintenance note. Scott's call.*
- **OQ-G — Feature-gating location.** Proxy enforces admin auth (locked). Does **tier gating** (`canAccess(3)` etc.) move **server-side** into the proxy via a `feature` body param, or **stay client-side** with the proxy enforcing only "is a real admin"?
  - **(A)** Server-side: proxy reads tenant tier, rejects under-tier `feature` calls. Closes the "compromised admin bypasses UI gate" hole. Small helper extension.
  - **(B)** Client-side only (status quo gating): simpler proxy, but a crafted call from any authed admin can invoke any feature's model use (still rate-limited + attributed).
- **OQ-I — Ironwood path.** Site #8 is platform-ops, not a tenant. Proxy should: **(A)** add a platform-admin branch (`admin@pestflowpro.com` / Ironwood tenant), or **(B)** leave `RedirectMapPanel` on a separate small Ironwood-only proxy. *(A recommended — one proxy.)*
- **OQ-S — Streaming in MVP?** Confirm **defer** (no site needs it) vs. build SSE now for future UX. *Recommendation: defer.*
- **OQ-Q — Quota horizon.** Rate-limit only (short window, reuse `rate_limit_events`) for MVP, or also a **durable daily/monthly token quota** per tenant (new table)? *Recommendation: short-window limit in MVP; durable quota as a fast-follow.*

## 8. Recommended Wave 2 spec outline (do NOT draft until Scott unlocks + validators clear)

1. **Proxy contract** — `ai-proxy` edge fn (`verify_jwt: true`): request `{ tenant_id, feature?, model?, max_tokens, system?, messages, tools? }`; opaque pass-through to `api.anthropic.com/v1/messages`; return Anthropic JSON verbatim. Pin/allowlist `model` to `claude-sonnet-4-6` (absorbs CLAUDE.md #1). Key from `Deno.env.get('ANTHROPIC_API_KEY')` (Edge Function Secret).
2. **Auth** — copy `seo-analytics` dual-path (`requireTenantUser` for users; service-role branch for cron). Per OQ-G, optional server-side tier check. Per OQ-I, Ironwood/platform-admin branch.
3. **Rate-limit** — reuse `rate_limit_events`, `key='ai-proxy:<tenant_id>'`; window/threshold TBD; note the 1-hr cleanup constraint (OQ-Q).
4. **Logging** — `ai_proxy_log` table schema (tenant_id, user_id, model, usage tokens, feature_hint, status, created_at) + structured console logs.
5. **Client migration** — a single `callAi(body)` helper (`src/lib/ai/`) wrapping `supabase.functions.invoke('ai-proxy', { body })`; migrate all 10 call sites to it, changing **only** the transport (request/response handling unchanged). Sites #9/#10 already isolate the call in `src/lib/ai/` — easiest.
6. **`.env` scrub** — remove `VITE_ANTHROPIC_API_KEY` from `.env.example`; confirm Vercel SPA build no longer needs it.
7. **CLAUDE.md** — rewrite non-negotiable #3 (replace "browser header required" with "all Anthropic calls go through `ai-proxy`; never call `api.anthropic.com` from the browser; never use `VITE_ANTHROPIC_API_KEY`"). Keep #1 (model) and #5 (parse).
8. **Rotation runbook** — per OQ-R outcome: rotate the Anthropic key, set the new key in Edge Function Secrets, redeploy.
9. **QA plan** — smoke all 9 features on `dang.pestflowpro.ai/admin` (Kirk exercises campaign/blog/SEO most): each feature still generates, response shape unchanged, 429 on rate-limit, non-admin/anon rejected, key absent from rebuilt `/_admin/` bundle (`grep` the new build).

---

**Wave 1 complete. P3 stop condition tripped (public bundle) — Scott decides OQ-R before/with Wave 2. Validator gate (Perplexity + Gemini) required before Wave 2→Wave 3. Do not merge.**
