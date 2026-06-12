-- S262 (D5) — READ-ONLY reconciliation: entitlement vs Stripe-price-implied tier.
-- Never auto-corrects. "no_billing" (no price on file) is N/A, not a mismatch.
create or replace view public.entitlement_price_reconciliation as
with billing as (
  select
    t.id   as tenant_id,
    t.name as tenant_name,
    t.entitlement,
    sb.value->>'current_price_id' as stripe_price_id,
    case sb.value->>'current_price_id'
      when 'price_1TNP7E2SfqMqfaLwlydZQM5u' then 1
      when 'price_1TNP7A2SfqMqfaLwxVVdp6rf' then 2
      when 'price_1TNP762SfqMqfaLwhC7MTvIm' then 3
      when 'price_1TNP722SfqMqfaLwu8vH6hre' then 4
      else null
    end as price_implied_tier
  from public.tenants t
  left join public.settings sb on sb.tenant_id = t.id and sb.key = 'stripe_billing'
)
select
  tenant_id, tenant_name, entitlement, stripe_price_id, price_implied_tier,
  case
    when stripe_price_id is null or price_implied_tier is null then 'no_billing'
    when price_implied_tier = entitlement then 'match'
    when entitlement > price_implied_tier then 'entitled_above_paid'
    else 'paid_above_entitled'
  end as status
from billing;

revoke all on public.entitlement_price_reconciliation from public;
revoke all on public.entitlement_price_reconciliation from anon;
revoke all on public.entitlement_price_reconciliation from authenticated;
grant select on public.entitlement_price_reconciliation to service_role;

notify pgrst, 'reload schema';
