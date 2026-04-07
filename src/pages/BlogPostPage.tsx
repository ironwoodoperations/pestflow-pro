import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

interface Post { title: string; content: string; published_at: string; intro_image?: string }

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!slug) { if (!cancelled) setLoading(false); return }
      const tenantId = await resolveTenantId()
      if (!tenantId) { if (!cancelled) setLoading(false); return }
      const { data } = await supabase.from('blog_posts').select('title, content, published_at, intro_image').eq('tenant_id', tenantId).eq('slug', slug).maybeSingle()
      if (!cancelled) { if (data) setPost(data); setLoading(false) }
    }
    run()
    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} /></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-heading)' }}>Post Not Found</h1>
          <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
          <Link to="/blog" className="font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>← Back to Blog</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <div className="w-full h-64 md:h-96 overflow-hidden" style={{ backgroundColor: 'var(--color-bg-cta)' }}>
        <img
          src={post.intro_image || '/images/pests/pest_control.jpg'}
          alt={post.title}
          className="w-full h-full object-cover opacity-80"
        />
      </div>
      <article className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/blog" className="font-medium hover:underline text-sm mb-6 block" style={{ color: 'var(--color-primary)' }}>← Back to Blog</Link>
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-heading)' }}>{post.title}</h1>
        {post.published_at && <p className="text-gray-400 text-sm mb-8">{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
        <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: post.content || '' }} />
      </article>
    </div>
  )
}
