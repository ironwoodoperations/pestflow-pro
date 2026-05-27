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

---

# Wave 2 addendum — proxy contract & migration plan

**Status:** Wave 2 (addendum on PR #123, same branch). Crash-priority — cutover targeted this week. **Validator gate (Perplexity + Gemini) runs against THIS addendum before Wave 3 implementation.** OQ resolutions locked by Scott (2026-05-26): OQ-R crash cutover w/ rotate-last-as-final-step · OQ-G server-side tier gating · OQ-I one proxy w/ operator branch · OQ-S streaming deferred · OQ-Q short-window rate limit only.

## A2.1 — Proxy contract

**Function:** `supabase/functions/ai-proxy/index.ts`, deploy `verify_jwt: true`. Key from `Deno.env.get('ANTHROPIC_API_KEY')` (Edge Function Secret — reuse the existing var name; the new key added there pre-cutover).

**Request body** (client → proxy):
```jsonc
{
  "feature": "campaign_generation",   // required — AiFeature discriminator (A2.2)
  "tenant_id": "<uuid>",              // required — validated against caller's profile
  "max_tokens": 4000,                 // required — passed through
  "messages": [{ "role": "user", "content": "..." }],  // required — passed through
  "system": "…",                      // optional — passed through if present
  "temperature": 0.7                  // optional — passed through if present
  // model is NOT honored from the client — proxy pins it (below)
}
```

**Model pinning (absorbs CLAUDE.md #1):** the proxy hardcodes `model: 'claude-sonnet-4-6'` and ignores any client-supplied model. All 10 call sites already send exactly this string, so pinning is behavior-preserving and removes a tampering vector.

**Pass-through to Anthropic:** proxy forwards `{ model (pinned), max_tokens, messages, system?, temperature? }` to `POST https://api.anthropic.com/v1/messages` with `x-api-key: <secret>`, `anthropic-version: 2023-06-01`. No `tools`, no `stream` (none exist today; see A2.7 deferred). To stay future-proof for S242 vision, the proxy forwards `messages`/`system` **opaquely** rather than reshaping them.

**Response shape (behavior-preserving — the critical detail):**
- **Success:** proxy returns the Anthropic `/v1/messages` JSON **verbatim**, HTTP 200. Via `supabase.functions.invoke`, the client receives this as `data`, so existing `data.content[0].text` / `data.content.map(...)` parsing is unchanged.
- **Anthropic API error** (Anthropic returns 4xx/5xx): proxy forwards the Anthropic error body verbatim **at HTTP 200**, so the body carries `{ error: { message } }`. This preserves the `if (data.error) …` branches in `NewCampaignModal` (L125) and `useComposer` (L101, L124).
- **Proxy-level rejection:** `401` (missing/invalid JWT), `403` (tenant mismatch / under-tier / not operator), `429` (rate limit) — body `{ error: { message } }`, non-2xx so `invoke` populates its `error`.

**Two client error-handling styles exist and both must keep working** (verified): (a) body-`data.error` readers — campaign, composer ×2; (b) `if (!res.ok) throw` — `generateBlogDraft` L49, `generateBlogSeo` L52; (c) bare-parse-in-try/catch — content, seo keywords/meta, content-queue, redirect. The shared `callAi` helper (A2.5) normalizes all three: returns Anthropic `data` on success, **throws** on proxy-level/transport error (caught by each site's existing try/catch), and leaves Anthropic `data.error` intact in the body.

## A2.2 — Auth implementation (OQ-G + OQ-I)

New helper in `supabase/functions/_shared/auth/requireTenantUser.ts` (extends the file; reuses `requireTenantUser`):

```ts
export type AiFeature =
  | 'content_page' | 'composer_captions' | 'composer_schedule'
  | 'content_queue_schedule' | 'seo_metadata' | 'blog_draft'
  | 'blog_seo' | 'seo_keywords' | 'campaign_generation' | 'redirect_map'

// feature → minimum tenant tier. 'operator' = Ironwood-ops only (no tenant tier).
export const FEATURE_TIER: Record<AiFeature, number | 'operator'> = {
  content_page:           1,   // ContentTab — ungated today
  composer_captions:      1,   // useComposer.generateCaptions — Starter-reachable (quota-limited)
  composer_schedule:      2,   // useComposer.getSmartSchedule — scheduling = Grow+  [CONFIRM]
  content_queue_schedule: 2,   // ContentQueueTab.handleSmartSchedule — scheduling = Grow+  [CONFIRM]
  seo_metadata:           2,   // useSeoAiGenerate — inside SEOTab FeatureGate minTier={2}
  blog_draft:             2,   // generateBlogDraft — BlogTab FeatureGate minTier={2}
  blog_seo:               2,   // generateBlogSeo — BlogTab FeatureGate minTier={2}
  seo_keywords:           3,   // SeoKeywordsTab — FeatureGate minTier={3}
  campaign_generation:    3,   // NewCampaignModal — canAccess(3) in SocialTab
  redirect_map:           'operator', // RedirectMapPanel — Ironwood-only
}

export async function requireTenantAdminWithFeature(
  req: Request,
  requestedTenantId: string,
  feature: AiFeature,
): Promise<{ user: { id: string; email?: string }; tenantId: string; tier: number }>
```

Behavior:
1. `const { user, tenantId, role } = await requireTenantUser(req, requestedTenantId)` (JWT + tenant ownership).
2. **Operator branch (OQ-I):** if `FEATURE_TIER[feature] === 'operator'`, require Ironwood-ops identity (`user.email === 'admin@pestflowpro.com'` / Ironwood tenant); else throw `AuthError(403)`. Tenant-tier features are NOT reachable by operator-only and vice-versa, except operator may also be allowed to call tenant features if desired (Wave 3 decision — default: operator passes all).
3. **Tier check (OQ-G):** read the tenant tier and require `tier >= FEATURE_TIER[feature]`, else `AuthError(403, { error: 'Upgrade required' })`.

**Tier source — accuracy note (deviates slightly from "no extra round-trip"):** `requireTenantUser` reads `profiles` (tenant_id, role); tier is **not** on `profiles`. Per CLAUDE.md the tier lives in `settings` key `subscription` (`{ tier: 1–4 }`, mirrors client `usePlan`). So the proxy needs **one additional `settings` read** (`select value where tenant_id=? and key='subscription'`) unless Wave 3 denormalizes tier onto `profiles`/a view. Recommend the extra read for MVP (cheap, indexed). Document this — Scott's "piggybacks on existing hit" assumed tier was co-located; it isn't.

**`[CONFIRM]` items:** `composer_schedule` and `content_queue_schedule` are scheduling-adjacent; Starter (tier 1) reaches captions but not scheduling. If smoke-test shows Starter can today reach these AI calls, drop them to tier 1 to stay behavior-preserving. Default 2.

## A2.3 — Rate-limit implementation (OQ-Q)

Reuse `public.rate_limit_events` (no new table). Per authenticated tenant:
```ts
const key = `ai-proxy:${tenantId}`
const since = new Date(Date.now() - 5 * 60 * 1000).toISOString()  // 5-min window
const { count } = await svc.from('rate_limit_events')
  .select('id', { count: 'exact', head: true }).eq('key', key).gte('created_at', since)
if ((count ?? 0) >= 60) return json(429, { error: { message: 'Too many AI requests. Please wait a minute and try again.' } })
await svc.from('rate_limit_events').insert({ key })
```
- **Window 5 min, ceiling 60 req / 5 min / tenant** (Scott's suggested starting number — high enough for real bursts, caps runaway abuse). Tunable post-launch.
- **1-hr cleanup cron is compatible** (5-min window ≪ 1 hr). A daily/monthly **token quota is explicitly out of scope** (A2.7) — it would need a durable table the cleanup cron doesn't prune.
- 429 body uses Anthropic-style `{ error: { message } }` so `data.error` sites surface it; non-2xx so `invoke` also flags `error`.

## A2.4 — Logging implementation (P7 pattern)

New table `public.ai_proxy_log` (service-role RLS only), written after each Anthropic response:

| column | source |
|---|---|
| `id` BIGSERIAL PK | — |
| `tenant_id` uuid | validated caller tenant |
| `user_id` uuid | `user.id` |
| `feature` text | request `feature` |
| `model` text | pinned `claude-sonnet-4-6` |
| `input_tokens` int | Anthropic `usage.input_tokens` |
| `output_tokens` int | Anthropic `usage.output_tokens` |
| `status` int | Anthropic HTTP status (or proxy 429/403) |
| `created_at` timestamptz default now() | — |

Plus a structured console line mirroring `send-credentials-email` (`[ai-proxy] tenant:<id> user:<email> feature:<f> status:<n> in:<n> out:<n>`). Console = ops debugging; table = billing/abuse attribution. (Token-quota enforcement later reads this table.)

## A2.5 — `callAi` client helper (the single migration target)

New `src/lib/ai/callAi.ts`:
```ts
import { supabase } from '../supabase'
import type { AiFeature } from './aiFeatures'   // mirror of the edge-fn union

export interface AiCallInput {
  tenant_id: string
  max_tokens: number
  messages: { role: 'user' | 'assistant'; content: unknown }[]
  system?: string
  temperature?: number
}
// Returns the Anthropic /v1/messages JSON verbatim (incl. {error} body on Anthropic errors).
// Throws on proxy-level/transport errors (401/403/429/network) — caught by each call site's existing try/catch.
export async function callAi(feature: AiFeature, input: AiCallInput): Promise<any> {
  const { data, error } = await supabase.functions.invoke('ai-proxy', { body: { feature, ...input } })
  if (error) throw new Error(error.message ?? 'AI request failed')
  return data
}
```
Every call site swaps its `fetch('https://api.anthropic.com/v1/messages', {...})` + `await res.json()` for `const data = await callAi('<feature>', { tenant_id, max_tokens, messages, system? })`. **Response parsing downstream is untouched.**

## A2.6 — Migration sequence (file-by-file)

Uniform transform per site: delete the `fetch(ANTHROPIC, { method, headers:{x-api-key…}, body: JSON.stringify({model, max_tokens, messages, system?}) })` block and the `const data = await res.json()` line; replace with `const data = await callAi('<feature>', { tenant_id, max_tokens, messages, system? })`. Remove the now-unused `import.meta.env.VITE_ANTHROPIC_API_KEY` reference. Keep all downstream parsing/state.

| # | File | Old call (lines) | `feature` | tenant_id source | Notes |
|---|---|---|---|---|---|
| 1 | `social/NewCampaignModal.tsx` | 110–123 (+`data.error` L125) | `campaign_generation` | `tenantId` (useTenant, L44) | `data.error` branch preserved |
| 2 | `social/useComposer.ts` `generateCaptions` | 95–99 (+`data.error` L101) | `composer_captions` | needs tenant — add via hook arg/useTenant | text-split parsing unchanged |
| 3 | `social/useComposer.ts` `getSmartSchedule` | 118–122 (+`data.error` L124) | `composer_schedule` | same | — |
| 4 | `social/ContentQueueTab.tsx` `handleSmartSchedule` | 116–129 | `content_queue_schedule` | `tenantId` (in file) | bare try/catch unchanged |
| 5 | `admin/ContentTab.tsx` `generateAI` | 140–144 (`apiKey` L45) | `content_page` | `tenantId` (in file) | drop `apiKey` const |
| 6 | `admin/seo/SeoKeywordsTab.tsx` `generate` | 31–44 (`apiKey` L23) | `seo_keywords` | `tenantId` (in file) | drop `apiKey` const |
| 7 | `admin/seo/useSeoAiGenerate.ts` | 34–48 | `seo_metadata` | thread tenantId through (hook input) | has `system` |
| 8 | `ironwood/RedirectMapPanel.tsx` | 170–205 | `redirect_map` | operator (no tenant tier) — pass Ironwood tenant_id | operator branch |
| 9 | `lib/ai/generateBlogDraft.ts` | 33–52 (`!res.ok` L49) | `blog_draft` | **add `tenant_id` to `BlogDraftInput`** | replace `!res.ok` throw with `if (data.error) throw` |
| 10 | `lib/ai/generateBlogSeo.ts` | 36–~50 (`!res.ok` L52) | `blog_seo` | **add `tenant_id` to `BlogSeoInput`** | same as #9; caller `autoGenBlogSeo` has tenantId |

Two sites (#9, #10) need a one-field input-signature addition (`tenant_id`) since they're pure lib functions; their callers (`BlogPostEditor`, `autoGenBlogSeo`) already hold `tenantId`. Everything else is a local swap. **No request shape resists the generic contract — no stop condition.**

## A2.7 — Deferred scope

- **Streaming (SSE):** no current site sets `stream:true`; proxy MVP is JSON-only. Defer SSE forwarding to a Phase 2 enhancement if a future UX needs token-streaming. (OQ-S.)
- **Token quota (daily/monthly hard caps):** out of S243. Needs a durable usage table (not `rate_limit_events`, which auto-prunes hourly), a reset cron, and tenant-visible UI — a dedicated follow-on session. MVP ships request-rate limiting only. (OQ-Q.)
- **Per-feature proxy split:** single `ai-proxy` for all 10 sites. Revisit only if one feature's rate-limit contention demands isolation (e.g., Ironwood grows into a heavy AI surface). (OQ-I.)

## A2.8 — CLAUDE.md replacement (non-negotiable #3)

Wave 3 replaces the current rule. Proposed text:

> **3. AI calls route through `ai-proxy`:** every Anthropic request goes through the `ai-proxy` edge function via `supabase.functions.invoke('ai-proxy', { body: { feature, tenant_id, … } })`. NEVER call `api.anthropic.com` directly from frontend code. NEVER reference `VITE_ANTHROPIC_API_KEY` or any `VITE_`-prefixed AI key — none exist; the key lives only in Edge Function Secrets. The proxy pins the model, enforces per-feature tier gating, rate-limits per tenant, and logs every call.

Rules #1 (model string — now enforced by the proxy) and #5 (strip backticks before `JSON.parse` — still at call sites) remain.

## A2.9 — Cutover runbook (OQ-R)

1. **Scott:** generate a NEW Anthropic key in the console. Add it to Supabase Edge Function Secrets as `ANTHROPIC_API_KEY`. **Do NOT revoke the old key yet.**
2. Deploy `ai-proxy` (`supabase functions deploy ai-proxy --project-ref biezzykcgzkrwdgqpsar`). Apply `ai_proxy_log` migration.
3. Smoke-test the proxy with ONE migrated site (recommend `blog_draft` on `dang.pestflowpro.ai/admin`) — confirm 200 + correct shape, 403 under-tier, 429 over-limit.
4. Migrate the remaining 9 sites (single PR) per A2.6. Deploy frontend.
5. **Full smoke test on `dang.pestflowpro.ai/admin`** (Kirk's surfaces): campaign generate, blog draft + SEO, SEO keywords + page meta, content page copy, single-post captions + smart schedule, content-queue smart schedule; Ironwood redirect-map on `/ironwood`.
6. **Final cutover step — Scott:** revoke the OLD key in the Anthropic console. Breakage window = minutes (revoke → propagation), not days.
7. Rebuild verification: `grep -r "api.anthropic.com\|VITE_ANTHROPIC" src/ public/_admin/` → **zero** matches (except removed). Scrub `.env.example:3`. Confirm new `/_admin/` bundle carries no key.
8. PR body records cutover timestamps (key-added, proxy-deployed, migration-deployed, old-key-revoked) for the audit trail.

---

**Wave 2 addendum complete. STOP — Scott runs Perplexity + Gemini validators against this addendum. Both must clear before Wave 3 implementation. Do not merge; do not write code.**
