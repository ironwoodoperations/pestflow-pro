import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Send, Clock, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'

interface SocialPost {
  id: string; content: string; platform: string; status: string
  scheduled_for: string | null; published_at: string | null; created_at: string
}

export default function SocialTab() {
  const { tenantId } = useTenant()
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [fbPageId, setFbPageId] = useState('')
  const [fbToken, setFbToken] = useState('')
  const [configured, setConfigured] = useState(false)

  const [form, setForm] = useState({ content: '', platform: 'facebook', scheduledFor: '' })
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('social_posts').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
    ]).then(([postsRes, settingsRes]) => {
      setPosts(postsRes.data || [])
      const intg = settingsRes.data?.value
      if (intg?.facebook_page_id && intg?.facebook_access_token) {
        setFbPageId(intg.facebook_page_id)
        setFbToken(intg.facebook_access_token)
        setConfigured(true)
      }
      setLoading(false)
    })
  }, [tenantId])

  async function publishNow() {
    if (!form.content.trim()) { toast.error('Enter post content.'); return }
    if (!configured) { toast.error('Configure Facebook in Settings → Integrations first.'); return }
    setPosting(true)
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${fbPageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: form.content, access_token: fbToken }),
      })
      const data = await res.json()
      if (data.error) { toast.error(`Facebook error: ${data.error.message}`); setPosting(false); return }
      await supabase.from('social_posts').insert({
        tenant_id: tenantId, content: form.content, platform: 'facebook',
        status: 'published', published_at: new Date().toISOString(),
      })
      toast.success('Published to Facebook!')
      setForm({ content: '', platform: 'facebook', scheduledFor: '' })
      const { data: refreshed } = await supabase.from('social_posts').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
      setPosts(refreshed || [])
    } catch { toast.error('Failed to publish. Check your Facebook integration.') }
    setPosting(false)
  }

  async function schedulePost() {
    if (!form.content.trim()) { toast.error('Enter post content.'); return }
    if (!form.scheduledFor) { toast.error('Select a schedule date/time.'); return }
    await supabase.from('social_posts').insert({
      tenant_id: tenantId, content: form.content, platform: form.platform,
      status: 'scheduled', scheduled_for: new Date(form.scheduledFor).toISOString(),
    })
    toast.success('Post scheduled!')
    setForm({ content: '', platform: 'facebook', scheduledFor: '' })
    const { data } = await supabase.from('social_posts').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    setPosts(data || [])
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return
    await supabase.from('social_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    toast.success('Post deleted.')
  }

  const statusBadge: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700', scheduled: 'bg-blue-100 text-blue-700', draft: 'bg-gray-100 text-gray-500',
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  return (
    <div>
      {!configured && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">Connect your Facebook Page in Settings → Integrations to enable live posting.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Post Composer</h3>
            <div className="space-y-4">
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5} placeholder="Write your social media post..." className={`${inputClass} resize-none`} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform</label>
                <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} className={`${inputClass} bg-white`}>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Schedule (optional)</label>
                <input type="datetime-local" value={form.scheduledFor} onChange={e => setForm(p => ({ ...p, scheduledFor: e.target.value }))} className={inputClass} />
              </div>
              <div className="flex gap-2">
                <button onClick={publishNow} disabled={posting || !configured} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <Send size={14} /> {posting ? 'Publishing...' : 'Publish Now'}
                </button>
                <button onClick={schedulePost} className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Clock size={14} /> Schedule
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Recent Posts</h3>
            </div>
            {posts.length === 0 ? (
              <p className="p-6 text-gray-400 text-sm">No posts yet. Create your first post!</p>
            ) : (
              <div>
                {posts.map(p => (
                  <div key={p.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{p.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[p.status] || 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                          <span className="text-xs text-gray-400 capitalize">{p.platform}</span>
                          <span className="text-xs text-gray-400">{new Date(p.published_at || p.scheduled_for || p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button onClick={() => deletePost(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
