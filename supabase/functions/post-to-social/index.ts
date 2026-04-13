// Edge function: post-to-social
// Posts content to social media via Late (getlate.dev) API.
// JWT: true (requires auth token)
// DEPLOY:
//   supabase functions deploy post-to-social --project-ref biezzykcgzkrwdgqpsar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostBody {
  content: string
  platforms: string[]
  scheduledFor?: string
  tenantId: string
  postId?: string  // existing social_posts row to update (created by frontend)
  mediaUrl?: string
}

// Map frontend platform names to Late API platform keys
const PLATFORM_MAP: Record<string, string> = {
  facebook: 'facebook',
  instagram: 'instagram',
  youtube: 'youtube',
  linkedin: 'linkedin',
  google: 'google_business',
  tiktok: 'tiktok',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const lateApiKey = Deno.env.get('LATE_API_KEY') ?? ''

  if (!lateApiKey) {
    return new Response(
      JSON.stringify({ error: 'Social posting not configured — LATE_API_KEY missing. Contact your account manager.' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let body: PostBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { content, platforms, scheduledFor, tenantId, postId, mediaUrl } = body

  if (!content || !platforms?.length || !tenantId) {
    return new Response(JSON.stringify({ error: 'content, platforms, and tenantId are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Read tenant settings (subscription + integrations) in parallel
  const [subRes, intgRes] = await Promise.all([
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'subscription').maybeSingle(),
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
  ])

  const tier: number = subRes.data?.value?.tier ?? 1

  // Tier 1 (Starter): no scheduling allowed
  if (tier === 1) {
    return new Response(
      JSON.stringify({ error: 'Scheduling not available on Starter plan. Upgrade to Grow to enable social scheduling.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Late account IDs stored in settings.integrations.late_accounts as { facebook: 'acc_xxx', ... }
  const lateAccounts: Record<string, string> = intgRes.data?.value?.late_accounts ?? {}

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

  // Post to each requested platform via Late API
  const results: { platform: string; ok: boolean; latePostId?: string; error?: string }[] = []

  for (const platform of platforms) {
    const accountId = lateAccounts[platform]

    if (!accountId) {
      results.push({ platform, ok: false, error: `No Late account connected for ${platform}` })
      continue
    }

    const lateBody: Record<string, unknown> = {
      accountId,
      platforms: [PLATFORM_MAP[platform] ?? platform],
      content,
    }
    if (scheduledFor) lateBody.scheduledFor = scheduledFor
    if (mediaUrl) lateBody.mediaUrls = [mediaUrl]

    console.log(`[post-to-social] Late API request for ${platform}:`, JSON.stringify(lateBody))

    try {
      const lateRes = await fetch('https://api.getlate.dev/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lateApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lateBody),
      })

      const lateData = await lateRes.json()
      console.log(`[post-to-social] Late API response for ${platform}:`, JSON.stringify(lateData))

      if (!lateRes.ok) {
        const errMsg = lateData?.error || lateData?.message || `Late API error: ${lateRes.status}`
        results.push({ platform, ok: false, error: errMsg })
      } else {
        results.push({ platform, ok: true, latePostId: lateData?.id })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      console.error(`[post-to-social] Late API network error for ${platform}:`, msg)
      results.push({ platform, ok: false, error: msg })
    }
  }

  const anyOk = results.some(r => r.ok)
  const allFailed = results.every(r => !r.ok)

  // Determine overall error message (if all failed)
  if (allFailed) {
    const errMsg = results.map(r => `${r.platform}: ${r.error}`).join('; ')
    console.error('[post-to-social] all platforms failed:', errMsg)

    if (postId) {
      await supabase.from('social_posts')
        .update({ status: 'failed', error_msg: errMsg })
        .eq('id', postId)
    }

    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // At least one platform succeeded — update the post row
  const platform = platforms.length > 1 ? 'both' : (platforms[0] as 'facebook' | 'instagram' | 'both')
  const newStatus = scheduledFor ? 'scheduled' : 'published'
  const firstSuccessId = results.find(r => r.ok)?.latePostId ?? 'late-social'

  if (postId) {
    await supabase.from('social_posts').update({
      status: newStatus,
      scheduled_for: scheduledFor || null,
      published_at: scheduledFor ? null : new Date().toISOString(),
      fb_post_id: firstSuccessId,
      error_msg: null,
    }).eq('id', postId)
  } else {
    await supabase.from('social_posts').insert({
      tenant_id: tenantId,
      platform,
      caption: content,
      status: newStatus,
      scheduled_for: scheduledFor || null,
      published_at: scheduledFor ? null : new Date().toISOString(),
      fb_post_id: firstSuccessId,
    })
  }

  // Report partial failures if any
  const failedPlatforms = results.filter(r => !r.ok)
  const partialNote = failedPlatforms.length > 0
    ? ` (${failedPlatforms.map(r => r.platform).join(', ')} failed)`
    : ''

  return new Response(
    JSON.stringify({ success: true, postId: firstSuccessId, note: partialNote || undefined }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
