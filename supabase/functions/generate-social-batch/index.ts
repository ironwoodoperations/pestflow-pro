// Edge Function: generate-social-batch — S242 §8.
// Public submission endpoint for AI campaigns. Authenticates the tenant user,
// re-verifies Pro tier, validates the request, writes the social_campaigns
// row (status='pending_generation') + a queued campaign_jobs row, and returns
// 202 + job_id. Fast (<500ms): no LLM calls, no social_posts writes — the
// campaign_jobs INSERT trigger hands off to process-campaign-job.
//
// DEPLOY verify_jwt:true. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const PRO_TIER = 3
const MAX_POSTS = 60
const STRATEGIES = new Set(['none', 'folder', 'ai_vision', 'fixed'])

serve(async (req) => {
  const cors = getCorsHeaders(req)
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json(400, { error: 'Invalid JSON' }) }

  const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id : ''
  if (!tenantId) return json(400, { error: 'tenant_id required' })

  // identity + tenant ownership (verify_jwt:true already validated the JWT signature)
  let user: { id: string }
  try {
    const r = await requireTenantUser(req, tenantId)
    user = r.user as { id: string }
  } catch (e) {
    if (e instanceof AuthError) return json(e.status, e.body)
    return json(401, { error: 'Unauthorized' })
  }

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Pro gate (re-checked server-side; the worker + ai-proxy re-check again) —
  // S262: via the single authoritative RPC (tenants.entitlement), fail-closed.
  const { data: allowed, error: gateErr } = await svc.rpc('check_tenant_access', { p_tenant_id: tenantId, p_required_tier: PRO_TIER })
  if (gateErr || allowed !== true) return json(403, { error: 'AI Campaigns require the Pro plan.' })

  // ── validate request ──
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'AI Campaign'
  const goal = typeof body.goal === 'string' ? body.goal : null
  const tone = typeof body.tone === 'string' ? body.tone : null
  const durationDays = Number.isInteger(body.duration_days) ? body.duration_days as number : 7
  const startDate = typeof body.start_date === 'string' ? body.start_date : null
  const platforms = Array.isArray(body.platforms) ? body.platforms.filter((p: unknown): p is string => typeof p === 'string') : []
  if (platforms.length === 0) return json(400, { error: 'At least one platform is required.' })

  const postsRequested = body.posts_requested
  if (!Number.isInteger(postsRequested) || (postsRequested as number) < 1 || (postsRequested as number) > MAX_POSTS) {
    return json(400, { error: `posts_requested must be an integer 1..${MAX_POSTS}.` })
  }

  const strategy = typeof body.image_strategy === 'string' ? body.image_strategy : 'none'
  if (!STRATEGIES.has(strategy)) return json(400, { error: 'Unknown image_strategy.' })
  let folder: string | null = null
  let imageId: string | null = null

  if (strategy === 'folder') {
    folder = typeof body.image_strategy_folder === 'string' && body.image_strategy_folder ? body.image_strategy_folder : null
    if (!folder) return json(400, { error: 'image_strategy_folder is required for the folder strategy.' })
  } else if (strategy === 'fixed') {
    imageId = typeof body.image_strategy_image_id === 'string' ? body.image_strategy_image_id : null
    if (!imageId) return json(400, { error: 'image_strategy_image_id is required for the fixed strategy.' })
    // ownership: the image must belong to this tenant and be live
    const { data: img } = await svc.from('image_library').select('id').eq('id', imageId).eq('tenant_id', tenantId).is('deleted_at', null).maybeSingle()
    if (!img) return json(400, { error: 'Selected image not found in your library.' })
  }

  // ── persist campaign + queue job ──
  const { data: camp, error: campErr } = await svc.from('social_campaigns').insert({
    tenant_id: tenantId, title, goal, tone, duration_days: durationDays, platforms,
    start_date: startDate, status: 'pending_generation',
    image_strategy: strategy, image_strategy_folder: folder, image_strategy_image_id: imageId,
  }).select('id').single()
  if (campErr || !camp) { console.error('[generate-social-batch] campaign insert:', campErr?.message); return json(500, { error: 'Could not create campaign.' }) }

  const { data: job, error: jobErr } = await svc.from('campaign_jobs').insert({
    tenant_id: tenantId, user_id: user.id, campaign_id: camp.id, status: 'queued',
    posts_requested: postsRequested, request_body: body,
  }).select('id').single()
  if (jobErr || !job) {
    console.error('[generate-social-batch] job insert:', jobErr?.message)
    // roll back the orphan campaign so a retry is clean
    await svc.from('social_campaigns').delete().eq('id', camp.id).eq('tenant_id', tenantId)
    return json(500, { error: 'Could not queue generation.' })
  }

  // 202: the campaign_jobs INSERT trigger has dispatched process-campaign-job.
  return json(202, { job_id: job.id, campaign_id: camp.id })
})
