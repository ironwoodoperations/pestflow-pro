import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import type { SocialPost, Campaign } from './useSocialData'
import PostCard from './PostCard'
import PostPreviewModal from './PostPreviewModal'
import EditPostModal from './EditPostModal'

const TENANT_ID = import.meta.env.VITE_TENANT_ID

interface Props {
  posts: SocialPost[]
  campaigns: Campaign[]
  selectedCampaignId: string | null
  onRefresh: () => void
}

export default function ContentQueueTab({ posts, campaigns, selectedCampaignId, onRefresh }: Props) {
  const [state, setState] = useState({
    filterPlatform: 'all' as string,
    filterStatus: 'all' as string,
    filterCampaign: 'all' as string,
    previewPost: null as SocialPost | null,
    editPost: null as SocialPost | null,
    bulkApproving: false,
  })

  useEffect(() => {
    if (selectedCampaignId) setState(p => ({ ...p, filterCampaign: selectedCampaignId }))
  }, [selectedCampaignId])

  const filtered = posts.filter(p => {
    if (state.filterPlatform !== 'all' && p.platform !== state.filterPlatform) return false
    if (state.filterStatus !== 'all' && p.status !== state.filterStatus) return false
    if (state.filterCampaign !== 'all' && p.campaign_id !== state.filterCampaign) return false
    return true
  })

  const draftCount = filtered.filter(p => p.status === 'draft').length
  const selectCls = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white'

  async function handleApprove(postId: string) {
    await supabase.from('social_posts').update({ status: 'approved' }).eq('id', postId).eq('tenant_id', TENANT_ID)
    onRefresh()
  }

  async function handleApproveAll() {
    setState(p => ({ ...p, bulkApproving: true }))
    const draftIds = filtered.filter(p => p.status === 'draft').map(p => p.id)
    if (draftIds.length > 0) {
      await supabase.from('social_posts').update({ status: 'approved' }).in('id', draftIds).eq('tenant_id', TENANT_ID)
    }
    setState(p => ({ ...p, bulkApproving: false }))
    toast.success(`${draftIds.length} posts approved!`)
    onRefresh()
  }

  async function handleDelete(postId: string) {
    await supabase.from('social_posts').delete().eq('id', postId).eq('tenant_id', TENANT_ID)
    toast.success('Post deleted.')
    onRefresh()
  }

  async function handleEditSave(postId: string, updates: { caption: string; scheduled_for: string | null; status: string }) {
    const { error } = await supabase.from('social_posts').update({
      caption: updates.caption,
      scheduled_for: updates.scheduled_for,
      status: updates.status,
    }).eq('id', postId).eq('tenant_id', TENANT_ID)
    if (error) throw error
    setState(p => ({ ...p, editPost: null }))
    toast.success('Post updated!')
    onRefresh()
  }

  async function handleSmartSchedule() {
    const drafts = filtered.filter(p => p.status === 'draft')
    if (drafts.length === 0) { toast.error('No drafts to schedule.'); return }
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          messages: [{ role: 'user', content: `You are a social media scheduling expert. Suggest optimal posting times for ${drafts.length} posts for a home services company. Spread them over the next 7 days. Today is ${new Date().toISOString().split('T')[0]}. Return ONLY a JSON array:\n[{"post_index":0,"scheduled_for":"YYYY-MM-DDTHH:mm:00"},...]` }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const schedule = JSON.parse(clean) as { post_index: number; scheduled_for: string }[]
      for (const item of schedule) {
        const post = drafts[item.post_index]
        if (post) {
          await supabase.from('social_posts').update({ scheduled_for: item.scheduled_for, status: 'scheduled' })
            .eq('id', post.id).eq('tenant_id', TENANT_ID)
        }
      }
      toast.success('Smart schedule applied!')
      onRefresh()
    } catch {
      toast.error('Smart scheduling failed.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={state.filterPlatform} onChange={e => setState(p => ({ ...p, filterPlatform: e.target.value }))} className={selectCls}>
          <option value="all">All Platforms</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="both">FB + IG</option>
        </select>
        <select value={state.filterStatus} onChange={e => setState(p => ({ ...p, filterStatus: e.target.value }))} className={selectCls}>
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="failed">Failed</option>
        </select>
        <select value={state.filterCampaign} onChange={e => setState(p => ({ ...p, filterCampaign: e.target.value }))} className={selectCls}>
          <option value="all">All Campaigns</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {/* Bulk actions */}
      {draftCount > 0 && (
        <div className="bg-emerald-50 rounded-lg p-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-emerald-800">{draftCount} draft post{draftCount > 1 ? 's' : ''} ready for review</span>
          <button onClick={handleApproveAll} disabled={state.bulkApproving}
            className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
            {state.bulkApproving ? 'Approving…' : `Approve All (${draftCount})`}
          </button>
          <button onClick={handleSmartSchedule}
            className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
            Smart Schedule
          </button>
        </div>
      )}

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-sm text-gray-400">
            {posts.length === 0
              ? 'No posts yet. Click + New Post to get started.'
              : 'No posts match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(post => (
            <PostCard key={post.id} post={post} campaigns={campaigns}
              onPreview={p => setState(s => ({ ...s, previewPost: p }))}
              onEdit={p => setState(s => ({ ...s, editPost: p }))}
              onApprove={handleApprove} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <PostPreviewModal post={state.previewPost} onClose={() => setState(p => ({ ...p, previewPost: null }))} />
      <EditPostModal post={state.editPost} onClose={() => setState(p => ({ ...p, editPost: null }))} onSave={handleEditSave} />
    </div>
  )
}
