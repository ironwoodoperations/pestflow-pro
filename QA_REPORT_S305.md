# QA Report — S305: outscraper-reviews manual-refresh gate → tenants.entitlement

**Date:** 2026-08-28
**Branch:** `claude/demo-tier-badges-gating-1v74gr` (restarted from `main` @ `9d544aa`)
**QA author:** Claude Code
**Verdict:** ✅ PASS as a **behavioral no-op** — all 9 tenants produce an identical
gate result on the old and new paths, `parseTier` has zero remaining references,
the diff touches one file, and `verify_jwt` is unmodified.
**⚠️ NOT SHIPPABLE YET:** the Wave 3 Perplexity + Gemini validator gate was **not
run** (tools unreachable in-session) and blocks merge. See the REVIEW doc.

## How this was verified

Static verification (grep, diff inspection, CI gates) plus **read-only SQL against
the live database** via Supabase MCP. No write of any kind was issued: every
statement this session was a `select`. The function was **not deployed**.

The gate cannot be exercised end-to-end from this session — it needs a real user
JWT for an Elite tenant plus a live Outscraper call that costs money and burns the
6-hour rate limit. Instead the two code paths were **evaluated in SQL against the
real data for all nine tenants**, which is what the acceptance criterion asks for.

## Checks walked

| # | Check | Expected | Actual | Result |
|---|-------|----------|--------|--------|
| 1 | Old vs new gate result, all 9 tenants | every row matches | 9/9 match | ✅ |
| 2 | dang (entitlement 4, has Google ID) | allowed, unchanged | passes gate both paths | ✅ |
| 3 | pls (entitlement 3, has Google ID) | 403, unchanged | denied both paths | ✅ |
| 4 | `parseTier` references repo-wide | 0 | 0 | ✅ |
| 5 | Diff touches no other edge function | 1 file | `outscraper-reviews/index.ts` only | ✅ |
| 6 | `verify_jwt` not modified | unchanged | `config.toml` not in changed set | ✅ |
| 7 | 403 body string byte-identical | unchanged | `'Manual refresh requires Elite plan (tier 4)'` | ✅ |
| 8 | Threshold still Elite | ≥ 4 | `p_required_tier: 4` | ✅ |
| 9 | RPC executable by service_role | true | true (anon/authenticated false) | ✅ |
| 10 | RPC has exactly one signature | 1 | 1 — no PGRST203 risk | ✅ |
| 11 | `serviceClient` is service-role | yes | `createClient(url, serviceRoleKey)` :70 | ✅ |
| 12 | No `settings.subscription` VALUES altered | none | read-only session | ✅ |
| 13 | `tsc` / `eslint` / `build` | clean | 0 / 0 errors / PASS | ✅ |
| 14 | BL canary `src/shells` + `app` | empty | empty | ✅ |
| 15 | Gating reads of `settings.subscription` remaining | 0 after merge | 0 | ✅ |

### Check 1–3 — the nine-tenant old-vs-new proof

`old_gate_pass` replicates `parseTier(settings.subscription.tier) >= 4` in SQL.
`new_gate_pass` calls the real `public.check_tenant_access(id, 4)`.

| slug | entitlement | sub.tier | OLD pass | NEW pass | match | Google ID | expected outcome |
|---|---|---|---|---|---|---|---|
| dang | 4 | 4 | true | true | ✅ | yes | passes gate, proceeds |
| metro-pest-concierge | 4 | 4 | true | true | ✅ | no | passes gate, then 422 |
| pestflow-pro | 4 | 4 | true | true | ✅ | no | passes gate, then 422 |
| apex-protect | 3 | 3 | false | false | ✅ | no | 403 (tier gate) |
| pls | 3 | 3 | false | false | ✅ | yes | 403 (tier gate) |
| urban-strike | 3 | 3 | false | false | ✅ | no | 403 (tier gate) |
| vita-glow | 3 | 3 | false | false | ✅ | no | 403 (tier gate) |
| coastal-pest | 2 | 2 | false | false | ✅ | no | 403 (tier gate) |
| heartland-pest | 1 | 1 | false | false | ✅ | no | 403 (tier gate) |

**9 of 9 rows identical.** Matches the corrected expectation table exactly,
including the order-of-operations correction (tier gate precedes the integrations
read, so a non-Elite tenant with no Google identifier returns **403, not 422**).

**Zero demo impact confirmed:** no demo tenant (coastal-pest, urban-strike,
apex-protect, heartland-pest, metro-pest-concierge) has a Google identifier, and
four of the five are below Elite so they never reach the integrations read at all.

**Note on the seven "configured" tenants:** a key-presence test
(`value ? 'google_place_id'`) reports true for seven tenants, but the values are
**empty strings** for all but dang and pls. The table above uses
`nullif(trim(...),'')`, matching `buildOutscraperQuery`'s treatment of blank as
absent. The brief's claim that only dang and pls are configured is **correct**;
a naive presence check would have contradicted it wrongly.

### Check 9–10 — the RPC this change now depends on

```
proname              args                                      secdef  owner
check_tenant_access  p_tenant_id uuid, p_required_tier integer  true   postgres

service_role_can_exec   = true
authenticated_can_exec  = false
anon_can_exec           = false
signature count         = 1  (S273 collapse; no PGRST203 overload ambiguity)
```

### Check 4 — orphan removal

```
$ rg -n 'parseTier' supabase/ src/ shared/
(count: 0)
```

---

# Wave 1 — grep results, verbatim

Recursive grep (ripgrep-equivalent) against a **pristine checkout of `main`**
before any edit — not GitHub code search, per the brief. 47 deployed functions
under `supabase/functions/`.

## Conclusion first

**Exactly ONE gating read of `settings.subscription` existed in the entire edge
function surface**, and this PR removes it. Everything else is a write, a display
value from a request body, or a false-positive match on the Stripe Checkout mode
string. **The fix did not need widening.**

| file:line | GATES / READS | callable by |
|---|---|---|
| `outscraper-reviews/index.ts:112` | **GATES** — 403 when tier < 4 | user JWT (`requireTenantUser`) + Vault cron-secret bypass |
| `provision-tenant/index.ts:549` | WRITE — seeds the settings row | service-role |
| `provision-tenant/index.ts:231,453` | WRITE path (`wsub.tier`) | service-role |
| `stripe-webhook/index.ts:88` | WRITE (default payload) | service-role (webhook) |
| `stripe-webhook/index.ts:156-165` | COMMENT — states entitlement is deliberately decoupled from price | — |
| `ironwood-provision/index.ts:95` | WRITE (default payload) | JWT, operator-only |
| `notify-upgrade/index.ts:39,60,61` | READS/DISPLAYS — `plan_name`/`monthly_price` arrive in the **request body**, rendered into a notification email; no control flow | JWT |
| `create-checkout-session/index.ts:2,82` | **FALSE POSITIVE** — `mode: 'subscription'` is the Stripe Checkout mode, not a settings key | JWT |
| `create-upgrade-session/index.ts:5` | **FALSE POSITIVE** — a comment stating Stripe is the source of truth, *not* `settings.subscription.tier` | JWT |

**Frontend caller — already correct, nothing to move.**
`src/components/admin/TestimonialsTab.tsx:113` calls the function with
`mode: 'manual'`. Its pre-flight is `<FeatureGate minTier={4}>` at :318, and
`FeatureGate` (`src/components/common/FeatureGate.tsx`) reads `usePlan()` →
`tenants.entitlement`. **It gates on entitlement, so it is already correct and
needs no change.** This is the divergence the PR closes: the button read the
source of truth while the server read the drifting copy.

```
$ rg -n "'subscription'|\"subscription\"" supabase/functions/
supabase/functions/create-checkout-session/index.ts:2:// mode: 'subscription' — recurring only.
supabase/functions/create-checkout-session/index.ts:82:      mode:              'subscription',
supabase/functions/provision-tenant/index.ts:549:      { tenant_id: tenantId, key: 'subscription', value: {
supabase/functions/outscraper-reviews/index.ts:112:      const { data: subRow } = await serviceClient.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'subscription').maybeSingle()

$ rg -n 'parseTier' supabase/functions/
supabase/functions/outscraper-reviews/index.ts:56:function parseTier(raw) {
supabase/functions/outscraper-reviews/index.ts:113:      const tier = parseTier(subRow?.value?.tier)

$ rg -n 'plan_name' supabase/functions/
supabase/functions/notify-upgrade/index.ts:39:    const { tenant_id, old_tier, new_tier, plan_name, monthly_price, feature } = await req.json()
supabase/functions/notify-upgrade/index.ts:60:    const newName = plan_name || TIER_NAMES[new_tier] || `Tier ${new_tier}`
supabase/functions/ironwood-provision/index.ts:95:      subscription: subscription || { tier: 1, plan_name: 'Starter', monthly_price: 149 },
supabase/functions/provision-tenant/index.ts:155:  subscription: { tier: number; plan_name: string; monthly_price: number }
supabase/functions/provision-tenant/index.ts:231:      wsub.tier ?? subscription?.tier ?? wsub.plan_name ?? subscription?.plan_name ?? body.plan,
supabase/functions/provision-tenant/index.ts:454:    const _planStr  = wsub.plan_name || subscription?.plan_name || body.plan || ''
supabase/functions/provision-tenant/index.ts:552:        plan_name:     resolvedPlanName,
supabase/functions/provision-tenant/index.test.ts:89:  subscription: { tier: 1, plan_name: 'Starter', monthly_price: 149 },
supabase/functions/stripe-webhook/index.ts:88:        subscription: pd.subscription || { tier: 1, plan_name: 'Starter', monthly_price: 149 },
supabase/functions/stripe-webhook/index.ts:156:      // settings.subscription (tier/plan_name/monthly_price). Access entitlement

$ rg -n 'monthly_price' supabase/functions/
supabase/functions/notify-upgrade/index.ts:39:    const { tenant_id, old_tier, new_tier, plan_name, monthly_price, feature } = await req.json()
supabase/functions/notify-upgrade/index.ts:61:    const price   = monthly_price ? `$${monthly_price}/mo` : ''
supabase/functions/ironwood-provision/index.ts:95:      subscription: subscription || { tier: 1, plan_name: 'Starter', monthly_price: 149 },
supabase/functions/provision-tenant/index.ts:155:  subscription: { tier: number; plan_name: string; monthly_price: number }
supabase/functions/provision-tenant/index.ts:458:    const resolvedMonthlyPrice = wsub.monthly_price || subscription?.monthly_price || _tierPrices[tierStr] || 149
supabase/functions/provision-tenant/index.ts:553:        monthly_price: resolvedMonthlyPrice,
supabase/functions/provision-tenant/index.test.ts:89:  subscription: { tier: 1, plan_name: 'Starter', monthly_price: 149 },
supabase/functions/stripe-webhook/index.ts:88:        subscription: pd.subscription || { tier: 1, plan_name: 'Starter', monthly_price: 149 },
supabase/functions/stripe-webhook/index.ts:156:      // settings.subscription (tier/plan_name/monthly_price). Access entitlement

$ rg -n '\.tier' supabase/functions/
supabase/functions/create-upgrade-session/index.ts:5:// the source of current-tier truth, NOT the app's settings.subscription.tier.
supabase/functions/provision-tenant/index.ts:231:      wsub.tier ?? subscription?.tier ?? wsub.plan_name ?? subscription?.plan_name ?? body.plan,
supabase/functions/provision-tenant/index.ts:453:    const _rawTier = wsub.tier ?? subscription?.tier
supabase/functions/outscraper-reviews/index.ts:113:      const tier = parseTier(subRow?.value?.tier)

$ rg -n 'entitlement' supabase/functions/   # who already reads the source of truth
supabase/functions/ai-proxy/index.ts:140:    // S262 — via the single authoritative RPC (tenants.entitlement), fail-closed.
supabase/functions/post-to-social/index.ts:181:  // S262 — access via the single authoritative RPC (tenants.entitlement), fail-closed.
supabase/functions/generate-social-batch/index.ts:48:  // S262: via the single authoritative RPC (tenants.entitlement), fail-closed.
supabase/functions/provision-tenant/index.ts:221:    // S262 — numeric access entitlement (1=Starter…4=Elite) for tenants.entitlement,
supabase/functions/provision-tenant/index.ts:224:    // never from a payment record (entitlement ≠ price is a permanent business rule).
supabase/functions/provision-tenant/index.ts:230:    const entitlement = _entToNum(
supabase/functions/provision-tenant/index.ts:298:          .insert({ slug: resolvedSlug, name, entitlement })
supabase/functions/provision-tenant/index.ts:310:      await supabase.from('tenants').update({ slug: resolvedSlug, name, entitlement }).eq('id', tenantId)
supabase/functions/process-campaign-job/index.ts:101:    // single authoritative RPC (tenants.entitlement), not settings.subscription.
supabase/functions/stripe-webhook/index.ts:156:      // settings.subscription (tier/plan_name/monthly_price). Access entitlement
supabase/functions/stripe-webhook/index.ts:157:      // lives in tenants.entitlement and changes ONLY by deliberate operator action
supabase/functions/stripe-webhook/index.ts:160:      // WHY: intentional entitlement≠price divergence is a PERMANENT business rule.
supabase/functions/stripe-webhook/index.ts:161:      // Dang is the canonical case (Elite entitlement, Starter price $149). Before
supabase/functions/stripe-webhook/index.ts:164:      // Re-coupling entitlement to Stripe price in any future change requires an
supabase/functions/stripe-webhook/index.ts:165:      // explicit decision (see view: entitlement_price_reconciliation).
supabase/functions/stripe-webhook/index.ts:207:      // gate input — entitlement is untouched. (best-effort, non-fatal)
supabase/functions/stripe-webhook/index.ts:211:      console.log(`[sub.updated] tenant ${tenantId} billing price → ${tierItem.price.id} (entitlement UNCHANGED — gate severed)`)
supabase/functions/_shared/auth/requireTenantUser.test.ts:57:  // Two tenants. entitlement is NOT NULL (S262); name NOT NULL. Unique slug/subdomain.
supabase/functions/_shared/auth/requireTenantUser.test.ts:59:    { id: tenantA, name: `ISO Test A ${suffix}`, slug: `iso-a-${suffix}`, subdomain: `iso-a-${suffix}`, entitlement: 1 },
supabase/functions/_shared/auth/requireTenantUser.test.ts:60:    { id: tenantB, name: `ISO Test B ${suffix}`, slug: `iso-b-${suffix}`, subdomain: `iso-b-${suffix}`, entitlement: 1 },
supabase/functions/_shared/aiAuth.ts:89:  // tenants.entitlement in the DB (the one place that can't desync across

$ rg -n 'check_tenant_access' supabase/functions/
supabase/functions/ai-proxy/index.ts:141:    const { data: allowed, error: gateErr } = await svc.rpc('check_tenant_access', {
supabase/functions/post-to-social/index.ts:186:    supabase.rpc('check_tenant_access', { p_tenant_id: tenantId, p_required_tier: 2 }),
supabase/functions/post-to-social/index.ts:187:    supabase.rpc('check_tenant_access', { p_tenant_id: tenantId, p_required_tier: 3 }),
supabase/functions/apply-finding-fix/index.ts:19:// own check_tenant_access(t,4) is first. 5 user_edited=false + updated_at in the WHERE.
supabase/functions/apply-finding-fix/index.ts:66:  const { data, error } = await svc.rpc('check_tenant_access', { p_tenant_id: tenant, p_required_tier: 3 })
supabase/functions/apply-finding-fix/index.ts:170:    const { data: elite, error: gErr } = await svc.rpc('check_tenant_access', { p_tenant_id: tenant, p_required_tier: 4 })
supabase/functions/generate-social-batch/index.ts:49:  const { data: allowed, error: gateErr } = await svc.rpc('check_tenant_access', { p_tenant_id: tenantId, p_required_tier: PRO_TIER })
supabase/functions/process-campaign-job/index.ts:102:    const { data: allowed, error: gateErr } = await svc.rpc('check_tenant_access', { p_tenant_id: job.tenant_id, p_required_tier: PRO_TIER })
supabase/functions/_shared/aiAuth.ts:88:  // edge anymore: check_tenant_access(p_tenant_id, p_required_tier) reads
supabase/functions/_shared/aiAuth.ts:92:  const { data: allowed, error } = await svc.rpc('check_tenant_access', {
```
