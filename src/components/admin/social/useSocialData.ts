import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'

export interface SocialPost {
  id: string
  tenant_id: string
  campaign_id: string | null
  platform: 'facebook' | 'instagram' | 'both'
  caption: string
  image_url: string | null
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'approved'
  scheduled_for: string | null
  published_at: string | null
  fb_post_id: string | null
  error_msg: string | null
  ai_generated: boolean | null
  campaign_title: string | null
  created_at: string
}

export interface Campaign {
  id: string
  tenant_id: string
  title: string
  goal: string | null
  tone: string | null
  duration_days: number
  platforms: string[]
  start_date: string | null
  status: 'active' | 'paused' | 'completed'
  created_at: string
}

export interface IntegrationSettings {
  facebook_access_token?: string
  facebook_page_id?: string
  active_social_provider?: 'export' | 'diy' | 'full_auto'
  zernio_accounts?: Record<string, string>
}

// Race a Supabase query against an 8s timeout so a stalled connection-pool
// slot or transient backend hiccup never hangs the Social tab indefinitely.
// Per S196 b66 probe: hang surfaced from one of the 3 mount queries with no
// fail-fast; this gate flips loading=false and surfaces a non-fatal error.
function withTimeout<T>(p: PromiseLike<T>, label: string, ms = 8000): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ])
}

export function useSocialData() {
  const { id: tenantId } = useTenant()
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [integrations, setIntegrations] = useState<IntegrationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // social_campaigns has NO archived_at column — DO NOT add .is('archived_at', null) here.
      // .limit(200) bounds payload regardless of historical row count.
      const [postsRes, campaignsRes, intRes] = await Promise.all([
        withTimeout(
          supabase.from('social_posts').select('*').eq('tenant_id', tenantId).is('archived_at', null).order('created_at', { ascending: false }).limit(200),
          'social_posts',
        ),
        withTimeout(
          supabase.from('social_campaigns').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(200),
          'social_campaigns',
        ),
        withTimeout(
          supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
          'integrations',
        ),
      ])

      setPosts((postsRes.data as SocialPost[]) || [])
      setCampaigns((campaignsRes.data as Campaign[]) || [])
      setIntegrations((intRes.data?.value as IntegrationSettings) || null)
    } catch (err) {
      // Non-fatal: surface error, leave any partial state, ALWAYS unblock loading.
      setError(err instanceof Error ? err.message : 'Failed to load social data')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { posts, campaigns, integrations, loading, error, refresh: fetchAll }
}
