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

**Status:** Wave 2 **revised** (addendum on PR #123, same branch). Crash-priority — cutover targeted this week. **Validator gate CLEARED:** Perplexity + Gemini returned substantive findings; this revision implements them (R1–R9 below). Net verdict: revise then proceed directly to Wave 3 — **no re-validation** (revisions implement validator output verbatim, no new architecture). OQ resolutions locked by Scott (2026-05-26): OQ-R crash cutover w/ rotate-last-as-final-step · OQ-G server-side tier gating · OQ-I one proxy w/ operator branch · OQ-S streaming deferred · OQ-Q short-window rate limit only.

**Validator-gate revisions (R1–R9), all applied below:** R1 `callAi` unwraps `FunctionsHttpError.context` · R2 no HTTP-200 tunneling, 3 sites rewritten to try/catch · R3 operator hard-separation + UUID allowlist · R4 atomic `check_and_record_rate_limit` SQL fn · R5 two-layer (per-user 20 / per-tenant 60 per 5 min) · R6 request bounds (A2.1.1) · R7 48-h key overlap · R8 CORS on all responses (A2.1.2) · R9 log every terminal outcome. **Wave 3 (Block 2) also carries:** W1 CI grep guard · W2 dist/ + DevTools verification · W3 expanded auth-regression smoke matrix · W4 fail-closed on missing subscription · W5 pre-cutover model-pin grep — documented in the Wave 3 PR, not here.

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

**Response shape (R2 — single error contract, no status tunneling):**
- **Success:** proxy returns the Anthropic `/v1/messages` JSON **verbatim**, HTTP 200. Via `supabase.functions.invoke`, the client receives this as `data`, so existing `data.content[0].text` / `data.content.map(...)` parsing is unchanged.
- **Anthropic API error** (Anthropic returns 4xx/5xx): proxy returns the **upstream status as-is** (no 200-tunneling) with body `{ error: { message, anthropic_status, request_id } }`. `invoke` surfaces this as a `FunctionsHttpError`; `callAi` (A2.5) unwraps `error.context` → throws `error.message`.
- **Proxy-level rejection:** `400` (validation — A2.1.1), `401` (missing/invalid JWT), `403` (tenant mismatch / under-tier / not operator), `429` (rate limit) — body `{ error: { message } }`, non-2xx → `FunctionsHttpError`.

**One unified error path (post-R2).** Every terminal error — proxy-level *and* upstream Anthropic — comes back non-2xx and is thrown by `callAi`, caught by each call site's existing `try/catch`. Three sites currently read a 200-body `data.error` (`NewCampaignModal` L125, `useComposer` L101/L124); R2 rewrites those to the `try/catch` pattern the other seven already use (A2.6 rows #1–#3). This trades a tiny behavior-preservation deviation (three sites get a unified error path) for one consistent contract across all ten.

### A2.1.1 — Request bounds (R6)

Pre-flight validation, **before** auth (cheap rejection of malformed payloads). Reject with HTTP `400`, body `{ error: { message } }`, if any of:
1. `max_tokens > 4096` (or missing / not a positive integer)
2. serialized JSON request body `> 100 KB`
3. `messages.length > 50` (or `messages` missing / not an array)
4. `feature` not in the `AiFeature` union
5. `tenant_id` not a valid UUID

Order: body-size → JSON parse → field validation → auth (A2.2) → rate-limit (A2.3) → upstream. Each 400 is logged (R9).

### A2.1.2 — CORS + preflight (R8)

**Every** response — 200 success, 400 validation, 401/403 auth, 429 rate-limit, upstream 4xx/5xx, and unexpected 500 — must carry standard CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`) and `Content-Type: application/json`. The proxy must answer `OPTIONS` preflight with a clean `200` + CORS headers and no body. Without this the browser sees opaque network failures on error responses instead of the structured proxy body, and `callAi` can't unwrap `error.context`. Mirror the existing pattern in `_shared/cors.ts` (`getCorsHeaders(req)`), as used by `seo-analytics`.

## A2.2 — Auth implementation (OQ-G + OQ-I)

New helper in `supabase/functions/_shared/auth/requireTenantUser.ts` (extends the file; reuses `requireTenantUser`):

```ts
// R3: identity is email; AUTHORIZATION is UUID. Operator allowlist by user.id.
const IRONWOOD_OPERATOR_USER_IDS = new Set<string>([
  // TODO(scott): fill UUID — Scott's auth.users id, provided during Wave 3
])

export type AiFeature =
  | 'content_page' | 'composer_captions' | 'composer_schedule'
  | 'content_queue_schedule' | 'seo_metadata' | 'blog_draft'
  | 'blog_seo' | 'seo_keywords' | 'campaign_generation' | 'redirect_map'

// feature → minimum tenant tier. 'operator' = Ironwood-ops only (no tenant tier).
export const FEATURE_TIER: Record<AiFeature, number | 'operator'> = {
  content_page:           1,   // ContentTab — ungated today
  composer_captions:      1,   // useComposer.generateCaptions — Starter-reachable (quota-limited)
  composer_schedule:      2,   // useComposer.getSmartSchedule — ComposerScheduler hides Smart Schedule behind a "Growth+" lock when isStarter (tier 1); reachable tier 2+
  content_queue_schedule: 1,   // ContentQueueTab.handleSmartSchedule — NO tier gate anywhere (no useSocialTier/canAccess; SocialTab mounts queue with no canAccess wrapper); reachable by any admin with drafts incl. Starter
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
2. **Operator branch (OQ-I + R3 — hard separation):**
   - If `FEATURE_TIER[feature] === 'operator'`: require `IRONWOOD_OPERATOR_USER_IDS.has(user.id)` (UUID allowlist, **not** email) — else `throw new AuthError(403, …)`.
   - If `FEATURE_TIER[feature]` is a tier (number): an operator-only identity may **not** invoke it — proceed to the tier check, which an operator-only user fails.
   - **Hard separation (locked):** operator identities cannot invoke tenant-tier features; tenant-admin identities cannot invoke operator features. No "operator passes all" clause. If an operator needs a tenant feature on a tenant's behalf, they act through that tenant's admin session, logged separately.
3. **Tier check (OQ-G):** for numeric-tier features, read the tenant tier and require `tier >= FEATURE_TIER[feature]`, else `AuthError(403, { error: 'Upgrade required' })`.

**Tier source — accuracy note (deviates slightly from "no extra round-trip"):** `requireTenantUser` reads `profiles` (tenant_id, role); tier is **not** on `profiles`. Per CLAUDE.md the tier lives in `settings` key `subscription` (`{ tier: 1–4 }`, mirrors client `usePlan`). So the proxy needs **one additional `settings` read** (`select value where tenant_id=? and key='subscription'`) unless Wave 3 denormalizes tier onto `profiles`/a view. Recommend the extra read for MVP (cheap, indexed). Document this — Scott's "piggybacks on existing hit" assumed tier was co-located; it isn't.

**Scheduling-feature tiers (resolved 2026-05-26, was `[CONFIRM]`):**
- `composer_schedule` → **tier 2.** `ComposerScheduler.tsx:36–40`: when `isStarter` (tier 1, from `useSocialTier`), the entire schedule-mode block — including the `✨ Smart Schedule` radio + "Get Best Time" button (`onGetSmartSchedule`) — is replaced by a `Lock` notice "Scheduling available on Growth plan and above." So `getSmartSchedule` is unreachable below tier 2. Gating at 2 is behavior-preserving.
- `content_queue_schedule` → **tier 1.** `ContentQueueTab.tsx` has **no** tier gate (imports only `useTenant`; no `useSocialTier`/`usePlan`/`canAccess`/`FeatureGate`). The "Smart Schedule" button (`handleSmartSchedule`, L184) renders whenever `draftCount > 0`, and `SocialTab.tsx:143` mounts the queue tab with **no** `canAccess` wrapper (unlike campaigns=3 / analytics=4). Any admin reaching the queue with drafts — including Starter — can fire it today, so the proxy must allow tier 1 to avoid newly breaking a reachable path. (Auth + per-tenant rate-limit + logging still apply.)

## A2.3 — Rate-limit implementation (OQ-Q)

Reuse `public.rate_limit_events` (no new table). **R4 — atomic check (the naive select-count-then-insert is racy: two concurrent requests can both observe `count < max` and both insert).** Apply this function in the Wave 3 migration set; the proxy calls it via service-role RPC:
```sql
create or replace function public.check_and_record_rate_limit(
  p_key text,
  p_window_seconds int,
  p_max_count int
) returns boolean
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));   -- serialize check+insert per key
  select count(*) into v_count
    from public.rate_limit_events
    where key = p_key
      and created_at >= now() - (p_window_seconds || ' seconds')::interval;
  if v_count >= p_max_count then
    return false;
  end if;
  insert into public.rate_limit_events(key) values (p_key);
  return true;
end;
$$;
```

**R5 — two-layer keys (a tenant-wide ceiling alone lets one rogue user starve the whole org).** Call the function twice per request; **both** must pass:
```ts
const userOk   = await rpc('check_and_record_rate_limit', { p_key: `ai-proxy:${tenantId}:${userId}`, p_window_seconds: 300, p_max_count: 20 })
const tenantOk = await rpc('check_and_record_rate_limit', { p_key: `ai-proxy:${tenantId}`,            p_window_seconds: 300, p_max_count: 60 })
if (!userOk || !tenantOk) return json(429, { error: { message: 'Too many AI requests. Please wait a minute and try again.' } })
```
- **Per-user: 20 req / 5 min. Per-tenant: 60 req / 5 min.** Both checked atomically; tunable post-launch.
- **1-hr cleanup cron is compatible** (5-min window ≪ 1 hr). A daily/monthly **token quota is explicitly out of scope** (A2.7) — it would need a durable table the cleanup cron doesn't prune.
- 429 body uses `{ error: { message } }`; non-2xx → `FunctionsHttpError` → `callAi` throws. Log the 429 (R9).

## A2.4 — Logging implementation (P7 pattern)

New table `public.ai_proxy_log` (service-role RLS only). **R9 — write a row for EVERY terminal outcome, not just successful Anthropic responses.** The denied attempts are the most interesting events for abuse attribution.

| column | nullable | source |
|---|---|---|
| `id` BIGSERIAL PK | — | — |
| `tenant_id` uuid | yes | validated caller tenant (null if rejected before tenant resolves) |
| `user_id` uuid | yes | `user.id` (**null** on 401 — no JWT) |
| `feature` text | yes | request `feature` (null if 400 invalid-feature) |
| `model` text | yes | pinned `claude-sonnet-4-6` (null for non-Anthropic outcomes) |
| `input_tokens` int | **yes** | Anthropic `usage.input_tokens` (null unless Anthropic responded) |
| `output_tokens` int | **yes** | Anthropic `usage.output_tokens` (null unless Anthropic responded) |
| `status` int | — | terminal HTTP status: 200, 400, 401, 403, 429, or upstream Anthropic 4xx/5xx |
| `created_at` timestamptz default now() | — | — |

Outcomes logged: `200` success; `400` validation (A2.1.1); `401` missing/invalid JWT (`user_id=null`); `403` auth rejection (tenant mismatch / under-tier / operator-separation / **missing subscription**, W4); `429` rate-limit (both layers); upstream Anthropic 4xx/5xx; and transport failures the proxy can still record. Best-effort: a logging failure must not block the user response.

Plus a structured console line mirroring `send-credentials-email` (`[ai-proxy] tenant:<id> user:<email|null> feature:<f> status:<n> in:<n|−> out:<n|−>`). Console = ops debugging; table = billing/abuse attribution. (Token-quota enforcement later reads this table.)

## A2.5 — `callAi` client helper (the single migration target)

New `src/lib/ai/callAi.ts`:
```ts
import { supabase } from '../supabase'
import { FunctionsHttpError } from '@supabase/supabase-js'
import type { AiFeature } from './aiFeatures'   // mirror of the edge-fn union

export interface AiCallInput {
  tenant_id: string
  max_tokens: number
  messages: { role: 'user' | 'assistant'; content: unknown }[]
  system?: string
  temperature?: number
}
// Returns the Anthropic /v1/messages JSON on success. Throws on ANY non-2xx —
// proxy 400/401/403/429 OR upstream Anthropic 4xx/5xx (R2: no more 200-tunneling).
// invoke() yields a FunctionsHttpError whose structured { error: { message } }
// body lives in error.context (a Response), NOT error.message — unwrap it.
export async function callAi(feature: AiFeature, input: AiCallInput): Promise<any> {
  const { data, error } = await supabase.functions.invoke('ai-proxy', { body: { feature, ...input } })
  if (error) {
    let message = error.message ?? 'AI request failed'
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json()
        if (body?.error?.message) message = body.error.message
      } catch { /* fall through to generic message */ }
    }
    throw new Error(message)
  }
  return data
}
```
Every call site swaps its `fetch('https://api.anthropic.com/v1/messages', {...})` + `await res.json()` for `const data = await callAi('<feature>', { tenant_id, max_tokens, messages, system? })`. **Response parsing downstream is untouched** (except the three `data.error` sites — see R2 / A2.6).

## A2.6 — Migration sequence (file-by-file)

Uniform transform per site: delete the `fetch(ANTHROPIC, { method, headers:{x-api-key…}, body: JSON.stringify({model, max_tokens, messages, system?}) })` block and the `const data = await res.json()` line; replace with `const data = await callAi('<feature>', { tenant_id, max_tokens, messages, system? })`. Remove the now-unused `import.meta.env.VITE_ANTHROPIC_API_KEY` reference. Keep all downstream parsing/state.

| # | File | Old call (lines) | `feature` | tenant_id source | Notes |
|---|---|---|---|---|---|
| 1 | `social/NewCampaignModal.tsx` | 110–123 (+`data.error` L125) | `campaign_generation` | `tenantId` (useTenant, L44) | **R2: rewrite `if (data.error)` branch — proxy returns non-2xx on errors; rely on `callAi` throwing (existing try/catch L132 catches)** |
| 2 | `social/useComposer.ts` `generateCaptions` | 95–99 (+`data.error` L101) | `composer_captions` | needs tenant — add via hook arg/useTenant | text-split parsing unchanged. **R2: rewrite `if (data.error)` branch — proxy returns non-2xx on errors** |
| 3 | `social/useComposer.ts` `getSmartSchedule` | 118–122 (+`data.error` L124) | `composer_schedule` | same | **R2: rewrite `if (data.error)` branch — proxy returns non-2xx on errors** |
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
6. **Hold — 48-hour overlap (R7).** After the migration deploy, the OLD key stays active for 48 h so open browser sessions can cycle and CDN caches clear. Monitor `ai_proxy_log` AND Anthropic console usage on the old key for any direct (non-proxy) Anthropic calls during the window — none should appear if the migration is complete; if any do, trace and fix the missed call site before proceeding.
7. **Final cutover step — Scott:** after the 48 h with the window clean, revoke the OLD key in the Anthropic console.
8. Rebuild verification: `grep -r "api.anthropic.com\|VITE_ANTHROPIC" src/ public/_admin/` → **zero** matches (except removed). Scrub `.env.example:3`. Confirm new `/_admin/` bundle carries no key. (W2: also grep post-build `dist/` and verify zero `api.anthropic.com` requests in a DevTools Network session.)
9. PR body records cutover timestamps (key-added, proxy-deployed, migration-deployed, 48h-window-start, old-key-revoked) for the audit trail.

---

**Wave 2 addendum revised (R1–R9 applied). Validators cleared — no re-validation. STOP for Scott's review of this revision; on his OK, Wave 3 implementation proceeds (build `ai-proxy`, extend auth helper, migrate all 10 sites via `callAi`, deploy per the revised runbook, hold the 48-h overlap, then revoke the old key). Block 2 (W1–W5) lands in the Wave 3 PR. Do not merge this doc-only PR.**
