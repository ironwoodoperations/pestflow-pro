// Edge Function: process-campaign-job — S242 §8.
// Async worker for campaign_jobs. Fired by the campaign_jobs INSERT trigger
// (pg_net) with the internal apikey. Claims a queued job, generates captions
// via ai-proxy /internal (signed envelope), runs the image strategy (§7),
// atomically inserts social_posts, and finalizes the job.
//
// Auth (verify_jwt:false): apikey header == PROCESS_CAMPAIGN_JOB_INTERNAL_SECRET.
// NEVER calls api.anthropic.com directly — only ai-proxy /internal via envelope.
//
// DEPLOY verify_jwt:false. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   PROCESS_CAMPAIGN_JOB_INTERNAL_SECRET, INTERNAL_DELEGATION_SECRET.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'
import { buildEnvelope, signEnvelope } from '../_shared/delegationEnvelope.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const INTERNAL_SECRET = Deno.env.get('PROCESS_CAMPAIGN_JOB_INTERNAL_SECRET') || ''
const DELEGATION_SECRET = Deno.env.get('INTERNAL_DELEGATION_SECRET') || ''
const AI_PROXY_INTERNAL_URL = `${SUPABASE_URL}/functions/v1/ai-proxy/internal`

const PRO_TIER = 3
const CANDIDATE_CAP = 100        // reverse-selection candidate ceiling (§7)
const DAILY_POST_QUOTA = 200     // per-tenant output cardinality cap (§12)

interface Job {
  id: string; tenant_id: string; user_id: string; campaign_id: string | null
  posts_requested: number; request_body: Record<string, unknown>
}
interface Campaign {
  id: string; title: string; goal: string | null; tone: string | null
  duration_days: number | null; platforms: string[] | null; start_date: string | null
  image_strategy: string; image_strategy_folder: string | null; image_strategy_image_id: string | null
}

function constantTimeEq(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a); const eb = new TextEncoder().encode(b)
  return ea.length === eb.length && timingSafeEqual(ea, eb)
}
// Stored as the post's image_url (published + shown full-size). Intentionally
// /object/public — uploads are already resized at intake (useImageLibrary). Do
// NOT switch to /render — that transform endpoint is only for the vision payload.
const publicUrl = (bucket: string, path: string) => `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
const stripJson = (t: string) => t.replace(/```json|```/g, '').trim()

async function proxyCall(env: ReturnType<typeof buildEnvelope>, payload: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(AI_PROXY_INTERNAL_URL, {
    method: 'POST', headers: signEnvelope(env, DELEGATION_SECRET), body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const status = res.status
    const msg = (body as { error?: { message?: string } })?.error?.message || ''
    throw new Error(status === 429 ? 'rate_limited' : `proxy_${status}:${msg}`.slice(0, 200))
  }
  const data = await res.json()
  return data?.content?.[0]?.text ?? ''
}

serve(async (req) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })
  if (!INTERNAL_SECRET) { console.error('[process-campaign-job] secret not set'); return json(500, { error: 'Server misconfigured' }) }
  if (!constantTimeEq(INTERNAL_SECRET, req.headers.get('apikey') || '')) return json(401, { error: 'Unauthorized' })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json(400, { error: 'Invalid JSON' }) }
  const jobId = typeof body.job_id === 'string' ? body.job_id : ''
  if (!jobId) return json(400, { error: 'job_id required' })

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // ── claim (atomic): queued → processing. 0 rows ⇒ already taken (idempotent) ──
  const { data: claimed, error: claimErr } = await svc.from('campaign_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', jobId).eq('status', 'queued')
    .select('id,tenant_id,user_id,campaign_id,posts_requested,request_body')
  if (claimErr) { console.error('[process-campaign-job] claim error:', claimErr.message); return json(500, { error: 'claim failed' }) }
  if (!claimed || claimed.length === 0) return json(200, { ok: true, note: 'already claimed or not queued' })
  const job = claimed[0] as Job

  const fail = async (lastError: string) => {
    await svc.from('campaign_jobs').update({ status: 'failed', last_error: lastError, completed_at: new Date().toISOString() }).eq('id', job.id)
    return json(200, { ok: false, job_id: job.id, last_error: lastError })
  }

  try {
    // campaign row (authoritative for strategy + gen params); tenant predicate = defense-in-depth
    if (!job.campaign_id) return await fail('missing_campaign')
    const { data: campRow, error: campErr } = await svc.from('social_campaigns')
      .select('id,title,goal,tone,duration_days,platforms,start_date,image_strategy,image_strategy_folder,image_strategy_image_id')
      .eq('id', job.campaign_id).eq('tenant_id', job.tenant_id).maybeSingle()
    if (campErr || !campRow) return await fail('campaign_not_found')
    const campaign = campRow as Campaign

    // tier re-check at execution time (§4 subscription_lapsed) — S262: via the
    // single authoritative RPC (tenants.entitlement), not settings.subscription.
    const { data: allowed, error: gateErr } = await svc.rpc('check_tenant_access', { p_tenant_id: job.tenant_id, p_required_tier: PRO_TIER })
    if (gateErr || allowed !== true) return await fail('subscription_lapsed')

    // daily output-cardinality quota (§12): sum batch_cardinality logged for this tenant today
    const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0)
    const { data: todayRows } = await svc.from('ai_proxy_log')
      .select('batch_cardinality').eq('tenant_id', job.tenant_id).eq('purpose', 'generate_social_batch')
      .gte('created_at', dayStart.toISOString())
    const usedToday = (todayRows ?? []).reduce((s: number, r: { batch_cardinality: number | null }) => s + (r.batch_cardinality ?? 0), 0)
    if (usedToday + job.posts_requested > DAILY_POST_QUOTA) return await fail('daily_quota_exceeded')

    const { data: bizRow } = await svc.from('settings').select('value').eq('tenant_id', job.tenant_id).eq('key', 'business_info').maybeSingle()
    const biz = (bizRow?.value as Record<string, unknown> | null) || {}
    const platforms = (campaign.platforms && campaign.platforms.length > 0) ? campaign.platforms : ['facebook']
    const n = job.posts_requested

    // ── caption generation via ai-proxy /internal ──
    const genEnv = buildEnvelope({
      purpose: 'generate_social_batch', caller: 'process-campaign-job',
      acting_tenant: job.tenant_id, acting_user: job.user_id,
      resource: { campaign_id: campaign.id, max_posts: n }, ttl_seconds: 300,
    })
    const genPrompt =
      `Business: ${biz.name ?? ''} (${biz.industry ?? 'home services'})${biz.address ? `, ${biz.address}` : ''}.\n` +
      `Campaign goal: ${campaign.goal ?? campaign.title}. Tone: ${campaign.tone ?? 'friendly'}.\n` +
      `Platforms: ${platforms.join(', ')}.\n` +
      `Write exactly ${n} distinct social posts. Return ONLY a JSON array of ${n} objects, ` +
      `no markdown: [{"platform":"<one of ${platforms.join('|')}>","caption":"<text incl. hashtags>"}]`
    let captions: { platform: string; caption: string }[]
    try {
      const text = (await proxyCall(genEnv, {
        max_tokens: 4096, batch_cardinality: n,
        system: 'You are a social media copywriter for local home-services businesses.',
        messages: [{ role: 'user', content: genPrompt }],
      })) as string
      const parsed = JSON.parse(stripJson(text))
      captions = (Array.isArray(parsed) ? parsed : [])
        .filter((p: unknown): p is { platform?: string; caption?: string } => !!p && typeof (p as { caption?: unknown }).caption === 'string')
        .slice(0, n)
        .map((p) => ({ platform: platforms.includes(p.platform || '') ? p.platform! : platforms[0], caption: p.caption! }))
    } catch (e) {
      return await fail((e as Error)?.message === 'rate_limited' ? 'rate_limited' : 'caption_generation_failed')
    }
    if (captions.length === 0) return await fail('caption_generation_empty')

    // ── image strategy (§7) ──
    let images: (string | null)[] = captions.map(() => null)
    let lastError: string | null = null

    if (campaign.image_strategy === 'fixed') {
      const { data: img } = await svc.from('image_library').select('bucket_id,storage_path')
        .eq('id', campaign.image_strategy_image_id).eq('tenant_id', job.tenant_id).is('deleted_at', null).maybeSingle()
      if (img) images = captions.map(() => publicUrl(img.bucket_id, img.storage_path))
      else lastError = 'fixed_image_unavailable'

    } else if (campaign.image_strategy === 'folder') {
      const { data: pool } = await svc.from('image_library').select('bucket_id,storage_path')
        .eq('tenant_id', job.tenant_id).eq('folder', campaign.image_strategy_folder)
        .is('deleted_at', null).neq('tag_status', 'failed')
      if (pool && pool.length > 0) {
        images = captions.map(() => { const p = pool[Math.floor(Math.random() * pool.length)]; return publicUrl(p.bucket_id, p.storage_path) })
      } else lastError = 'folder_empty'

    } else if (campaign.image_strategy === 'ai_vision') {
      const { data: cands } = await svc.from('image_library').select('id,bucket_id,storage_path,original_filename,tags')
        .eq('tenant_id', job.tenant_id).eq('tag_status', 'tagged').is('deleted_at', null)
        .order('created_at', { ascending: false }).limit(CANDIDATE_CAP)
      if (cands && cands.length > 0) {
        const byId = new Map(cands.map((c) => [c.id, c]))
        try {
          const selEnv = buildEnvelope({
            purpose: 'reverse_selection', caller: 'process-campaign-job',
            acting_tenant: job.tenant_id, acting_user: job.user_id,
            resource: { campaign_id: campaign.id }, ttl_seconds: 300,
          })
          const selText = (await proxyCall(selEnv, {
            max_tokens: 1024, batch_cardinality: cands.length,
            system: 'You match library images to social captions. Return JSON only.',
            messages: [{
              role: 'user',
              content:
                'For each caption pick the best-matching image id, or null if none fits. ' +
                'Return ONLY JSON: [{"post_index":0,"image_id":"<uuid|null>"}].\n\n' +
                `Candidates: ${JSON.stringify(cands.map((c) => ({ id: c.id, filename: c.original_filename, tags: c.tags })))}\n\n` +
                `Captions: ${JSON.stringify(captions.map((c, i) => ({ post_index: i, caption: c.caption })))}`,
            }],
          })) as string
          const picks = JSON.parse(stripJson(selText)) as { post_index: number; image_id: string | null }[]
          for (const pick of (Array.isArray(picks) ? picks : [])) {
            if (pick.image_id && byId.has(pick.image_id) && pick.post_index >= 0 && pick.post_index < images.length) {
              const c = byId.get(pick.image_id)!   // membership in byId = tenant-owned (defense-in-depth §7)
              images[pick.post_index] = publicUrl(c.bucket_id, c.storage_path)
            }
          }
        } catch {
          lastError = 'reverse_selection_failed'   // captions still proceed, no images
        }
      } else lastError = 'no_tagged_candidates'
    }

    // ── atomic insert (single batched INSERT statement = one transaction) ──
    const base = campaign.start_date ? new Date(campaign.start_date) : new Date()
    const span = campaign.duration_days && campaign.duration_days > 0 ? campaign.duration_days : 7
    const rows = captions.map((c, i) => {
      const when = new Date(base); when.setUTCDate(base.getUTCDate() + Math.floor((i * span) / captions.length)); when.setUTCHours(15, 0, 0, 0)
      return {
        tenant_id: job.tenant_id, platform: c.platform, caption: c.caption,
        image_url: images[i], campaign_id: campaign.id, ai_generated: true,
        campaign_title: campaign.title, status: 'draft', scheduled_for: when.toISOString(),
      }
    })
    const { error: insErr } = await svc.from('social_posts').insert(rows)
    if (insErr) { console.error('[process-campaign-job] post insert error:', insErr.message); return await fail('post_insert_failed') }

    const postsWithImages = images.filter((u) => !!u).length
    await svc.from('campaign_jobs').update({
      status: 'completed', posts_created: rows.length, posts_with_images: postsWithImages,
      last_error: lastError, completed_at: new Date().toISOString(),
    }).eq('id', job.id)
    await svc.from('social_campaigns').update({ status: 'active' }).eq('id', campaign.id).eq('tenant_id', job.tenant_id)

    console.log(`[process-campaign-job] job:${job.id} tenant:${job.tenant_id} posts:${rows.length} with_images:${postsWithImages} strategy:${campaign.image_strategy}`)
    return json(200, { ok: true, job_id: job.id, posts_created: rows.length, posts_with_images: postsWithImages })

  } catch (e) {
    console.error('[process-campaign-job] unexpected:', (e as Error)?.message)
    return await fail('worker_error')
  }
})
