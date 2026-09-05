// S243 — AI proxy auth/feature gating.
// Sibling to _shared/auth/requireTenantUser.ts (which is protected — we import
// from it read-only rather than editing it). This module owns the AiFeature
// union, the feature→tier map, the Ironwood operator allowlist, and the
// per-feature caller gate used by the ai-proxy edge function.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from './auth/requireTenantUser.ts'
import { isIronwoodOperator } from './operatorLookup.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// R3: identity is email; AUTHORIZATION is UUID — unchanged. What changed in
// S346 is WHERE the authorized UUIDs come from: public.operators, via
// ./operatorLookup.ts, instead of a hardcoded Set that had drifted into being
// the exact opposite of the table. There is deliberately NO constant here to
// add a uuid to; a test asserts one has not come back.

export type AiFeature =
  | 'content_page' | 'composer_captions' | 'composer_schedule'
  | 'content_queue_schedule' | 'seo_metadata' | 'blog_draft'
  | 'blog_seo' | 'seo_keywords' | 'campaign_generation'
  | 'redirect_map' | 'scrape_prospect_analyze' | 'seo_fix'

// feature → minimum tenant tier (canonical 1=Starter…4=Elite). 'operator' =
// Ironwood-ops only (no tenant tier).
// S262 re-maps (locked, PFP_Pricing_Tiers.docx §5): composer_captions 1→3
// ("Growth schedules it, Pro writes it") and content_queue_schedule 1→2 (all
// scheduling lives at Growth). Keep the SPA mirror (socialLimits.ts) in lockstep.
export const FEATURE_TIER: Record<AiFeature, number | 'operator'> = {
  content_page:           1,
  composer_captions:      3,
  composer_schedule:      2,
  content_queue_schedule: 2,
  seo_metadata:           2,
  blog_draft:             3,
  blog_seo:               3,
  seo_keywords:           3,
  campaign_generation:    3,
  // S263 — Report Fix-Chain suggested-fix generation. Pro+ to generate AND view.
  seo_fix:                3,
  redirect_map:            'operator',
  scrape_prospect_analyze: 'operator',
}

export interface AiCaller {
  user: { id: string; email?: string }
  tenantId: string | null
  tier: number   // 0 for operator path
}

// Hard separation (R3): operator identities cannot invoke tenant-tier features;
// tenant-admin identities cannot invoke operator features.
export async function requireAiCaller(
  req: Request,
  requestedTenantId: string | null,
  feature: AiFeature,
): Promise<AiCaller> {
  const required = FEATURE_TIER[feature]

  // ── operator features: JWT + UUID allowlist only (no tenant ownership / tier) ──
  if (required === 'operator') {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || ''
    const token = authHeader.replace(/^[Bb]earer\s+/, '').trim()
    if (!token) throw new AuthError(401, { error: 'Unauthorized' })
    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error } = await svc.auth.getUser(token)
    if (error || !user) throw new AuthError(401, { error: 'Unauthorized' })
    if (!(await isIronwoodOperator(svc, user.id))) {
      console.warn('[aiAuth] operator-feature denied — non-operator user:', user.email)
      throw new AuthError(403, { error: 'Forbidden' })
    }
    return { user: { id: user.id, email: user.email }, tenantId: requestedTenantId, tier: 0 }
  }

  // ── tenant features: identity + tenant ownership ──
  if (!requestedTenantId) throw new AuthError(400, { error: 'tenant_id required' })
  const { user, tenantId } = await requireTenantUser(req, requestedTenantId)

  // The service-role client is built HERE rather than just before the tier RPC
  // below, because the hard-separation check now reads public.operators and
  // needs it first. One client, two uses — the tenant path gains one indexed
  // lookup on a tiny table, on a path that already does an auth call and an RPC.
  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // hard separation: an operator identity may not invoke tenant features
  if (await isIronwoodOperator(svc, user.id)) {
    console.warn('[aiAuth] tenant-feature denied — operator identity:', user.email)
    throw new AuthError(403, { error: 'Forbidden' })
  }

  // S262 — tier check via the single authoritative RPC. No tier parsing on the
  // edge anymore: check_tenant_access(p_tenant_id, p_required_tier) reads
  // tenants.entitlement in the DB (the one place that can't desync across
  // runtimes/deploys). Fail-closed on RPC error OR a non-true result.
  const { data: allowed, error } = await svc.rpc('check_tenant_access', {
    p_tenant_id: tenantId,
    p_required_tier: required as number,
  })
  if (error || allowed !== true) {
    console.warn('[aiAuth] access denied tenant:', tenantId, 'feature:', feature, error ? `(rpc error: ${error.message})` : '')
    throw new AuthError(403, { error: 'Upgrade required' })
  }

  // tier value is no longer parsed on the edge; report the satisfied threshold.
  return { user, tenantId, tier: required as number }
}
