import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface Post { title: string; content: string; published_at: string }

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) { setLoading(false); return }
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) { setLoading(false); return }
      const { data } = await supabase.from('blog_posts').select('title, content, published_at').eq('tenant_id', tenantId).eq('slug', slug).maybeSingle()
      if (data) setPost(data)
      setLoading(false)
    })
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        <Footer />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
          <Link to="/blog" className="text-emerald-500 font-bold hover:underline">← Back to Blog</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <article className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/blog" className="text-emerald-500 font-medium hover:underline text-sm mb-6 block">← Back to Blog</Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        {post.published_at && <p className="text-gray-400 text-sm mb-8">{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
        <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: post.content || '' }} />
      </article>
      <Footer />
    </div>
  )
}
