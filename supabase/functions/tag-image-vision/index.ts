// Edge Function: tag-image-vision — S242 §6.
// Vision-tags image_library rows. Three modes:
//   batch    {mode:'batch', limit?}        — nightly cron; claims pending rows
//   targeted {mode:'targeted', image_ids}  — on-demand (Session 2 UI) or cron
//   reap     {mode:'reap'}                  — flip stuck 'processing' → 'pending'
//
// Auth (verify_jwt:false):
//   - apikey header == TAG_IMAGE_VISION_INTERNAL_SECRET (cron / internal), OR
//   - user JWT via requireTenantUser (targeted on-demand; scopes to that tenant)
// Vision runs through ai-proxy /internal with a per-row signed envelope
// (purpose=image_tagging) — this fn NEVER calls api.anthropic.com directly.
//
// DEPLOY verify_jwt:false. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   TAG_IMAGE_VISION_INTERNAL_SECRET, INTERNAL_DELEGATION_SECRET.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'
import { getCorsHeaders } from '../_shared/cors.ts'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { buildEnvelope, signEnvelope } from '../_shared/delegationEnvelope.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const INTERNAL_SECRET = Deno.env.get('TAG_IMAGE_VISION_INTERNAL_SECRET') || ''
const DELEGATION_SECRET = Deno.env.get('INTERNAL_DELEGATION_SECRET') || ''
const AI_PROXY_INTERNAL_URL = `${SUPABASE_URL}/functions/v1/ai-proxy/internal`

const MAX_BATCH = 50
const MAX_TAGS = 8
const ROW_DELAY_MS = 200
const RETRY_CEILING = 3
const STALE_RETRY_MS = 4 * 60 * 60 * 1000   // re-attempt pending rows older than 4h

const TAG_PROMPT =
  'Tag this image for a home-services business social-media library. Return ONLY a JSON ' +
  'object: {"tags": [up to 8 short lowercase keyword tags]}. Tags describe the subject, ' +
  'setting, service relevance, and mood. No markdown, no prose, no backticks.'

interface ImgRow { id: string; tenant_id: string; bucket_id: string; storage_path: string; tag_retry_count: number }

function constantTimeEq(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a)
  const eb = new TextEncoder().encode(b)
  return ea.length === eb.length && timingSafeEqual(ea, eb)
}

function visionUrl(bucket: string, path: string): string {
  // Path is /render/image/public NOT /object/public — the latter ignores transform
  // params (verified 2026-05-27: /object returned 165KB raw + no x-transformations
  // header; /render returned 75KB). The render endpoint caps payload server-side,
  // well under Anthropic's image limit (design §6 / audit F4 / P0 bug).
  return `${SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${path}?width=800&resize=contain`
}

// Guarded atomic claim (supabase-js equivalent of FOR UPDATE SKIP LOCKED, per
// process-sms-queue): the WHERE state-guard + row lock means concurrent workers
// can't double-claim — the loser's UPDATE matches 0 rows.
async function claim(svc: SupabaseClient, id: string, mode: 'batch' | 'targeted'): Promise<boolean> {
  let q = svc.from('image_library')
    .update({ tag_status: 'processing', tag_last_attempted_at: new Date().toISOString() })
    .eq('id', id)
  q = mode === 'batch' ? q.eq('tag_status', 'pending') : q.or('tag_status.is.null,tag_status.in.(pending,failed)')
  const { data, error } = await q.select('id')
  if (error) { console.error('[tag-image-vision] claim error:', error.message); return false }
  return (data?.length ?? 0) > 0
}

async function recordFailure(svc: SupabaseClient, row: ImgRow, errMsg: string) {
  const next = row.tag_retry_count + 1
  await svc.from('image_library').update({
    tag_status: next < RETRY_CEILING ? 'pending' : 'failed',
    tag_retry_count: next,
    tag_last_error: errMsg.slice(0, 300),
    tag_last_attempted_at: new Date().toISOString(),
  }).eq('id', row.id)
}

async function processOne(svc: SupabaseClient, row: ImgRow, mode: 'batch' | 'targeted'): Promise<'tagged' | 'failed' | 'skipped'> {
  if (!(await claim(svc, row.id, mode))) return 'skipped'
  try {
    const env = buildEnvelope({
      purpose: 'image_tagging', caller: 'tag-image-vision',
      acting_tenant: row.tenant_id, acting_user: null,
      resource: { image_id: row.id }, ttl_seconds: 60,
    })
    const res = await fetch(AI_PROXY_INTERNAL_URL, {
      method: 'POST',
      headers: signEnvelope(env, DELEGATION_SECRET),
      body: JSON.stringify({
        max_tokens: 300,
        batch_cardinality: 1,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: visionUrl(row.bucket_id, row.storage_path) } },
            { type: 'text', text: TAG_PROMPT },
          ],
        }],
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      await recordFailure(svc, row, `ai-proxy ${res.status}: ${(body as { error?: { message?: string } })?.error?.message || ''}`)
      return 'failed'
    }
    const data = await res.json()
    const text: string = data?.content?.[0]?.text ?? ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    const tags: string[] = Array.isArray(parsed?.tags)
      ? parsed.tags.filter((t: unknown): t is string => typeof t === 'string').map((t: string) => t.toLowerCase().trim()).filter(Boolean).slice(0, MAX_TAGS)
      : []
    await svc.from('image_library').update({
      tags, tag_status: 'tagged', tagged_at: new Date().toISOString(), tag_last_error: null,
    }).eq('id', row.id)
    return 'tagged'
  } catch (e) {
    await recordFailure(svc, row, (e as Error)?.message || 'unknown')
    return 'failed'
  }
}

serve(async (req) => {
  const cors = getCorsHeaders(req)
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!INTERNAL_SECRET) {
    console.error('[tag-image-vision] TAG_IMAGE_VISION_INTERNAL_SECRET not set')
    return json(500, { error: 'Server misconfigured' })
  }

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json(400, { error: 'Invalid JSON' }) }
  const mode = body.mode

  // ── auth: internal apikey OR (targeted only) a tenant user JWT ──
  const apikeyOk = constantTimeEq(Deno.env.get('TAG_IMAGE_VISION_INTERNAL_SECRET') || '', req.headers.get('apikey') || '')
  let jwtTenant: string | null = null
  if (!apikeyOk) {
    if (mode !== 'targeted') return json(401, { error: 'Unauthorized' })
    const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id : ''
    try {
      const { tenantId: t } = await requireTenantUser(req, tenantId)
      jwtTenant = t
    } catch (e) {
      if (e instanceof AuthError) return json(e.status, e.body)
      return json(401, { error: 'Unauthorized' })
    }
  }

  try {
    if (mode === 'reap') {
      const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      const { data, error } = await svc.from('image_library')
        .update({ tag_status: 'pending', tag_last_error: 'reaped_from_processing' })
        .eq('tag_status', 'processing').lt('tag_last_attempted_at', cutoff).select('id')
      if (error) throw error
      return json(200, { mode, reaped: data?.length ?? 0 })
    }

    if (mode === 'batch') {
      const limit = Math.min(typeof body.limit === 'number' ? body.limit : MAX_BATCH, MAX_BATCH)
      const staleCutoff = new Date(Date.now() - STALE_RETRY_MS).toISOString()
      const { data: rows, error } = await svc.from('image_library')
        .select('id,tenant_id,bucket_id,storage_path,tag_retry_count')
        .eq('tag_status', 'pending')
        .or(`tag_last_attempted_at.is.null,tag_last_attempted_at.lt.${staleCutoff}`)
        .order('created_at', { ascending: true })
        .limit(limit)
      if (error) throw error
      const summary = { mode, claimed: rows?.length ?? 0, tagged: 0, failed: 0, skipped: 0 }
      for (const row of (rows ?? []) as ImgRow[]) {
        const r = await processOne(svc, row, 'batch')
        summary[r === 'tagged' ? 'tagged' : r === 'failed' ? 'failed' : 'skipped']++
        await new Promise((res) => setTimeout(res, ROW_DELAY_MS))
      }
      return json(200, summary)
    }

    if (mode === 'targeted') {
      const ids = Array.isArray(body.image_ids) ? body.image_ids.filter((x: unknown): x is string => typeof x === 'string') : []
      if (ids.length === 0) return json(400, { error: 'image_ids required' })
      if (ids.length > MAX_BATCH) return json(400, { error: `max ${MAX_BATCH} image_ids` })
      let sel = svc.from('image_library').select('id,tenant_id,bucket_id,storage_path,tag_retry_count').in('id', ids)
      if (jwtTenant) sel = sel.eq('tenant_id', jwtTenant)   // scope on-demand to caller's tenant
      const { data: rows, error } = await sel
      if (error) throw error
      const summary = { mode, claimed: rows?.length ?? 0, tagged: 0, failed: 0, skipped: 0 }
      for (const row of (rows ?? []) as ImgRow[]) {
        const r = await processOne(svc, row, 'targeted')
        summary[r === 'tagged' ? 'tagged' : r === 'failed' ? 'failed' : 'skipped']++
        await new Promise((res) => setTimeout(res, ROW_DELAY_MS))
      }
      return json(200, summary)
    }

    return json(400, { error: 'Unknown mode' })
  } catch (e) {
    console.error('[tag-image-vision] error:', (e as Error)?.message)
    return json(500, { error: 'Internal error' })
  }
})
