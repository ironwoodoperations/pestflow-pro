import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import StructuredData from '../components/StructuredData'

interface BlogPost { id: string; title: string; slug: string; excerpt: string; published_at: string; intro_image?: string }

const PLACEHOLDER_POSTS: BlogPost[] = [
  { id: '1', title: '5 Signs You Have a Termite Problem', slug: '5-signs-termite-problem', excerpt: 'Learn the early warning signs of termite damage before it becomes costly...', published_at: '2026-03-15' },
  { id: '2', title: 'How to Prevent Mosquitoes in Your Yard', slug: 'prevent-mosquitoes-yard', excerpt: 'Simple steps to reduce mosquito breeding grounds around your East Texas home...', published_at: '2026-03-10' },
  { id: '3', title: 'Are Brown Recluse Spiders in East Texas?', slug: 'brown-recluse-east-texas', excerpt: 'Yes — and they are more common than you think. Here is what you need to know...', published_at: '2026-03-05' },
]

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(PLACEHOLDER_POSTS)
  const [heroTitle, setHeroTitle] = useState('Pest Control Blog')
  const [heroSubtitle, setHeroSubtitle] = useState('Tips, guides, and news from our East Texas pest control experts.')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [postsRes, contentRes] = await Promise.all([
        supabase.from('blog_posts').select('id, title, slug, excerpt, published_at, intro_image').eq('tenant_id', tenantId).not('published_at', 'is', null).order('published_at', { ascending: false }),
        supabase.from('page_content').select('title, subtitle').eq('tenant_id', tenantId).eq('page_slug', 'blog').maybeSingle(),
      ])
      if (postsRes.data && postsRes.data.length > 0) setPosts(postsRes.data)
      if (contentRes.data?.title) setHeroTitle(contentRes.data.title)
      if (contentRes.data?.subtitle) setHeroSubtitle(contentRes.data.subtitle)
    })
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <StructuredData type="WebPage" pageSlug="blog" />

      <section className="py-20 md:py-28" style={{ background: 'var(--color-bg-hero)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-5xl md:text-7xl mb-4" style={{ color: 'var(--color-nav-text)' }}>{heroTitle}</h1>
          <p className="text-xl" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>{heroSubtitle}</p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group">
                <div className="h-40 overflow-hidden" style={{ backgroundColor: 'var(--color-bg-cta)' }}>
                  <img
                    src={post.intro_image || '/images/pests/pest_control.jpg'}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-400 mb-2">{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:opacity-70 transition" style={{ color: 'var(--color-heading)' }}>{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{post.excerpt?.slice(0, 120)}...</p>
                  <span className="font-medium text-sm" style={{ color: 'var(--color-primary)' }}>Read More →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-heading)' }}>Stay Updated</h2>
          <p className="text-gray-600 mb-6">Get pest control tips and seasonal alerts delivered to your inbox.</p>
          <div className="flex gap-2">
            <input type="email" placeholder="Your email address" className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none" style={{ outline: 'none' }} />
            <button className="font-bold rounded-lg px-6 py-3 transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Subscribe</button>
          </div>
        </div>
      </section>

    </div>
  )
}
