import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'
import type { Campaign } from './useSocialData'

// S242 Item C — live status of generate-social-batch jobs. Initial fetch +
// realtime channel on campaign_jobs (added to supabase_realtime publication by
// the orchestrator; RLS scopes SELECT to the tenant). Merge INSERT/UPDATE by id.
interface CampaignJob {
  id: string
  campaign_id: string | null
  status: 'queued' | 'processing' | 'completed' | 'failed'
  posts_requested: number
  posts_created: number
  posts_with_images: number
  last_error: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

const JOB_STATUS: Record<CampaignJob['status'], { label: string; cls: string }> = {
  queued:     { label: 'Queued',      cls: 'bg-gray-100 text-gray-600' },
  processing: { label: 'Generating…', cls: 'bg-blue-100 text-blue-700' },
  completed:  { label: 'Completed',   cls: 'bg-green-100 text-green-800' },
  failed:     { label: 'Failed',      cls: 'bg-red-100 text-red-800' },
}

const JOB_COLS = 'id, campaign_id, status, posts_requested, posts_created, posts_with_images, last_error, started_at, completed_at, created_at'
const DAY_MS = 24 * 60 * 60 * 1000

export default function CampaignJobsPanel({ campaigns }: { campaigns: Campaign[] }) {
  const { id: tenantId } = useTenant()
  const [jobs, setJobs] = useState<CampaignJob[]>([])

  useEffect(() => {
    if (!tenantId) return
    let active = true

    supabase
      .from('campaign_jobs')
      .select(JOB_COLS)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (active && data) setJobs(data as CampaignJob[]) })

    const channel = supabase
      .channel(`campaign_jobs:${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_jobs', filter: `tenant_id=eq.${tenantId}` },
        payload => {
          const row = payload.new as CampaignJob
          if (!row?.id) return // DELETE payloads carry no new row
          setJobs(prev => [row, ...prev.filter(j => j.id !== row.id)]
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .slice(0, 10))
        },
      )
      .subscribe()

    return () => { active = false; supabase.removeChannel(channel) }
  }, [tenantId])

  // Show active jobs always; completed only within the last 24h (keeps it relevant).
  const visible = jobs.filter(j =>
    j.status !== 'completed' || (!!j.completed_at && Date.now() - new Date(j.completed_at).getTime() < DAY_MS))
  if (visible.length === 0) return null

  const titleFor = (id: string | null) => campaigns.find(c => c.id === id)?.title ?? 'Campaign'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Generation activity</h4>
      <div className="space-y-2">
        {visible.map(job => {
          const s = JOB_STATUS[job.status] ?? JOB_STATUS.queued
          return (
            <div key={job.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <span className="block font-medium text-gray-800 text-sm truncate">{titleFor(job.campaign_id)}</span>
                <span className="block text-xs text-gray-500 truncate">
                  {job.status === 'completed'
                    ? `${job.posts_created} posts · ${job.posts_with_images} with images`
                    : `${job.posts_requested} posts requested`}
                  {job.status === 'failed' && job.last_error ? ` · ${job.last_error}` : ''}
                </span>
              </div>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
