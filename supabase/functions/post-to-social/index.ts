// Edge function: post-to-social
// Posts content to social media via bundle.social API.
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
  const bundleApiKey = Deno.env.get('BUNDLE_SOCIAL_API') ?? ''

  if (!bundleApiKey) {
    return new Response(
      JSON.stringify({ error: 'Social posting not configured — BUNDLE_SOCIAL_API missing. Contact your account manager.' }),
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

  const { content, platforms, scheduledFor, tenantId, postId } = body

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
  const bundleAccountId: string | null = intgRes.data?.value?.bundle_social_account_id ?? null

  // Tier 1 (Starter): no scheduling allowed
  if (tier === 1) {
    return new Response(
      JSON.stringify({ error: 'Scheduling not available on Starter plan. Upgrade to Grow to enable social scheduling.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // bundle.social accountId required for posting
  if (!bundleAccountId) {
    return new Response(
      JSON.stringify({ error: 'bundle.social account ID not configured. Add it in Social → Connections.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

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

  // Call bundle.social API
  const bundleBody: Record<string, unknown> = {
    content,
    platforms,
    accountId: bundleAccountId,
  }
  if (scheduledFor) bundleBody.scheduledDate = scheduledFor

  try {
    const res = await fetch('https://api.bundle.social/v1/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bundleApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bundleBody),
    })

    const data = await res.json()

    if (!res.ok) {
      const errMsg = data?.message || data?.error || `bundle.social error: ${res.status}`
      console.error('[post-to-social] bundle.social API error:', JSON.stringify(data))

      // Update existing post row to failed if postId provided
      if (postId) {
        await supabase.from('social_posts')
          .update({ status: 'failed', error_msg: errMsg })
          .eq('id', postId)
      }

      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Success — update existing post row if provided, otherwise insert
    const platform = platforms.length > 1 ? 'both' : (platforms[0] as 'facebook' | 'instagram' | 'both')
    const newStatus = scheduledFor ? 'scheduled' : 'published'

    if (postId) {
      await supabase.from('social_posts').update({
        status: newStatus,
        scheduled_for: scheduledFor || null,
        published_at: scheduledFor ? null : new Date().toISOString(),
        fb_post_id: data?.id || 'bundle-social',
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
        fb_post_id: data?.id || 'bundle-social',
      })
    }

    return new Response(
      JSON.stringify({ success: true, postId: data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    console.error('[post-to-social] unexpected error:', msg)

    if (postId) {
      await supabase.from('social_posts')
        .update({ status: 'failed', error_msg: msg })
        .eq('id', postId)
    }

    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
