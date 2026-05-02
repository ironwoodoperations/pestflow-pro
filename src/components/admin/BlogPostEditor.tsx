import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { triggerRevalidate } from '../../lib/revalidate'

interface Post {
  id: string; title: string; slug: string; content: string; excerpt: string
  published_at: string | null; featured_image_url?: string | null
}

interface PostForm {
  title: string; slug: string; content: string; excerpt: string
  published_at: string | null; featured_image_url: string
}

interface Props {
  editing: string // 'new' or post id
  initialPost: Post | null
  tenantId: string
  onSave: () => void
  onCancel: () => void
}

const toSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

export default function BlogPostEditor({ editing, initialPost, tenantId, onSave, onCancel }: Props) {
  const [form, setForm] = useState<PostForm>({
    title: initialPost?.title ?? '',
    slug: initialPost?.slug ?? '',
    content: initialPost?.content ?? '',
    excerpt: initialPost?.excerpt ?? '',
    published_at: initialPost?.published_at ? initialPost.published_at.split('T')[0] : null,
    featured_image_url: initialPost?.featured_image_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${tenantId}/blog/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('tenant-assets').upload(path, file, { upsert: true })
    if (error) { toast.error('Image upload failed.'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('tenant-assets').getPublicUrl(path)
    setForm(p => ({ ...p, featured_image_url: urlData.publicUrl }))
    setUploading(false)
    toast.success('Image uploaded!')
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Title is required.'); return }
    const slug = form.slug || toSlug(form.title)
    setSaving(true)
    const payload = {
      title: form.title, slug, content: form.content, excerpt: form.excerpt,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      featured_image_url: form.featured_image_url || null,
    }
    let error
    if (editing === 'new') {
      const res = await supabase.from('blog_posts').insert({ tenant_id: tenantId, ...payload })
      error = res.error
    } else {
      const res = await supabase.from('blog_posts').update(payload).eq('id', editing)
      error = res.error
    }
    setSaving(false)
    if (error) { toast.error(`Failed to save post: ${error.message}`); return }
    toast.success(editing === 'new' ? 'Post created!' : 'Post updated!')
    const { data: s } = await supabase.auth.getSession()
    if (s.session?.access_token) await triggerRevalidate({ type: 'blog', tenantId }, s.session.access_token)
    onSave()
  }

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Posts
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-100">
          {editing === 'new' ? 'New Post' : 'Edit Post'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value, slug: editing === 'new' ? toSlug(e.target.value) : p.slug }))} placeholder="Post title" className={`${inputClass} text-lg`} />
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Featured Image</label>
            {form.featured_image_url ? (
              <div className="flex items-center gap-3">
                <img src={form.featured_image_url} alt="Featured" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                <button type="button" onClick={() => setForm(p => ({ ...p, featured_image_url: '' }))} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                  <X size={12} /> Remove
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:bg-gray-100 w-fit">
                <Upload size={14} />
                {uploading ? 'Uploading...' : 'Upload image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content <span className="text-gray-400 font-normal">(Supports HTML)</span></label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={16} placeholder="Full post content..." className={`${inputClass} resize-none font-mono text-xs`} />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.published_at !== null} onChange={e => setForm(p => ({ ...p, published_at: e.target.checked ? (p.published_at || new Date().toISOString().split('T')[0]) : null }))} className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
              Publish this post
            </label>
            {form.published_at !== null && (
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">Date:</label>
                <input type="date" value={form.published_at} onChange={e => setForm(p => ({ ...p, published_at: e.target.value }))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: 'var(--admin-accent, #10b981)' }}>
              {saving ? 'Saving...' : 'Save Post'}
            </button>
            <button onClick={onCancel} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
