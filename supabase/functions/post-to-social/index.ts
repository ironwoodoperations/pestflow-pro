// Edge function: post-to-social
// Posts content to social media via bundle.social API.
// JWT: true (requires auth token)
// DEPLOY:
//   supabase functions deploy post-to-social --project-ref biezzykcgzkrwdgqpsar
//
// TODO: per-tenant profileKey when upgrading to paid plan (currently single API key for all tenants)

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
      JSON.stringify({ error: 'Social posting not configured — BUNDLE_SOCIAL_API missing' }),
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

  const { content, platforms, scheduledFor, tenantId } = body

  if (!content || !platforms?.length || !tenantId) {
    return new Response(JSON.stringify({ error: 'content, platforms, and tenantId are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Call bundle.social API
  const bundleBody: Record<string, unknown> = { content, platforms }
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
      return new Response(
        JSON.stringify({ error: data?.message || `bundle.social error: ${res.status}` }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log successful post in social_posts table
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const platform = platforms.length > 1 ? 'both' : (platforms[0] as 'facebook' | 'instagram' | 'both')

    await supabase.from('social_posts').insert({
      tenant_id: tenantId,
      platform,
      caption: content,
      status: scheduledFor ? 'scheduled' : 'published',
      scheduled_for: scheduledFor || null,
      published_at: scheduledFor ? null : new Date().toISOString(),
      fb_post_id: data?.id || 'bundle-social',
    })

    return new Response(
      JSON.stringify({ success: true, postId: data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
