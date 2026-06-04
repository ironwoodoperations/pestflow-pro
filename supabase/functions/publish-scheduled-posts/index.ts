// Supabase Edge Function: publish-scheduled-posts v42
// Fires every 5 minutes via pg_cron. Publishes all social_posts where
// status = 'scheduled' AND scheduled_for <= now() AND archived_at IS NULL.
//
// CHANGE LOG v41 → v42 (S218 final fix):
//   Same Zernio presign field-name fix as post-to-social v38. v41 sent
//   fileName/fileType (from docs). Zernio's actual API rejects those and
//   wants filename/contentType. v42 sends both naming conventions.
//
// Auth: verify_jwt:false at platform; in-source validation of `apikey` header
//       against PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET env var. Sole legitimate
//       caller: pg_cron 'publish-scheduled-posts' job.
//
// DEPLOY:
//   supabase functions deploy publish-scheduled-posts --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'
import { getTenantSecret, VaultSecretMissingError } from '../_shared/secrets/getTenantSecret.ts'

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
  media_type?: string        // S250: 'image' | 'video' — drives Zernio mediaItems[].type
  status: string
  scheduled_for?: string
}

interface IntegrationSettings {
  zernio_accounts?: Record<string, string>
  facebook_page_id?: string
}

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

// ============================================================
// Zernio media-upload helper (v42 — field-name fix)
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

  // v42: send BOTH camelCase (docs) and lowercase (actual API error) field names.
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

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const expectedSecret = Deno.env.get('PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET') || ''
  const presentedSecret = req.headers.get('apikey') || ''

  if (!expectedSecret) {
    console.error('[publish-scheduled-posts] PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET env var not set; rejecting all requests')
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const enc = new TextEncoder()
  const a = enc.encode(expectedSecret)
  const b = enc.encode(presentedSecret)
  const authOk = a.length === b.length && timingSafeEqual(a, b)

  if (!authOk) {
    console.warn('[publish-scheduled-posts] auth failed — apikey_present:', !!presentedSecret, 'apikey_length_match:', a.length === b.length)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl    = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const zernioApiKey   = Deno.env.get('ZERNIO_API_KEY') ?? ''
  const supabase       = createClient(supabaseUrl, serviceRoleKey)

  const { data: posts, error: postsError } = await supabase
    .from('social_posts')
    .update({ status: 'publishing' })
    .eq('status', 'scheduled')
    .is('archived_at', null)
    .lte('scheduled_for', new Date().toISOString())
    .select('id, tenant_id, platform, caption, image_url, media_type, status, scheduled_for')

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

      if (post.image_url) {
        try {
          const zernioPublicUrl = await uploadImageToZernio(post.image_url, zernioApiKey)
          // S250: derive Zernio media kind from media_type (null/absent -> 'image').
          const mediaItemType = post.media_type === 'video' ? 'video' : 'image'
          zernioBody.mediaItems = [{ type: mediaItemType, url: zernioPublicUrl }]
          console.log(`[publish-scheduled-posts] Zernio media uploaded for ${post.id}:`, zernioPublicUrl, 'type:', mediaItemType)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Image upload failed'
          console.error(`[publish-scheduled-posts] Zernio media upload error ${post.id}:`, msg)
          await supabase.from('social_posts')
            .update({ status: 'failed', error_msg: `Image upload to Zernio failed: ${msg}` })
            .eq('id', post.id)
          failed++
          continue
        }
      }

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

    // Instagram, or no FB page configured → no Facebook send (no token needed).
    if (post.platform === 'instagram' || !intg.facebook_page_id) {
      await supabase.from('social_posts').update({
        status: 'published',
        published_at: new Date().toISOString(),
        fb_post_id: 'no-credentials',
      }).eq('id', post.id)
      published++
      continue
    }

    // S254: Facebook page access token now lives in Vault (was
    // settings.integrations.facebook_access_token). Fail-hard helper: a missing
    // token = this tenant has no FB credentials (same as the old no-credentials
    // path); a Vault access error fails the post loudly rather than POSTing an
    // empty access_token to Facebook Graph.
    let fbAccessToken: string
    try {
      fbAccessToken = await getTenantSecret(supabase, post.tenant_id, 'facebook_access_token')
    } catch (e) {
      if (e instanceof VaultSecretMissingError) {
        await supabase.from('social_posts').update({
          status: 'published',
          published_at: new Date().toISOString(),
          fb_post_id: 'no-credentials',
        }).eq('id', post.id)
        published++
        continue
      }
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[publish-scheduled-posts] vault read error ${post.id}:`, msg)
      await supabase.from('social_posts').update({
        status: 'failed',
        error_msg: `Vault read error (facebook_access_token): ${msg}`,
      }).eq('id', post.id)
      failed++
      continue
    }

    try {
      const endpoint = post.image_url
        ? `https://graph.facebook.com/v19.0/${intg.facebook_page_id}/photos`
        : `https://graph.facebook.com/v19.0/${intg.facebook_page_id}/feed`
      const fbBody: Record<string, string> = post.image_url
        ? { url: post.image_url, caption: post.caption, access_token: fbAccessToken }
        : { message: post.caption, access_token: fbAccessToken }

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
}

if (import.meta.main) {
  Deno.serve(handler)
}
