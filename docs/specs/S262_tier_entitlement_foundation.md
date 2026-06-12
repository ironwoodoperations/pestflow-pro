# S262 — Tier / Entitlement Foundation — Wave 2 Spec

**Status:** SPEC ONLY — awaiting VALIDATOR GATE (Perplexity + Gemini, conservative-wins). Do NOT implement until Scott returns the gate decision.
**Scope:** the plumbing the gated-feature layer depends on. Establishes the entitlement field, the canonical 4-tier scale, fixes the broken tier data, routes gating through one resolver, and applies the two confirmed re-maps. Does NOT build gated features or wire the full matrix.

---

## Canonical model (locked — `PFP_Pricing_Tiers.docx`)
Four cumulative plan tiers. Numeric scale is the entitlement field's domain:

| Tier | Name | Price | scale |
|---|---|---|---|
| Starter | get online + manage leads | $149 | **1** |
| Growth | DIY marketing engine | $249 | **2** |
| Pro [recommended] | let the AI run marketing | $349 | **3** |
| Elite | scale + intelligence + done-for-you | $499 | **4** |

Outside the scale (NOT modeled here): Voice AI add-on ($99/$149/$249 by minutes — flat add-on on any tier); $1,299 fully-managed (PARKED). **Naming:** tier 2 is **"Growth"** canonically — the repo currently mixes "Grow" (`PlanContext`, `tierInfo`, `socialLimits`) and "Growth" (`engines.ts`, `UpgradeCards`). This spec standardizes on **"Growth"** for any string the new resolver emits, but does NOT mass-rename display strings (follow-on cleanup).

## Wave 1 facts this spec builds on (verified live)
- `tenants` has **no** tier/entitlement column. Tier is **never** in the JWT (no claim hook; 0 metadata refs).
- Tier resolved today from `settings.subscription.tier` in **three** places: edge `aiAuth.requireAiCaller` (number-only, fail-closed 403), `ai-proxy/internal` (`PRO_TIER=3`), and SPA `PlanContext` (string-tolerant) — plus two SPA second-reads (`BillingTab.tsx:102`, `settings/BrandingSection.tsx:39`).
- `FEATURE_TIER` is a 3-value scale + `'operator'` — **no tier 4**.
- Live data: 8 tenants store `tier` as number `4`, 1 (ZZ Dryrun) as string `"elite"`. Everyone is effectively Elite; nothing is gated.
- Dang: entitled Elite (4) but pays $149 — `prospects` row says `monthly_price=149, plan_tier=1, tier='elite'`. **Entitlement must not derive from payment.**
- `settings.subscription` writers: `stripe-webhook` (Stripe price→tier, S251), `provision-tenant` (seed), SPA `PlanContext.setTier`.

---

## A. ENTITLEMENT FIELD

**Recommendation (conservative): single column `tenants.entitlement smallint`** — NOT NULL, DEFAULT 1, CHECK (1–4).
- Atomic with the tenant row; `tenants` RLS already governs reads; smallest surface; the resolver does one lookup it likely already makes.
- A separate `entitlements` table is the alternative (buys history + a natural home for the Voice add-on / future SKUs). **Flag for validators**, but the add-on is explicitly outside the four-tier scale and shouldn't drive a 1–4 scalar's shape today. **Conservative-wins → one column.**
- DEFAULT 1 is a NOT-NULL safety floor for future rows; provisioning sets the real value explicitly (see E), so no tenant relies on the default.

## B. RESOLVER (single source, every Wave-1 site consumes it)

One server helper + one client read, both reading `tenants.entitlement` **first**, falling back to `settings.subscription.tier` only while the column is absent (code-first window) or somehow unreadable:

```ts
// supabase/functions/_shared/aiAuth.ts  (new shared helper, used by BOTH
// requireAiCaller and ai-proxy/internal — replaces the two inline settings reads)
export async function resolveEntitlement(svc, tenantId: string): Promise<number | null> {
  // tolerant read: pre-migration the column doesn't exist → fall back.
  const { data, error } = await svc.from('tenants').select('entitlement').eq('id', tenantId).maybeSingle()
  if (!error && typeof data?.entitlement === 'number') return data.entitlement   // authoritative
  const { data: sub } = await svc.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'subscription').maybeSingle()
  const t = (sub?.value as { tier?: unknown } | null)?.tier
  return typeof t === 'number' ? t : null   // string "elite" still → null → fail-closed (unchanged)
}
```
- `requireAiCaller`: replace lines 82–92 to call `resolveEntitlement`; `null` → 403 (fail-closed, unchanged); else compare `tier < required`. **Tier 4 now has a home** (4 ≥ any threshold).
- `ai-proxy/internal` (lines 140–142): same helper, compare `< PRO_TIER`.
- **SPA `PlanContext`:** read `tenants.entitlement` first; fallback to the existing `settings.subscription` string-convert. `canAccess`/`useTierGate`/`FeatureGate` unchanged downstream — they keep consuming `usePlan()`. Fold the two second-reads (`BillingTab`, `BrandingSection`) onto `usePlan()` so PlanContext is the only client fetch.
- **`PlanContext.setTier` / demo `TierToggle`:** write `tenants.entitlement` (this becomes the QA lever for "a tenant at each scale value"); optionally mirror `settings.subscription` for billing display.

**Authority decision (recommended, flag for validators): `tenants.entitlement` is authoritative for ALL gating; `settings.subscription` is demoted to a billing/display mirror** (still written by `stripe-webhook` so BillingTab shows the paid plan, but no gate reads it). This is required because entitlement is decoupled from Stripe price (Dang). The alternative — a sync bridge keeping `settings.subscription.tier` == entitlement — reintroduces the exact coupling we're breaking, so the webhook would fight the Dang override. **Conservative-wins → authoritative column, settings.subscription = display mirror, no gate reads it.**

**Drift/reconciliation (flag for validators):** because entitlement ≠ Stripe price by design, add a *documented* reconciliation query (entitlement vs `prospects.plan_tier`) for Scott to eyeball intentional discounts (Dang will legitimately differ). Automated reconciliation is out of scope this session.

> **Cross-boundary note:** "one resolver" = one DATA source (`tenants.entitlement`) with two thin readers (Deno edge + Vite client) — a shared TS module can't span the runtimes. Both readers use identical precedence (entitlement → settings fallback). Confirm acceptable.

## C. DATA FIX (normalize all tenants to the 1–4 scale)
Explicit per-tenant backfill — **entitlement values, NOT derived from payment.** Real/protected tenants get their true entitlement; non-protected seed tenants double as standing QA fixtures (adjustable).

| Tenant | id | entitlement | rationale |
|---|---|---|---|
| Dang Pest Control (real, protected) | 1611b16f… | **4** | Elite guinea-pig; pays $149 (untouched in prospects) |
| PestFlow Pro master/demo (protected) | 9215b06b… | **4** | demo shows everything |
| Apex Pest Protection (seed) | c5a0d3e6… | **1** | Starter QA fixture |
| ZZ Dryrun Pest Co (seed; string-bug) | 9e7c9b69… | **2** | Growth QA fixture — **kills the string-"elite" bug** |
| Coastal Pest Co. (seed) | a3e8b1c4… | **3** | Pro QA fixture |
| Heartland / Metro / Urban Strike (seed) | d6b1e4f7…, e7c2f5a8…, b4f9c2d5… | **4** | Elite |
| any row missed | — | **1** | NOT-NULL safety net |

⚠️ Backfilling seed tenants below 4 **does change their gating** (today they're effectively Elite via `settings.subscription=4`). Intended — they become fixtures with no real users. Dang/master are unchanged. After this, **no tenant resolves to NULL/unreadable** and the string-"elite" inconsistency is gone.

## D. THE TWO RE-MAPS (server authoritative + SPA mirror)
1. **`composer_captions` 1 → 3** ("Growth schedules it, Pro writes it"):
   - Server: `aiAuth.ts FEATURE_TIER.composer_captions = 3`.
   - SPA mirror: `socialLimits.ts SOCIAL_LIMITS[2].canUseAI: true → false` (Growth no longer AI-writes captions; Pro/Elite keep `canUseAI:true`). This prevents Growth users clicking an AI-caption button that the server now 403s. `useAiCaptionQuota` (the Starter 1/day localStorage path) becomes vestigial (tiers 1–2 have no caption AI) — leave in place, note as dead for cleanup.
2. **`content_queue_schedule` 1 → 2** (all scheduling at Growth):
   - Server: `aiAuth.ts FEATURE_TIER.content_queue_schedule = 2`.
   - SPA mirror: **no change** — `SOCIAL_LIMITS[1].canSchedule=false`, `[2]=true` already gates scheduling at Growth; the server value was simply lagging.

Everything else in `FEATURE_TIER` stays as-is (full-matrix wiring is the next session).

## E. MIGRATION SEQUENCING (code-first per standing rule)
1. **Ship code first** (PR): `resolveEntitlement` helper + both edge readers + SPA PlanContext read/`setTier` + fold the two second-reads + the two re-maps (server + SPA mirror). The reader **tolerates the column being absent** (falls back to `settings.subscription`), so behavior is unchanged pre-migration → zero regression. Merge → **Vercel READY**.
2. **THEN `apply_migration`** (MCP) — DDL below — adds column, backfills, sets DEFAULT/NOT NULL/CHECK, ends with `NOTIFY pgrst, 'reload schema'`. After reload, entitlement takes precedence everywhere.
3. **Follow-up chore PR for repo truth:** `apply_migration` writes `schema_migrations` but NOT a repo file — add the migration SQL to `supabase/migrations/` so the repo matches the DB.

### Forward DDL (apply AFTER step-1 code is live + Vercel READY)
```sql
-- S262: tenants.entitlement — canonical 4-tier scale, decoupled from payment
alter table public.tenants add column if not exists entitlement smallint;

-- explicit backfill (entitlement, NOT derived from prospects/Stripe)
update public.tenants set entitlement = 4 where id = '1611b16f-381b-4d4f-ba3a-fbde56ad425b'; -- Dang (Elite)
update public.tenants set entitlement = 4 where id = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'; -- master/demo
update public.tenants set entitlement = 1 where id = 'c5a0d3e6-4f3b-4c9e-b08d-3b6f9c5eadae'; -- Apex (fixture)
update public.tenants set entitlement = 2 where id = '9e7c9b69-d961-4f20-b78e-8fd86dd244b4'; -- ZZ Dryrun (fixture; was "elite")
update public.tenants set entitlement = 3 where id = 'a3e8b1c4-2d1f-4a7c-9e6b-1f4d7a3c8b2e'; -- Coastal (fixture)
update public.tenants set entitlement = 4 where id in
  ('d6b1e4f7-5a4c-4daf-919e-4c7adda6ebbf','e7c2f5a8-6b5d-4eb0-a2af-5d8beebebcc0','b4f9c2d5-3e2a-4b8d-af7c-2a5e8b4d9c3f');
update public.tenants set entitlement = 1 where entitlement is null;   -- safety net

alter table public.tenants alter column entitlement set default 1;
alter table public.tenants alter column entitlement set not null;
alter table public.tenants add constraint tenants_entitlement_check check (entitlement between 1 and 4);

notify pgrst, 'reload schema';
```

### Rollback SQL (staged in the same migration commit)
```sql
alter table public.tenants drop constraint if exists tenants_entitlement_check;
alter table public.tenants drop column if exists entitlement;
notify pgrst, 'reload schema';
```
Rollback is safe: the step-1 reader falls back to `settings.subscription` when the column is gone, so dropping it reverts to today's behavior without a code redeploy.

## Provisioning forward-fill (so new tenants aren't stuck at default 1)
`provision-tenant` (and the `stripe-webhook` checkout path) set `tenants.entitlement` from the provisioning plan_tier on creation; manual override for discounted guinea-pigs (Dang pattern). Default 1 is only a floor.

---

## VALIDATOR GATE — questions to run (Perplexity + Gemini, conservative-wins)
1. **Schema:** single `tenants.entitlement smallint` (CHECK 1–4, NOT NULL, default 1) vs a separate `entitlements` table? (Recommend column; table only if near-term history/add-on SKUs justify it.)
2. **Authority:** make `tenants.entitlement` authoritative and **deprecate `settings.subscription` for gating** (display mirror only), vs a sync bridge keeping them equal? (Recommend authoritative — a bridge re-couples entitlement to Stripe price and breaks the Dang discount.)
3. **Drift:** does decoupling entitlement from payment need a reconciliation path now, or is a documented mismatch query (entitlement vs `prospects.plan_tier`) enough this session? (Recommend documented query; automated reconciliation later.)
4. **Resolver shape:** is "one data source, two thin readers (edge Deno + client Vite) with identical precedence" acceptable as "single resolver", given a shared module can't cross runtimes?
5. **Code-first read tolerance:** is the `select('entitlement')`-then-fallback pattern safe through the pre-migration window (column absent → fallback to `settings.subscription`), or should the migration's ADD COLUMN (nullable) ship before any reader names the column?

## Wave 3/4 acceptance (after gate clears)
- Dang resolves entitlement = 4 through the resolver.
- No tenant resolves NULL/undefined/unreadable (string-"elite" gone).
- Fixtures at 1/2/3/4 resolve correctly; **Growth fixture (ZZ Dryrun, 2) is blocked from `composer_captions` (now Pro) and allowed `content_queue_schedule` (now Growth)**.
- Every Wave-1 gate site consumes the single resolver (no second `settings.subscription` reads remain).
- Cross-tenant + auth tests; CI green (tsc/lint/build/ai-proxy guard).
- MCP migration → follow-up chore PR adds the SQL to `supabase/migrations/`.

## Out of scope (do NOT build in S262)
Full feature-by-feature matrix wiring beyond the two re-maps; the gated suggested-fix layer; ★ build-new features (cap enforcement, volume metering, weekly cadence, auto-fix scheduling, roll-up, QBR); Voice add-on / $1,299.
