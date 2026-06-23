// Edge function: post-to-social v38
// Posts content to social media via Zernio (zernio.com) API.
// Gate: requireTenantAdmin — caller must be admin of the requesting tenant.
//
// CHANGE LOG v37 → v38 (S218 final fix):
//   v37's DB-fallback resolution worked (proven by Zernio presign error in logs
//   for postId queried row). But the presign body used fileName/fileType from
//   Zernio's docs, which their API rejects with:
//     {"error":"Missing required fields: filename and contentType"}
//   Their actual API wants filename (lowercase) and contentType (not fileType).
//   v38 sends BOTH naming conventions so the call works regardless of which
//   one Zernio accepts now or in the future.
//
// DEPLOY:
//   supabase functions deploy post-to-social --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantAdmin, AuthError } from '../_shared/auth/requireTenantUser.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostBody {
  content: string
  platforms: string[]
  scheduledFor?: string
  tenantId: string
  postId?: string
  mediaUrl?: string
  imageUrl?: string
  image_url?: string
  mediaType?: string        // S250: 'image' | 'video' — drives Zernio mediaItems[].type
}

const TO_ZERNIO: Record<string, string> = {
  facebook:        'facebook',
  instagram:       'instagram',
  youtube:         'youtube',
  linkedin:        'linkedin',
  tiktok:          'tiktok',
  google_business: 'googlebusiness',
}

// ============================================================
// Zernio media-upload helper
// ============================================================
function inferContentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'png':  return 'image/png'
    case 'gif':  return 'image/gif'
    case 'webp': return 'image/webp'
    case 'mp4':  return 'video/mp4'
    case 'mov':  return 'video/quicktime'
    default:     return 'image/jpeg'
  }
}

async function uploadImageToZernio(imageUrl: string, zernioApiKey: string): Promise<string> {
  const fetchRes = await fetch(imageUrl)
  if (!fetchRes.ok) {
    throw new Error(`Image fetch from source failed (HTTP ${fetchRes.status}): ${imageUrl}`)
  }
  const bytes = await fetchRes.arrayBuffer()

  const urlPath = new URL(imageUrl).pathname
  const fileName = urlPath.split('/').pop() || `pfp-${Date.now()}.jpg`
  const contentType = fetchRes.headers.get('content-type') || inferContentType(fileName)

  // v38: send BOTH camelCase (docs) and lowercase (actual API error) field names.
  // Zernio API ignores unknown fields, so this is safe.
  const presignRes = await fetch('https://zernio.com/api/v1/media/presign', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${zernioApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: fileName,
      contentType: contentType,
      fileName: fileName,
      fileType: contentType,
    }),
  })
  if (!presignRes.ok) {
    const errBody = await presignRes.text()
    throw new Error(`Zernio presign failed (HTTP ${presignRes.status}): ${errBody}`)
  }
  const presignData = await presignRes.json()
  const { uploadUrl, publicUrl } = presignData
  if (!uploadUrl || !publicUrl) {
    throw new Error(`Zernio presign malformed: ${JSON.stringify(presignData)}`)
  }

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: bytes,
  })
  if (!putRes.ok) {
    const errBody = await putRes.text()
    throw new Error(`Zernio upload PUT failed (HTTP ${putRes.status}): ${errBody}`)
  }

  return publicUrl
}
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl    = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const zernioApiKey   = Deno.env.get('ZERNIO_API_KEY') ?? ''

  if (!zernioApiKey) {
    return new Response(
      JSON.stringify({ error: 'Social posting not configured — contact your account manager.' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let body: PostBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { content, platforms, scheduledFor, tenantId, postId } = body

  if (!content || !platforms?.length || !tenantId) {
    return new Response(JSON.stringify({ error: 'content, platforms, and tenantId are required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    await requireTenantAdmin(req, tenantId)
  } catch (e) {
    if (e instanceof AuthError) return e.toResponse()
    throw e
  }

  // S273 confused-deputy closure: requireTenantAdmin validated `tenantId`, so EVERY
  // social_posts read/write below is double-scoped by id AND tenant_id. Without the
  // tenant predicate a validated admin of tenant A could pass a postId owned by
  // tenant B and read its media or flip its status — the auth check
  // alone does not bind the row to the caller's tenant.

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Resolve media URL from body OR fall back to DB row (v37 logic, unchanged in v38).
  // S250: also resolve media_type (kind) — body.mediaType wins, else the DB row's
  // media_type; null/absent -> treated as 'image' downstream for backward compat.
  let effectiveMediaUrl: string | undefined =
    body.mediaUrl || body.imageUrl || body.image_url || undefined
  let effectiveMediaType: string | undefined = body.mediaType

  if (postId && (!effectiveMediaUrl || !effectiveMediaType)) {
    const { data: postRow } = await supabase
      .from('social_posts')
      .select('image_url, media_type')
      .eq('id', postId).eq('tenant_id', tenantId)
      .maybeSingle()
    if (!effectiveMediaUrl && postRow?.image_url) {
      effectiveMediaUrl = postRow.image_url
      console.log(`[post-to-social] media URL resolved from DB for postId=${postId}:`, effectiveMediaUrl)
    }
    if (!effectiveMediaType && postRow?.media_type) {
      effectiveMediaType = postRow.media_type
    }
  }

  // S262 — access via the single authoritative RPC (tenants.entitlement), fail-closed.
  // Scheduling requires Growth (tier ≥ 2); the daily 2-post cap applies to Growth
  // only (Pro+ unlimited). No settings.subscription read, no numeric tier parsing.
  const [intgRes, gateRes, proRes] = await Promise.all([
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
    supabase.rpc('check_tenant_access', { p_tenant_id: tenantId, p_required_tier: 2 }),
    supabase.rpc('check_tenant_access', { p_tenant_id: tenantId, p_required_tier: 3 }),
  ])

  if (gateRes.error || gateRes.data !== true) {
    return new Response(
      JSON.stringify({ error: 'Scheduling not available on Starter plan. Upgrade to Growth to enable social scheduling.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const zernioAccounts: Record<string, string> = intgRes.data?.value?.zernio_accounts ?? {}

  if (proRes.data !== true) {   // Growth — daily 2-post hard cap (Pro+ unlimited)
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('social_posts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('scheduled_for', `${today}T00:00:00`)
      .lte('scheduled_for', `${today}T23:59:59`)
      .in('status', ['scheduled', 'published'])

    if ((count ?? 0) >= 2) {
      return new Response(
        JSON.stringify({ error: "You've reached today's 2-post scheduling limit. Upgrade to Pro for unlimited scheduling." }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  const zernioPlatforms: { platform: string; accountId: string }[] = []
  const missingPlatforms: string[] = []

  for (const frontendKey of platforms) {
    const zernioKey = TO_ZERNIO[frontendKey] ?? frontendKey
    const accountId = zernioAccounts[zernioKey]
    if (!accountId) {
      missingPlatforms.push(frontendKey)
    } else {
      zernioPlatforms.push({ platform: zernioKey, accountId })
    }
  }

  if (zernioPlatforms.length === 0) {
    const errMsg = `No connected accounts for: ${missingPlatforms.join(', ')}. Go to Social → Connections to connect your accounts.`
    if (postId) {
      await supabase.from('social_posts').update({ status: 'failed', error_msg: errMsg }).eq('id', postId).eq('tenant_id', tenantId)
    }
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const zernioBody: Record<string, unknown> = {
    content,
    platforms: zernioPlatforms,
  }
  if (scheduledFor) {
    zernioBody.scheduledFor = scheduledFor
    zernioBody.timezone = 'America/Chicago'
  } else {
    zernioBody.publishNow = true
  }

  if (effectiveMediaUrl) {
    try {
      const zernioPublicUrl = await uploadImageToZernio(effectiveMediaUrl, zernioApiKey)
      // S250: derive Zernio media kind from media_type (null/absent -> 'image').
      const mediaItemType = effectiveMediaType === 'video' ? 'video' : 'image'
      zernioBody.mediaItems = [{ type: mediaItemType, url: zernioPublicUrl }]
      console.log('[post-to-social] Zernio media uploaded:', zernioPublicUrl, 'type:', mediaItemType)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image upload failed'
      console.error('[post-to-social] Zernio media upload error:', msg)
      if (postId) {
        await supabase.from('social_posts').update({
          status: 'failed',
          error_msg: `Image upload to Zernio failed: ${msg}`,
        }).eq('id', postId).eq('tenant_id', tenantId)
      }
      return new Response(JSON.stringify({ error: `Image upload failed: ${msg}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  console.log('[post-to-social] Zernio request:', JSON.stringify(zernioBody))

  try {
    const res = await fetch('https://zernio.com/api/v1/posts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${zernioApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(zernioBody),
    })

    const data = await res.json()
    console.log('[post-to-social] Zernio response:', JSON.stringify(data))

    if (!res.ok) {
      const errMsg = data?.error || data?.message || `Zernio error: ${res.status}`
      console.error('[post-to-social] Zernio API error:', errMsg)
      if (postId) {
        await supabase.from('social_posts').update({ status: 'failed', error_msg: errMsg }).eq('id', postId).eq('tenant_id', tenantId)
      }
      return new Response(JSON.stringify({ error: errMsg }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const zernioPostId: string = data?.post?._id ?? 'zernio-social'
    const platform = platforms.length > 1 ? 'both' : (platforms[0] as 'facebook' | 'instagram' | 'both')
    const newStatus = scheduledFor ? 'scheduled' : 'published'

    const postUpdate: Record<string, unknown> = {
      status: newStatus,
      scheduled_for: scheduledFor || null,
      published_at: scheduledFor ? null : new Date().toISOString(),
      fb_post_id: zernioPostId,
      zernio_post_id: zernioPostId,
      error_msg: null,
    }
    if (missingPlatforms.length > 0) {
      postUpdate.error_msg = `Not connected: ${missingPlatforms.join(', ')}`
    }

    if (postId) {
      await supabase.from('social_posts').update(postUpdate).eq('id', postId).eq('tenant_id', tenantId)
    } else {
      await supabase.from('social_posts').insert({
        tenant_id: tenantId,
        platform,
        caption: content,
        ...postUpdate,
      })
    }

    return new Response(
      JSON.stringify({ success: true, postId: zernioPostId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    console.error('[post-to-social] unexpected error:', msg)
    if (postId) {
      await supabase.from('social_posts').update({ status: 'failed', error_msg: msg }).eq('id', postId).eq('tenant_id', tenantId)
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
