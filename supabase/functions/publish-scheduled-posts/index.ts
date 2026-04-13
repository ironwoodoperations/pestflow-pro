// Supabase Edge Function: publish-scheduled-posts
// Fires every 5 minutes via pg_cron. Publishes all social_posts where
// status = 'scheduled' AND scheduled_for <= now() AND archived_at IS NULL.
// If post_id is passed in the request body, only that specific post is processed
// (used by the "Publish Now" button in the admin social tab).
//
// Posting provider: Late (getlate.dev)
//   Per-platform accountIds stored in settings.integrations.late_accounts
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
//
// Verify:
//   SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'publish-scheduled-posts';

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
  late_accounts?: Record<string, string>  // { facebook: 'acc_xxx', instagram: 'acc_yyy', ... }
  bundle_social_team_id?: string          // kept for backwards compatibility
  facebook_access_token?: string
  facebook_page_id?: string
  ayrshare_api_key?: string
}

// Map frontend platform names to Late API platform keys
const LATE_PLATFORM_MAP: Record<string, string> = {
  facebook: 'facebook',
  instagram: 'instagram',
  youtube: 'youtube',
  linkedin: 'linkedin',
  google: 'google_business',
  tiktok: 'tiktok',
}

function toPlatformArray(platform: string): string[] {
  return platform === 'both' ? ['facebook', 'instagram'] : [platform]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const lateApiKey = Deno.env.get('LATE_API_KEY') ?? ''
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
    // Load integrations settings for this tenant
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', post.tenant_id)
      .eq('key', 'integrations')
      .maybeSingle()

    const intg = (settingsData?.value ?? {}) as IntegrationSettings
    const lateAccounts = intg.late_accounts ?? {}

    // ── 1. Late (getlate.dev) — primary provider ────────────────────────────
    if (lateApiKey && Object.keys(lateAccounts).length > 0) {
      const platforms = toPlatformArray(post.platform)
      let anyOk = false
      const errors: string[] = []

      for (const platform of platforms) {
        const accountId = lateAccounts[platform]
        if (!accountId) {
          errors.push(`No Late account connected for ${platform}`)
          continue
        }

        const lateBody: Record<string, unknown> = {
          accountId,
          platforms: [LATE_PLATFORM_MAP[platform] ?? platform],
          content: post.caption,
        }
        if (post.image_url) lateBody.mediaUrls = [post.image_url]

        console.log(`[publish-scheduled-posts] Late API post ${post.id} / ${platform}:`, JSON.stringify(lateBody))

        try {
          const res = await fetch('https://api.getlate.dev/v1/posts', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${lateApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(lateBody),
          })
          const data = await res.json()
          console.log(`[publish-scheduled-posts] Late API response ${post.id} / ${platform}:`, JSON.stringify(data))

          if (!res.ok) {
            errors.push(`${platform}: ${data?.error || data?.message || `HTTP ${res.status}`}`)
          } else {
            anyOk = true
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Network error'
          console.error(`[publish-scheduled-posts] Late API error ${post.id} / ${platform}:`, msg)
          errors.push(`${platform}: ${msg}`)
        }
      }

      if (anyOk) {
        await supabase.from('social_posts').update({
          status: 'published',
          published_at: new Date().toISOString(),
          fb_post_id: 'late-social',
          error_msg: errors.length > 0 ? errors.join('; ') : null,
        }).eq('id', post.id)
        published++
      } else {
        const errMsg = errors.join('; ') || 'Late API: no accounts configured'
        await supabase.from('social_posts')
          .update({ status: 'failed', error_msg: errMsg })
          .eq('id', post.id)
        failed++
      }
      continue
    }

    // ── 2. Ayrshare (legacy fallback) ───────────────────────────────────────
    if (intg.ayrshare_api_key) {
      try {
        const platforms = toPlatformArray(post.platform)
        const ayrBody: Record<string, unknown> = { post: post.caption, platforms }
        if (post.image_url) ayrBody.mediaUrls = [post.image_url]

        const res = await fetch('https://app.ayrshare.com/api/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${intg.ayrshare_api_key}` },
          body: JSON.stringify(ayrBody),
        })
        const data = await res.json()

        if (data.status === 'error' || data.errors) {
          const errMsg = data.message || JSON.stringify(data.errors)
          await supabase.from('social_posts').update({ status: 'failed', error_msg: errMsg }).eq('id', post.id)
          failed++
        } else {
          await supabase.from('social_posts').update({
            status: 'published', published_at: new Date().toISOString(), fb_post_id: data.id ?? 'ayrshare',
          }).eq('id', post.id)
          published++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error'
        await supabase.from('social_posts').update({ status: 'failed', error_msg: msg }).eq('id', post.id)
        failed++
      }
      continue
    }

    // ── 3. Facebook Graph API (last resort) ─────────────────────────────────
    if (post.platform === 'instagram' || !intg.facebook_access_token || !intg.facebook_page_id) {
      // Instagram-only or no credentials: mark published with note
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
      const body: Record<string, string> = post.image_url
        ? { url: post.image_url, caption: post.caption, access_token: intg.facebook_access_token }
        : { message: post.caption, access_token: intg.facebook_access_token }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
