import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'

interface Post {
  id: string; title: string; slug: string; content: string; excerpt: string
  published: boolean; published_at: string | null; created_at: string
}

interface PostForm {
  title: string; slug: string; content: string; excerpt: string
  published: boolean; published_at: string
}

const toSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()

export default function BlogTab() {
  const { tenantId } = useTenant()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null) // 'new' or post id
  const [form, setForm] = useState<PostForm>({ title: '', slug: '', content: '', excerpt: '', published: false, published_at: '' })
  const [saving, setSaving] = useState(false)

  async function fetchPosts() {
    if (!tenantId) return
    const { data } = await supabase.from('blog_posts').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [tenantId])

  function openNew() {
    setForm({ title: '', slug: '', content: '', excerpt: '', published: false, published_at: new Date().toISOString().split('T')[0] })
    setEditing('new')
  }

  function openEdit(p: Post) {
    setForm({ title: p.title, slug: p.slug, content: p.content || '', excerpt: p.excerpt || '', published: p.published, published_at: p.published_at ? p.published_at.split('T')[0] : '' })
    setEditing(p.id)
  }

  async function handleSave() {
    if (!tenantId || !form.title.trim()) { toast.error('Title is required.'); return }
    const slug = form.slug || toSlug(form.title)
    setSaving(true)
    if (editing === 'new') {
      const { error } = await supabase.from('blog_posts').insert({
        tenant_id: tenantId, title: form.title, slug, content: form.content, excerpt: form.excerpt,
        published: form.published, published_at: form.published ? form.published_at || new Date().toISOString() : null,
      })
      if (error) toast.error('Failed to create post.'); else toast.success('Post created!')
    } else {
      const { error } = await supabase.from('blog_posts').update({
        title: form.title, slug, content: form.content, excerpt: form.excerpt,
        published: form.published, published_at: form.published ? form.published_at || new Date().toISOString() : null,
      }).eq('id', editing)
      if (error) toast.error('Failed to update post.'); else toast.success('Post updated!')
    }
    setSaving(false); setEditing(null); fetchPosts()
  }

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

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

  // Post editor view
  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium">
          <ArrowLeft size={16} /> Back to Posts
        </button>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-100">{editing === 'new' ? 'New Post' : 'Edit Post'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value, slug: editing === 'new' ? toSlug(e.target.value) : p.slug })) }} placeholder="Post title" className={`${inputClass} text-lg`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
              <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="url-slug" className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">/blog/{form.slug || 'slug-preview'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt</label>
              <textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} placeholder="Brief summary shown in blog listing" className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Content <span className="text-gray-400 font-normal">(Supports HTML)</span></label>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={16} placeholder="Full post content..." className={`${inputClass} resize-none font-mono text-xs`} />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked, published_at: e.target.checked && !p.published_at ? new Date().toISOString().split('T')[0] : p.published_at }))} className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                Publish this post
              </label>
              {form.published && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mr-2">Date:</label>
                  <input type="date" value={form.published_at} onChange={e => setForm(p => ({ ...p, published_at: e.target.value }))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Post'}
              </button>
              <button onClick={() => setEditing(null)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Posts list view
  return (
    <div>
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
                    <p className="text-sm font-medium text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-400">/blog/{p.slug}</p>
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
    </div>
  )
}
