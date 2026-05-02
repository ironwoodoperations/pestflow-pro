import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import PageHelpBanner from './PageHelpBanner'
import FeatureGate from '../common/FeatureGate'
import BlogPostEditor from './BlogPostEditor'
import UndoToast from '../shared/UndoToast'
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal'
import { archiveRecord, restoreRecord, hardDeleteRecord } from '../../lib/archiveUtils'
import { triggerRevalidate } from '../../lib/revalidate'
import { autoGenBlogSeo } from '../../lib/ai/generateBlogSeo'

interface Post {
  id: string; title: string; slug: string; content: string; excerpt: string
  published_at: string | null; featured_image_url?: string | null
  archived_at?: string | null
}

type BlogTab = 'active' | 'archived'

export default function BlogTab() {
  const { tenantId } = useTenant()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [tab, setTab] = useState<BlogTab>('active')
  const [undoTarget, setUndoTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)

  function fetchPosts(currentTab: BlogTab = 'active') {
    if (!tenantId) return
    const query = supabase.from('blog_posts').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    const finalQuery = currentTab === 'active' ? query.is('archived_at', null) : query.not('archived_at', 'is', null)
    finalQuery.then(({ data }) => { setPosts(data || []); setLoading(false) })
  }

  useEffect(() => { fetchPosts(tab) }, [tenantId, tab]) // eslint-disable-line

  function openNew() { setEditingPost(null); setEditing('new') }
  function openEdit(p: Post) { setEditingPost(p); setEditing(p.id) }
  function handleSaved() { setEditing(null); setEditingPost(null); fetchPosts(tab) }

  async function handleArchive(p: Post) {
    await archiveRecord('blog_posts', p.id, supabase)
    setPosts(prev => prev.filter(x => x.id !== p.id))
    setUndoTarget({ id: p.id, title: p.title })
  }

  async function handleRestore(p: Post) {
    await restoreRecord('blog_posts', p.id, supabase)
    toast.success('Post restored.')
    fetchPosts(tab)
  }

  async function handleDeletePermanently() {
    if (!deleteTarget) return
    await hardDeleteRecord('blog_posts', deleteTarget.id, supabase)
    setDeleteTarget(null)
    fetchPosts(tab)
  }

  async function togglePublished(p: Post) {
    const nowPublished = !p.published_at
    const newPublishedAt = nowPublished ? new Date().toISOString() : null
    await supabase.from('blog_posts').update({ published_at: newPublishedAt }).eq('id', p.id)
    toast.success(nowPublished ? 'Published!' : 'Unpublished')
    setPosts(prev => prev.map(x => x.id === p.id ? { ...x, published_at: newPublishedAt } : x))
    if (nowPublished && tenantId) {
      autoGenBlogSeo(p.slug, tenantId).catch(err => console.error('Blog SEO auto-gen failed', err))
    }
    const { data: s } = await supabase.auth.getSession()
    if (s.session?.access_token && tenantId) await triggerRevalidate({ type: 'blog', tenantId }, s.session.access_token)
  }

  if (editing && tenantId) {
    return (
      <BlogPostEditor
        editing={editing}
        initialPost={editingPost}
        tenantId={tenantId}
        onSave={handleSaved}
        onCancel={() => { setEditing(null); setEditingPost(null) }}
      />
    )
  }

  return (
    <div>
      <PageHelpBanner tab="blog" title="✍️ Blog" body="Every post you publish is a new page Google can find. Click 'Generate Draft with AI' to start fresh, or write your own. Aim for 300+ words and clear titles that match what people search for. SEO meta tags are auto-generated when you publish. Aim for 2 posts per month." />
      <FeatureGate minTier={2}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
            {/* Archive tabs */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs">
              <button
                onClick={() => setTab('active')}
                className={`px-3 py-1.5 transition ${tab === 'active' ? 'bg-gray-100 text-gray-700 font-medium' : 'text-gray-400 hover:bg-gray-50'}`}
              >Active</button>
              <button
                onClick={() => setTab('archived')}
                className={`px-3 py-1.5 transition ${tab === 'archived' ? 'bg-gray-100 text-gray-700 font-medium' : 'text-gray-400 hover:bg-gray-50'}`}
              >Archived</button>
            </div>
          </div>
          {tab === 'active' && (
            <button onClick={openNew} className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--admin-accent, #10b981)' }}>
              <Plus size={16} /> New Post
            </button>
          )}
        </div>

        {tab === 'archived' && (
          <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
            Archived posts are hidden from the site regardless of published status.
          </div>
        )}

        {loading ? <p className="text-gray-400 p-4">Loading...</p> : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Title', 'Status', 'Published', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.featured_image_url && <img src={p.featured_image_url} alt="" className="w-10 h-10 object-cover rounded border border-gray-200 shrink-0" />}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.title}</p>
                          <p className="text-xs text-gray-400">/blog/{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tab === 'archived' ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600">Archived</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.published_at ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.published_at ? 'Published' : 'Draft'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4">
                      {tab === 'archived' ? (
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleRestore(p)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Restore</button>
                          <button onClick={() => setDeleteTarget(p)} className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(p)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Edit</button>
                          <button onClick={() => togglePublished(p)} className="text-sm font-medium text-gray-500 hover:text-gray-700">{p.published_at ? 'Unpublish' : 'Publish'}</button>
                          <button onClick={() => handleArchive(p)} className="text-yellow-600 hover:text-yellow-700"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    {tab === 'archived' ? 'No archived posts.' : 'No blog posts yet.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {undoTarget && (
          <UndoToast
            table="blog_posts"
            id={undoTarget.id}
            label={`"${undoTarget.title}" archived.`}
            onDismiss={() => { setUndoTarget(null); fetchPosts(tab) }}
          />
        )}

        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          itemName={deleteTarget?.title || 'this post'}
          onConfirm={handleDeletePermanently}
          onCancel={() => setDeleteTarget(null)}
        />
      </FeatureGate>
    </div>
  )
}
