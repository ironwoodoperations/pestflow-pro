// Supabase Edge Function: publish-scheduled-posts
// Fires every 15 minutes via pg_cron. Publishes all social_posts where
// status = 'scheduled' AND scheduled_for <= now(). If a post_id is passed
// in the request body, only that specific post is processed (used by the
// "Publish Now" button in the admin social tab).
//
// DEPLOY:
//   npx supabase functions deploy publish-scheduled-posts --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt
//
// pg_cron (run once in Supabase SQL editor):
//   CREATE EXTENSION IF NOT EXISTS pg_cron;
//   CREATE EXTENSION IF NOT EXISTS pg_net;
//
//   SELECT cron.schedule(
//     'publish-scheduled-posts',
//     '*/15 * * * *',
//     $$
//     SELECT net.http_post(
//       url := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/publish-scheduled-posts',
//       headers := jsonb_build_object(
//         'Content-Type', 'application/json',
//         'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
//       ),
//       body := '{}'::jsonb
//     );
//     $$
//   );
//
//   -- Verify:
//   SELECT jobname, schedule FROM cron.job WHERE jobname = 'publish-scheduled-posts';

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SocialPost {
  id: string
  tenant_id: string
  platform: 'facebook' | 'instagram' | 'both'
  caption: string
  image_url?: string
  status: string
  scheduled_for?: string
}

interface IntegrationSettings {
  facebook_access_token?: string
  facebook_page_id?: string
  ayrshare_api_key?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  let specificPostId: string | null = null
  try {
    const body = await req.json()
    specificPostId = body?.post_id ?? null
  } catch {
    // no body — process all due posts
  }

  // Query posts to publish
  let query = supabase
    .from('social_posts')
    .select('id, tenant_id, platform, caption, image_url, status, scheduled_for')
    .eq('status', 'scheduled')

  if (specificPostId) {
    query = query.eq('id', specificPostId)
  } else {
    query = query.lte('scheduled_for', new Date().toISOString())
  }

  const { data: posts, error: postsError } = await query

  if (postsError) {
    return new Response(
      JSON.stringify({ error: postsError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const fired = posts?.length ?? 0
  let published = 0
  let failed = 0

  for (const post of (posts ?? []) as SocialPost[]) {
    // Load Facebook credentials for this tenant
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', post.tenant_id)
      .eq('key', 'integrations')
      .maybeSingle()

    const intg = (settingsData?.value ?? {}) as IntegrationSettings
    const ayrshareKey = intg.ayrshare_api_key
    const fbToken = intg.facebook_access_token
    const fbPageId = intg.facebook_page_id

    // Route via Ayrshare if API key is configured
    if (ayrshareKey) {
      try {
        const platforms: string[] = post.platform === 'both'
          ? ['facebook', 'instagram']
          : [post.platform]

        const ayrBody: Record<string, unknown> = { post: post.caption, platforms }
        if (post.image_url) ayrBody.mediaUrls = [post.image_url]

        const res = await fetch('https://app.ayrshare.com/api/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ayrshareKey}` },
          body: JSON.stringify(ayrBody),
        })
        const data = await res.json()

        if (data.status === 'error' || data.errors) {
          const errMsg = data.message || JSON.stringify(data.errors)
          await supabase.from('social_posts').update({ status: 'failed', error_msg: errMsg }).eq('id', post.id)
          failed++
        } else {
          await supabase.from('social_posts').update({ status: 'published', published_at: new Date().toISOString(), fb_post_id: data.id ?? 'ayrshare' }).eq('id', post.id)
          published++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error'
        await supabase.from('social_posts').update({ status: 'failed', error_msg: msg }).eq('id', post.id)
        failed++
      }
      continue
    }

    // No Ayrshare — fall back to Facebook Graph API
    // Instagram-only or no credentials: mark as published with a note
    if (post.platform === 'instagram' || !fbToken || !fbPageId) {
      await supabase
        .from('social_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          fb_post_id: 'no-credentials',
        })
        .eq('id', post.id)
      published++
      continue
    }

    try {
      let endpoint: string
      let body: Record<string, string>

      if (post.image_url) {
        endpoint = `https://graph.facebook.com/v19.0/${fbPageId}/photos`
        body = { url: post.image_url, caption: post.caption, access_token: fbToken }
      } else {
        endpoint = `https://graph.facebook.com/v19.0/${fbPageId}/feed`
        body = { message: post.caption, access_token: fbToken }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (data.error) {
        await supabase
          .from('social_posts')
          .update({ status: 'failed', error_msg: data.error.message })
          .eq('id', post.id)
        failed++
      } else {
        await supabase
          .from('social_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            fb_post_id: data.id,
          })
          .eq('id', post.id)
        published++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      await supabase
        .from('social_posts')
        .update({ status: 'failed', error_msg: msg })
        .eq('id', post.id)
      failed++
    }
  }

  return new Response(
    JSON.stringify({ fired, published, failed }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
