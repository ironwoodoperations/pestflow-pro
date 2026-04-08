import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

const TENANT_ID = import.meta.env.VITE_TENANT_ID

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
  active_social_provider?: 'export' | 'diy' | 'buffer' | 'ayrshare'
  buffer_access_token?: string
  buffer_profile_ids?: string[]
  // ayrshare_api_key?: string   // reserved for future Ayrshare support
  // ayrshare_profile_key?: string
  pexels_api_key?: string
}

export function useSocialData() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [integrations, setIntegrations] = useState<IntegrationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [postsRes, campaignsRes, intRes] = await Promise.all([
        supabase.from('social_posts').select('*').eq('tenant_id', TENANT_ID).order('created_at', { ascending: false }),
        supabase.from('social_campaigns').select('*').eq('tenant_id', TENANT_ID).order('created_at', { ascending: false }),
        supabase.from('settings').select('value').eq('tenant_id', TENANT_ID).eq('key', 'integrations').maybeSingle(),
      ])

      setPosts((postsRes.data as SocialPost[]) || [])
      setCampaigns((campaignsRes.data as Campaign[]) || [])
      setIntegrations((intRes.data?.value as IntegrationSettings) || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load social data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { posts, campaigns, integrations, loading, error, refresh: fetchAll }
}
