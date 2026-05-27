// S243 — AI proxy auth/feature gating.
// Sibling to _shared/auth/requireTenantUser.ts (which is protected — we import
// from it read-only rather than editing it). This module owns the AiFeature
// union, the feature→tier map, the Ironwood operator allowlist, and the
// per-feature caller gate used by the ai-proxy edge function.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from './auth/requireTenantUser.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// R3: identity is email; AUTHORIZATION is UUID. Operator allowlist by user.id.
const IRONWOOD_OPERATOR_USER_IDS = new Set<string>([
  '5181b30a-265f-4a70-a323-bf6e3c53641b', // admin@pestflowpro.com (operator)
])

export type AiFeature =
  | 'content_page' | 'composer_captions' | 'composer_schedule'
  | 'content_queue_schedule' | 'seo_metadata' | 'blog_draft'
  | 'blog_seo' | 'seo_keywords' | 'campaign_generation' | 'redirect_map'

// feature → minimum tenant tier. 'operator' = Ironwood-ops only (no tenant tier).
export const FEATURE_TIER: Record<AiFeature, number | 'operator'> = {
  content_page:           1,
  composer_captions:      1,
  composer_schedule:      2,
  content_queue_schedule: 1,
  seo_metadata:           2,
  blog_draft:             2,
  blog_seo:               2,
  seo_keywords:           3,
  campaign_generation:    3,
  redirect_map:           'operator',
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
    if (!IRONWOOD_OPERATOR_USER_IDS.has(user.id)) {
      console.warn('[aiAuth] operator-feature denied — non-operator user:', user.email)
      throw new AuthError(403, { error: 'Forbidden' })
    }
    return { user: { id: user.id, email: user.email }, tenantId: requestedTenantId, tier: 0 }
  }

  // ── tenant features: identity + tenant ownership ──
  if (!requestedTenantId) throw new AuthError(400, { error: 'tenant_id required' })
  const { user, tenantId } = await requireTenantUser(req, requestedTenantId)

  // hard separation: an operator identity may not invoke tenant features
  if (IRONWOOD_OPERATOR_USER_IDS.has(user.id)) {
    console.warn('[aiAuth] tenant-feature denied — operator identity:', user.email)
    throw new AuthError(403, { error: 'Forbidden' })
  }

  // tier check, fail-closed (W4): missing/malformed subscription → 403, never default-to-1
  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await svc
    .from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'subscription').maybeSingle()
  const tier = (data?.value as { tier?: unknown } | null)?.tier
  if (error || typeof tier !== 'number') {
    console.warn('[aiAuth] subscription missing/malformed for tenant:', tenantId)
    throw new AuthError(403, { error: 'Subscription not configured' })
  }
  if (tier < (required as number)) {
    throw new AuthError(403, { error: 'Upgrade required' })
  }

  return { user, tenantId, tier }
}
