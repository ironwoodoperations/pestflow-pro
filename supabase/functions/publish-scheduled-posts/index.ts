// Supabase Edge Function: publish-scheduled-posts
// Fires every 5 minutes via pg_cron. Publishes all social_posts where
// status = 'scheduled' AND scheduled_for <= now() AND archived_at IS NULL.
// If post_id is passed in the request body, only that specific post is processed
// (used by the "Publish Now" button in the admin social tab).
//
// Posting provider: Zernio (zernio.com)
//   zernio_accounts stored in settings.integrations as { [zernio_platform_key]: account_id }
//   Fallback: Facebook Graph API (facebook_access_token + facebook_page_id)
//
// DEPLOY:
//   supabase functions deploy publish-scheduled-posts --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar
//
// pg_cron setup (run once in Supabase SQL editor):
//   SELECT cron.schedule(
//     'publish-scheduled-posts',
//     '*/5 * * * *',
//     $$
//     SELECT net.http_post(
//       url := 'https://biezzykcgzkrwdgqpsar.supabase.co/functions/v1/publish-scheduled-posts',
//       headers := '{"Content-Type": "application/json"}'::jsonb,
//       body := '{}'::jsonb
//     );
//     $$
//   );

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
  zernio_accounts?: Record<string, string>   // { [zernio_platform_key]: account_id }
  facebook_access_token?: string
  facebook_page_id?: string
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

function toPlatformArray(platform: string): string[] {
  return platform === 'both' ? ['facebook', 'instagram'] : [platform]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl    = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const zernioApiKey   = Deno.env.get('ZERNIO_API_KEY') ?? ''
  const supabase       = createClient(supabaseUrl, serviceRoleKey)

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
    .is('archived_at', null)

  if (specificPostId) {
    query = query.eq('id', specificPostId)
  } else {
    query = query.lte('scheduled_for', new Date().toISOString())
  }

  const { data: posts, error: postsError } = await query

  if (postsError) {
    console.error('[publish-scheduled-posts] query error:', postsError.message)
    return new Response(
      JSON.stringify({ error: postsError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const fired = posts?.length ?? 0
  let published = 0
  let failed = 0

  for (const post of (posts ?? []) as SocialPost[]) {
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', post.tenant_id)
      .eq('key', 'integrations')
      .maybeSingle()

    const intg = (settingsData?.value ?? {}) as IntegrationSettings
    const zernioAccounts = intg.zernio_accounts ?? {}

    // ── 1. Zernio (primary) ─────────────────────────────────────────────────
    if (zernioApiKey && Object.keys(zernioAccounts).length > 0) {
      const frontendPlatforms = toPlatformArray(post.platform)
      const zernioPlatforms: { platform: string; accountId: string }[] = []

      for (const fp of frontendPlatforms) {
        const zKey    = TO_ZERNIO[fp] ?? fp
        const accId   = zernioAccounts[zKey]
        if (accId) zernioPlatforms.push({ platform: zKey, accountId: accId })
      }

      if (zernioPlatforms.length === 0) {
        await supabase.from('social_posts')
          .update({ status: 'failed', error_msg: 'No connected Zernio accounts for this platform' })
          .eq('id', post.id)
        failed++
        continue
      }

      const zernioBody: Record<string, unknown> = {
        content: post.caption,
        platforms: zernioPlatforms,
        publishNow: true,
      }
      if (post.image_url) zernioBody.mediaItems = [{ type: 'image', url: post.image_url }]

      console.log(`[publish-scheduled-posts] Zernio post ${post.id}:`, JSON.stringify(zernioBody))

      try {
        const res = await fetch('https://zernio.com/api/v1/posts', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${zernioApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(zernioBody),
        })
        const data = await res.json()
        console.log(`[publish-scheduled-posts] Zernio response ${post.id}:`, JSON.stringify(data))

        if (!res.ok) {
          const errMsg = data?.error || data?.message || `Zernio HTTP ${res.status}`
          await supabase.from('social_posts')
            .update({ status: 'failed', error_msg: errMsg })
            .eq('id', post.id)
          failed++
        } else {
          const zernioPostId = data?.post?._id ?? 'zernio-social'
          await supabase.from('social_posts').update({
            status: 'published',
            published_at: new Date().toISOString(),
            fb_post_id: zernioPostId,
            zernio_post_id: zernioPostId,
            error_msg: null,
          }).eq('id', post.id)
          published++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error'
        console.error(`[publish-scheduled-posts] Zernio error ${post.id}:`, msg)
        await supabase.from('social_posts')
          .update({ status: 'failed', error_msg: msg })
          .eq('id', post.id)
        failed++
      }
      continue
    }

    // ── 2. Facebook Graph API (last resort) ─────────────────────────────────
    if (post.platform === 'instagram' || !intg.facebook_access_token || !intg.facebook_page_id) {
      await supabase.from('social_posts').update({
        status: 'published',
        published_at: new Date().toISOString(),
        fb_post_id: 'no-credentials',
      }).eq('id', post.id)
      published++
      continue
    }

    try {
      const endpoint = post.image_url
        ? `https://graph.facebook.com/v19.0/${intg.facebook_page_id}/photos`
        : `https://graph.facebook.com/v19.0/${intg.facebook_page_id}/feed`
      const fbBody: Record<string, string> = post.image_url
        ? { url: post.image_url, caption: post.caption, access_token: intg.facebook_access_token }
        : { message: post.caption, access_token: intg.facebook_access_token }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbBody),
      })
      const data = await res.json()

      if (data.error) {
        await supabase.from('social_posts').update({ status: 'failed', error_msg: data.error.message }).eq('id', post.id)
        failed++
      } else {
        await supabase.from('social_posts').update({
          status: 'published', published_at: new Date().toISOString(), fb_post_id: data.id,
        }).eq('id', post.id)
        published++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      await supabase.from('social_posts').update({ status: 'failed', error_msg: msg }).eq('id', post.id)
      failed++
    }
  }

  console.log(`[publish-scheduled-posts] done — fired:${fired} published:${published} failed:${failed}`)
  return new Response(
    JSON.stringify({ fired, published, failed }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
