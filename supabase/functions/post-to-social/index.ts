// Edge function: post-to-social
// Posts content to social media via Zernio (zernio.com) API.
// JWT: OFF — called from client admin dashboard
// DEPLOY:
//   supabase functions deploy post-to-social --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostBody {
  content: string
  platforms: string[]       // frontend platform keys: 'facebook' | 'instagram' | 'google_business' | etc.
  scheduledFor?: string     // ISO 8601
  tenantId: string
  postId?: string           // existing social_posts row to update
  mediaUrl?: string
}

// Frontend platform key → Zernio platform string
const TO_ZERNIO: Record<string, string> = {
  facebook:        'facebook',
  instagram:       'instagram',
  youtube:         'youtube',
  linkedin:        'linkedin',
  tiktok:          'tiktok',
  google_business: 'googlebusiness',
}

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

  const { content, platforms, scheduledFor, tenantId, postId, mediaUrl } = body

  if (!content || !platforms?.length || !tenantId) {
    return new Response(JSON.stringify({ error: 'content, platforms, and tenantId are required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Read tenant settings (subscription + integrations) in parallel
  const [subRes, intgRes] = await Promise.all([
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'subscription').maybeSingle(),
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
  ])

  const tier: number = subRes.data?.value?.tier ?? 1

  // Tier 1 (Starter): no scheduling
  if (tier === 1) {
    return new Response(
      JSON.stringify({ error: 'Scheduling not available on Starter plan. Upgrade to Grow to enable social scheduling.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // zernio_accounts keyed by Zernio's platform strings (e.g. { facebook: 'acc_xxx', googlebusiness: 'acc_yyy' })
  const zernioAccounts: Record<string, string> = intgRes.data?.value?.zernio_accounts ?? {}

  // Tier 2 (Grow): hard cap of 2 posts/day
  if (tier === 2) {
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

  // Build Zernio platforms array — only include platforms that have a connected account
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
      await supabase.from('social_posts').update({ status: 'failed', error_msg: errMsg }).eq('id', postId)
    }
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Build Zernio post body
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
  if (mediaUrl) {
    zernioBody.mediaItems = [{ type: 'image', url: mediaUrl }]
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
        await supabase.from('social_posts').update({ status: 'failed', error_msg: errMsg }).eq('id', postId)
      }
      return new Response(JSON.stringify({ error: errMsg }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Success
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
    // Note partial failures if any platforms were skipped
    if (missingPlatforms.length > 0) {
      postUpdate.error_msg = `Not connected: ${missingPlatforms.join(', ')}`
    }

    if (postId) {
      await supabase.from('social_posts').update(postUpdate).eq('id', postId)
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
      await supabase.from('social_posts').update({ status: 'failed', error_msg: msg }).eq('id', postId)
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
