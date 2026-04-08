import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import PageHelpBanner from './PageHelpBanner'
import FeatureGate from '../common/FeatureGate'
import BlogPostEditor from './BlogPostEditor'

interface Post {
  id: string; title: string; slug: string; content: string; excerpt: string
  published: boolean; published_at: string | null; featured_image_url?: string | null
}

export default function BlogTab() {
  const { tenantId } = useTenant()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null) // null=list, 'new', or post id
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  function fetchPosts() {
    if (!tenantId) return
    supabase.from('blog_posts').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false) })
  }

  useEffect(() => { fetchPosts() }, [tenantId]) // eslint-disable-line

  function openNew() { setEditingPost(null); setEditing('new') }
  function openEdit(p: Post) { setEditingPost(p); setEditing(p.id) }

  function handleSaved() { setEditing(null); setEditingPost(null); fetchPosts() }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    toast.success('Post deleted.'); fetchPosts()
  }

  async function togglePublished(p: Post) {
    const published = !p.published
    await supabase.from('blog_posts').update({ published, published_at: published ? new Date().toISOString() : null }).eq('id', p.id)
    toast.success(published ? 'Published!' : 'Unpublished')
    setPosts(prev => prev.map(x => x.id === p.id ? { ...x, published, published_at: published ? new Date().toISOString() : null } : x))
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
      <PageHelpBanner tab="blog" title="✍️ Blog" body="Every post you publish is a new page Google can find. Use clear titles that match what people search for, write at least 300 words, and use the AI button for help. Toggle Published when ready to go live. Aim for 2 posts per month." />
      <FeatureGate minTier={2}>
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
          <button onClick={openNew} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> New Post
          </button>
        </div>
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEdit(p)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Edit</button>
                        <button onClick={() => togglePublished(p)} className="text-sm font-medium text-gray-500 hover:text-gray-700">{p.published ? 'Unpublish' : 'Publish'}</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No blog posts yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </FeatureGate>
    </div>
  )
}
