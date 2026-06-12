# S262 — Protected-file handoff (apply through the `protect-files.sh` guard)

Three pieces of S262 touch DO-NOT-TOUCH paths and could not be edited by CC Web.
Apply these yourself. The **non-protected** code is already in PR #176, and the
**migration is already applied live via MCP** (versions below) EXCEPT the final
`SET NOT NULL` latch.

**Recommended order:** (1) merge PR #176 → Vercel deploys the SPA. (2) Apply diff 1
(provision-tenant) + diff 2 (stripe-webhook) and **redeploy** `ai-proxy`,
`process-campaign-job`, `generate-social-batch`, `post-to-social`, `provision-tenant`,
`stripe-webhook`. (3) Only after provision-tenant is live, apply the deferred
`SET NOT NULL` (diff 3, step 4). (4) Commit the migration files (diff 3) for repo truth.

> Until `ai-proxy` + the 3 workers are redeployed they keep reading
> `settings.subscription` (unchanged, tier 4 for all existing tenants) — zero
> regression. The RPC already exists, so the redeploy has no fail-closed window.

---

## Diff 1 — `supabase/functions/provision-tenant/index.ts` (D2e: set entitlement)

**(a) Insert after the line `const wsub = wd?.subscription   || {}` (~line 205):**
```ts
    // S262 — numeric access entitlement (1=Starter…4=Elite) for tenants.entitlement,
    // set EXPLICITLY at provisioning. The column has NO database default; absence
    // must fail loud, never silently default to Starter. Derived from the SOLD plan,
    // never from a payment record (entitlement ≠ price is a permanent business rule).
    const _entToNum = (raw: string | number | undefined | null): number => {
      if (typeof raw === 'number') return raw >= 1 && raw <= 4 ? raw : 1
      const sl = typeof raw === 'string' ? raw.toLowerCase().trim() : ''
      return sl === 'elite' ? 4 : sl === 'pro' ? 3 : (sl === 'growth' || sl === 'grow') ? 2 : 1
    }
    const entitlement = _entToNum(
      wsub.tier ?? subscription?.tier ?? wsub.plan_name ?? subscription?.plan_name ?? body.plan,
    )
```

**(b) Tenant INSERT (~line 250):**
```ts
-        .insert({ slug: resolvedSlug, name })
+        .insert({ slug: resolvedSlug, name, entitlement })
```

**(c) Existing-tenant UPDATE (~line 262):**
```ts
-      await supabase.from('tenants').update({ slug: resolvedSlug, name }).eq('id', tenantId)
+      await supabase.from('tenants').update({ slug: resolvedSlug, name, entitlement }).eq('id', tenantId)
```

---

## Diff 2 — `supabase/functions/stripe-webhook/index.ts` (D3: SEVER the gate write)

Replace the **entire** `else if (event.type === 'customer.subscription.updated') { … }`
block (the S251 block) with the version below. It STOPS writing
`settings.subscription` (tier/plan_name/monthly_price) and keeps only the
billing-only `stripe_billing.current_price_id` sync + event idempotency.

```ts
    } else if (event.type === 'customer.subscription.updated') {
      // S262 — webhook SEVERED from the gate path. This block NO LONGER writes
      // settings.subscription (tier/plan_name/monthly_price). Access entitlement
      // lives in tenants.entitlement and changes ONLY by deliberate operator action
      // / provisioning — NEVER derived from the Stripe price.
      //
      // WHY: intentional entitlement≠price divergence is a PERMANENT business rule.
      // Dang is the canonical case (Elite entitlement, Starter price $149). Before
      // severance, a customer.subscription.updated for Dang would resolve his stored
      // price_1TNP7E2…(Starter) → tier 1 and silently downgrade him out of Elite.
      // Re-coupling entitlement to Stripe price in any future change requires an
      // explicit decision (see view: entitlement_price_reconciliation).
      //
      // We STILL maintain BILLING-ONLY state (stripe_billing.current_price_id) that
      // NOTHING gates on, for invoice/billing tracking + the reconciliation report.

      const TIER_PRICE: Record<number, string> = {
        1: 'price_1TNP7E2SfqMqfaLwlydZQM5u', 2: 'price_1TNP7A2SfqMqfaLwxVVdp6rf',
        3: 'price_1TNP762SfqMqfaLwhC7MTvIm', 4: 'price_1TNP722SfqMqfaLwu8vH6hre',
      }
      const KNOWN_PRICES = new Set(Object.values(TIER_PRICE))

      // event.id idempotency (at-least-once delivery)
      const { data: seen } = await supabase
        .from('processed_webhook_events').select('event_id').eq('event_id', event.id).maybeSingle()
      if (seen) { console.log(`[sub.updated] event ${event.id} already processed`); return ok() }

      const evtSub = event.data.object as Stripe.Subscription

      // fetch FRESH from Stripe (ordering/retry safety)
      let sub: Stripe.Subscription
      try {
        const stripeClient = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any })
        sub = await stripeClient.subscriptions.retrieve(evtSub.id)
      } catch (e: any) {
        console.error('[sub.updated] subscription retrieve failed (transient):', e.message)
        return new Response('retrieve failed', { status: 500 })
      }

      if (sub.status !== 'active') { console.log(`[sub.updated] status=${sub.status} — skip`); return ok() }

      const tierItem = sub.items.data.find(it => KNOWN_PRICES.has(it.price.id))
      if (!tierItem) { console.warn(`[sub.updated] no known managed price on ${sub.id} — skip`); return ok() }

      // resolve tenant by STORED stripe_customer_id (no email)
      const { data: rows, error: rowsErr } = await supabase
        .from('settings').select('tenant_id, value').eq('key', 'stripe_billing')
      if (rowsErr) { console.error('[sub.updated] settings read failed (transient):', rowsErr.message); return new Response('db error', { status: 500 }) }
      const match = (rows || []).find((r: any) => r.value?.customer_id === sub.customer)
      const tenantId = match?.tenant_id || null
      if (!tenantId) { console.warn(`[sub.updated] no tenant for customer ${sub.customer} — skip`); return ok() }

      // BILLING-ONLY: keep stripe_billing.current_price_id in sync. This is NOT a
      // gate input — entitlement is untouched. (best-effort, non-fatal)
      const newVal = { ...(match.value || {}), current_price_id: tierItem.price.id }
      const { error: billErr } = await supabase.from('settings').update({ value: newVal }).eq('tenant_id', tenantId).eq('key', 'stripe_billing')
      if (billErr) { console.error('[sub.updated] stripe_billing write failed (transient):', billErr.message); return new Response('db error', { status: 500 }) }
      console.log(`[sub.updated] tenant ${tenantId} billing price → ${tierItem.price.id} (entitlement UNCHANGED — gate severed)`)

      // mark event processed LAST
      await supabase.from('processed_webhook_events').insert({ event_id: event.id, event_type: event.type })
    }
```

---

## Diff 3 — repo migration files (`supabase/migrations/` — repo truth)

Already applied live via MCP (these exact versions are in `schema_migrations`). Add
the matching files so the repo equals the DB:

- `20260612144601_s262_tenant_entitlement_column.sql`
- `20260612144629_s262_check_tenant_access_rpc.sql`
- `20260612144707_s262_entitlement_reconciliation_view.sql`

The full SQL for each is in the three `apply_migration` calls (identical text). Then:

**Step 4 — the DEFERRED `SET NOT NULL` latch.** Apply this ONLY after provision-tenant
(diff 1) is deployed, as a new migration `…_s262_entitlement_not_null.sql`:
```sql
-- Prereq: provision-tenant deployed (it now sets entitlement on every insert), so
-- new tenants always satisfy NOT NULL. All 8 existing rows are already backfilled
-- (verified: 0 NULLs). Applying before provision-tenant is live would 500 a paying
-- customer's checkout (old insert omits entitlement → NOT NULL violation).
alter table public.tenants alter column entitlement set not null;
```

**Rollback (staged, if the foundation must be reverted):**
```sql
drop view if exists public.entitlement_price_reconciliation;
drop function if exists public.check_tenant_access(uuid, smallint);
alter table public.tenants drop constraint if exists tenants_entitlement_check;
alter table public.tenants drop column if exists entitlement;   -- (drops NOT NULL too)
notify pgrst, 'reload schema';
```
Rollback is safe once the edge functions are reverted: the pre-S262 gates read
`settings.subscription` (untouched throughout), so dropping the column/RPC reverts
to today's behavior.

---

## Follow-ups flagged (NOT in S262 scope)
- **Broader `Grow` → `Growth`** copy: D6's 6 listed files are done; ~12 CTA/legal/
  comment occurrences remain (`ComposerScheduler`, `ConnectionsModal` CTA,
  `Dashboard.tsx:147`, `terms.ts`, `repGuideContent`, `client-setup` labels, code
  comments). Cosmetic; intentionally deferred off this auth PR.
- **Standing business rule (state in PR):** intentional entitlement≠price divergence
  is PERMANENT. Dang (Elite entitlement, Starter price) is correct. Do not re-couple
  entitlement to Stripe price without an explicit decision.
