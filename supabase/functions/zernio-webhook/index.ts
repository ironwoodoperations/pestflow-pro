// Supabase Edge Function: zernio-webhook
// Receives webhook events from Zernio. Handles:
//   account.connected → auto-updates zernio_accounts in settings
//   post.published    → updates social_posts.status = 'published'
//   post.failed       → updates social_posts.status = 'failed'
//   post.partial      → updates social_posts.status = 'failed' with note
// JWT: OFF — Zernio POSTs directly to this URL
// DEPLOY:
//   supabase functions deploy zernio-webhook --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS })
  }

  let payload: { event?: string; account?: Record<string, unknown>; post?: Record<string, unknown> }
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: CORS })
  }

  const { event, account, post } = payload
  console.log('[zernio-webhook] received event:', event, JSON.stringify(payload))

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // ── account.connected ────────────────────────────────────────────────────────
  // Fired when a client finishes OAuth for a platform.
  // Updates zernio_accounts in settings so the next post goes through immediately.
  if (event === 'account.connected' && account) {
    const profileId = account.profileId as string | undefined
    const platform  = account.platform as string | undefined
    const accountId = account._id as string | undefined

    if (!profileId || !platform || !accountId) {
      console.warn('[zernio-webhook] account.connected missing fields:', JSON.stringify(account))
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    // Find tenant by zernio_profile_id stored in integrations settings
    const { data: rows } = await supabase
      .from('settings')
      .select('tenant_id, value')
      .eq('key', 'integrations')
      .filter('value->>zernio_profile_id', 'eq', profileId)

    if (rows && rows.length > 0) {
      const { tenant_id, value: integrations } = rows[0]
      const zernioAccounts: Record<string, string> = { ...(integrations?.zernio_accounts ?? {}), [platform]: accountId }
      await supabase
        .from('settings')
        .update({ value: { ...integrations, zernio_accounts: zernioAccounts } })
        .eq('tenant_id', tenant_id)
        .eq('key', 'integrations')
      console.log(`[zernio-webhook] account.connected: tenant ${tenant_id} → ${platform} = ${accountId}`)
    } else {
      console.warn('[zernio-webhook] account.connected: no tenant found for profileId', profileId)
    }
  }

  // ── post.published ───────────────────────────────────────────────────────────
  if (event === 'post.published' && post?._id) {
    await supabase
      .from('social_posts')
      .update({ status: 'published', published_at: new Date().toISOString(), error_msg: null })
      .eq('zernio_post_id', post._id as string)
    console.log('[zernio-webhook] post.published:', post._id)
  }

  // ── post.failed / post.partial ───────────────────────────────────────────────
  if ((event === 'post.failed' || event === 'post.partial') && post?._id) {
    const errMsg = event === 'post.partial'
      ? 'Post published to some platforms only (partial failure)'
      : ((post.error as string) || 'Zernio: post failed')
    await supabase
      .from('social_posts')
      .update({ status: 'failed', error_msg: errMsg })
      .eq('zernio_post_id', post._id as string)
    console.log(`[zernio-webhook] ${event}:`, post._id, errMsg)
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
