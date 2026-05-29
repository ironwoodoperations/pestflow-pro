# s247 — Tier-Gate UX death audit (Wave 1)

**Status: Wave 1 complete — STOP for Scott review before spec.**
Scope: ACTION-level surfaces where a click reaches a tier-gated edge function and the 403 surfaces in-UI. Section-level `FeatureGate`/`canAccess` is out of scope (works).

Branch: `investigate/tier-gate-ux` (off `main` @ faf3c1a, includes #131/#132/#133).

---

## TL;DR for sign-off
- **1 clear target:** `MediaTab` → "Tag with AI Vision" (per-image + "Tag untagged" bulk) calls `tag-image-vision` → `ai-proxy/internal`, which requires **Pro (tier 3)**. The Media tab renders for **all tiers** with **no client-side guard**, so a sub-Pro tenant's click hits the network and 403s (surfaced as a "Tagging failed" toast + a red "Tag failed" badge whose tooltip shows the raw backend error).
- **2 borderline surfaces** (already degrade without a raw modal, but inconsistent with the "pre-emptive prompt" standard — Scott to rule in/out): composer **smart-schedule** (Grow/2, 403 silently swallowed) and **publish/schedule** via `post-to-social` (Grow/2, raw backend message in a toast).
- **Everything else is already protected** by a section `FeatureGate`/`canAccess` gate that renders before the action is reachable.
- **Wave-2 caveat:** `usePlan()` does **not** expose `tierName`/`monthlyPrice` (kickoff assumption is incorrect — see Q5). And tier-2 is named **"Grow"** in some places, **"Growth"** in others. A single target-tier→{name,price} source is needed so the prompt names the correct tier.

---

## Q1 — Edge functions that return a tier-based 403

| Function | Tier gate | 403 shape (body · status) | User-facing? |
|---|---|---|---|
| `ai-proxy` (public route, via `_shared/aiAuth.ts` `requireAiCaller`) | per-feature from `FEATURE_TIER` map | `{ error: 'Upgrade required' }` · 403 (also `{ error: 'Subscription not configured' }` if sub missing) | yes — all `callAi()` features |
| `ai-proxy` (`/internal` route) | `tier < PRO_TIER` (3) | `{ error: { message: 'Pro tier required' } }` · 403 | indirectly (service callers) |
| `generate-social-batch` | `tier < PRO_TIER` (3) | `{ error: 'AI Campaigns require the Pro plan.' }` · 403 | yes |
| `process-campaign-job` | `tier < PRO_TIER` (3) | `fail('subscription_lapsed')` (worker; writes job row) | **no** — background worker, no click |
| `outscraper-reviews` | `tier < 4` | `{ error: 'Manual refresh requires Elite plan (tier 4)' }` · 403 | yes |
| `post-to-social` | `tier === 1` blocked; `tier === 2` capped | `{ error: 'Scheduling not available on Starter plan. Upgrade to Grow…' }` · 403 | yes |

`FEATURE_TIER` (`_shared/aiAuth.ts`, post-#131): content_page 1 · composer_captions 1 · content_queue_schedule 1 · composer_schedule 2 · seo_metadata 2 · blog_draft 2 · blog_seo 2 · seo_keywords 3 · campaign_generation 3 · redirect_map `operator` · scrape_prospect_analyze `operator`.

Other `*/index.ts` 403s (`scrape-prospect`, `ironwood-*`, `list-checkout-sessions`, `send-*`, `notify-*`) are **identity/operator/auth** checks, **not tenant-tier** — excluded.

---

## Q2 — Frontend call sites for each 403-producing function

| Call site | Invocation | Feature/fn | Tier | Current 403 handling |
|---|---|---|---|---|
| `MediaTab.tsx:106` | `invoke('tag-image-vision')` | tag-image-vision (→ai-proxy/internal) | **3** | toast "Tagging failed…" + failed badge tooltip = raw err |
| `social/NewCampaignModal.tsx:87` | `invoke('generate-social-batch')` | generate-social-batch | 3 | sets `genError` (raw) in modal |
| `seo/SeoKeywordsTab.tsx:30` | `callAi('seo_keywords')` | ai-proxy | 3 | toast/raw |
| `seo/useSeoAiGenerate.ts:35` | `callAi('seo_metadata')` | ai-proxy | 2 | toast/raw |
| `lib/ai/generateBlogDraft.ts:31` | `callAi('blog_draft')` | ai-proxy | 2 | thrown → editor catch |
| `lib/ai/generateBlogSeo.ts:33` | `callAi('blog_seo')` | ai-proxy | 2 | thrown → editor catch |
| `social/useComposer.ts:117` | `callAi('composer_schedule')` | ai-proxy | 2 | **swallowed** → `scheduleMode='later'` |
| `social/useComposer.ts:96` | `callAi('composer_captions')` | ai-proxy | 1 | n/a (all tiers) |
| `admin/ContentTab.tsx:140` | `callAi('content_page')` | ai-proxy | 1 | n/a |
| `social/ContentQueueTab.tsx:117` | `callAi('content_queue_schedule')` | ai-proxy | 1 | n/a |
| `social/usePublishPost.ts:76` | `fetch(post-to-social)` | post-to-social | 1→manual / 2 | `toast.error(raw backend msg)` |
| `TestimonialsTab.tsx:122` | `fetch(outscraper-reviews)` | outscraper-reviews | 4 | toast |
| `TestimonialsTab.tsx:236` | `invoke('places-reviews')` | places-reviews | **none** (requireTenantUser only — no tier gate) | toast |
| `ironwood/RedirectMapPanel.tsx:171` | `callAi('redirect_map')` | ai-proxy | operator | Ironwood-only surface |

---

## Q3 — Which call sites are NOT pre-guarded (the real targets)

| Surface | Pre-call guard found | Verdict |
|---|---|---|
| **MediaTab "Tag with AI Vision" (per-image + bulk)** | `Dashboard.tsx:210` renders `<MediaTab/>` for all tiers; MediaTab has **no `usePlan`/`canAccess`/`FeatureGate`** | **UNPROTECTED → TARGET (tier 3 / Pro)** |
| NewCampaignModal generate | `SocialTab.tsx:131` `canAccess(3) ?` gates the whole Campaigns tab before the modal exists | protected |
| SeoKeywordsTab generate | `SEOTab.tsx:70` `<FeatureGate minTier={3}>` wraps it | protected |
| useSeoAiGenerate metadata | `SEOTab.tsx:37` `<FeatureGate minTier={2}>` | protected |
| BlogPostEditor AI draft/SEO | `BlogTab.tsx:94` `<FeatureGate minTier={2}>` wraps the editor (opened only from inside the gate) | protected |
| outscraper "Refresh Now" | `TestimonialsTab.tsx:318` `<FeatureGate minTier={4}>` with a **disabled** fallback button ("Elite plan only") — under-tier cannot click | protected |
| composer smart-schedule | partial: `useComposer` reads `tier` for caps; 403 is **swallowed** (`catch → scheduleMode='later'`) | **borderline** — degrades silently, no raw modal, but no pre-emptive prompt and the silent fallback is itself confusing |
| publish via post-to-social | client short-circuits `tier===1` to a manual copy/paste path; other tiers `toast.error(raw msg)` | **borderline** — tier-1 pre-guarded; remaining 403/caps surface as a raw-message toast |

**Recommended target list for Scott:**
1. **MediaTab AI Vision tagging** — the one true unprotected raw-403 surface. (Pro/3)
2. *(optional)* composer smart-schedule (Grow/2) — convert silent fallback → explicit upgrade prompt.
3. *(optional)* publish/post-to-social (Grow/2) — convert raw-message toast → upgrade prompt for the tier case.

Items 2–3 already avoid a *raw modal*; including them is a consistency call, not a bug fix. Awaiting Scott's confirmation of the final list.

---

## Q4 — Correct target tier per unprotected surface (post-#131)

| Surface | Required tier | Prompt must say |
|---|---|---|
| MediaTab AI Vision tagging | **3** | "Upgrade to **Pro**" ($349/mo) |
| composer smart-schedule *(if included)* | **2** | "Upgrade to **Grow**" ($249/mo) |
| post-to-social publish *(if included)* | **2** | "Upgrade to **Grow**" ($249/mo) |

⚠️ Tier 3 is **Pro**, not Elite (AI Campaigns/tag moved Elite→Pro in #131). Naming Elite here would be wrong.

---

## Q5 — Existing reusable "upgrade prompt" UI (reuse, don't reinvent)

| Component | Props / shape | CTA | Notes |
|---|---|---|---|
| `common/FeatureGate.tsx` | `{minTier, featureName, children, fallback}` | mailto `support@pestflowpro.ai` | **Default fallback hardcodes "Upgrade to Growth" + "Available on Growth and above" regardless of `minTier`** — latent wrong-tier-naming bug; do NOT reuse the default text for a Pro/Elite gate |
| `common/LockedSectionCard.tsx` | `{title, bodyText, mailtoSubject}` | "Upgrade to unlock →" mailto | amber lock; generic; section-level |
| `admin/UpgradeCards.tsx` | `{currentTier, businessName}` | per-plan mailto "Upgrade to {name} →" | dashboard multi-card; **canonical name+price source** (`UPGRADE_PLANS`); names tier-2 **"Growth"** |
| `social/SocialUpgradeNudge` (used `SocialTab.tsx:137,159`) | `{planName, price, onNavigate}` | navigate/CTA | single-feature nudge — closest existing shape to what an action-guard prompt needs |
| `context/PlanContext.tsx` `TIER_MAP` | tier→`{plan_name, monthly_price}` | — | internal, **not exported**; names tier-2 **"Grow"** |
| `lib/pricingConfig.ts` | tier→{tier,…} 1-4 | — | pricing config source |
| `notify-upgrade` edge fn | `{tenant_id, new_tier}` | — | a backend "request upgrade" path exists, but **no UI currently calls it** — all current CTAs are `mailto`. Wave 2 decision: keep mailto (consistent) vs wire notify-upgrade |

**Key gaps for Wave 2 (no action now — flagged for spec):**
- `usePlan()` exposes `tier, loading, canAccess, setTier, refreshPlan` — **NOT** `tierName`/`plan_name`/`monthlyPrice` as the kickoff states. A target-tier→{name,price} helper is required (consolidate `pricingConfig`/`TIER_MAP`/`UPGRADE_PLANS`).
- **Name inconsistency:** tier-2 = "Grow" (PlanContext) vs "Growth" (UpgradeCards, FeatureGate). Pick one before the prompt ships.
- No existing single "action-level upgrade prompt" (modal/inline) keyed by a required tier — `SocialUpgradeNudge` is the nearest pattern to generalize.

---

## Method
Grepped `supabase/functions/` for tier/403 logic; grepped `src/` for every `functions.invoke()` / `callAi()` / direct `fetch(.../functions/v1/...)`; read each caller's component for a `FeatureGate`/`canAccess` guard between the click and the network call; verified required tiers against current edge-fn source. No code changed. No backend touched.

## STOP
Per kickoff: not drafting the Wave-2 spec until Scott confirms (a) the target surface list (item 1 only, or +2/+3) and (b) the desired CTA (reuse mailto vs notify-upgrade).
