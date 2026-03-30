import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StructuredData from '../components/StructuredData'

interface BlogPost { id: string; title: string; slug: string; excerpt: string; published_at: string }

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
        supabase.from('blog_posts').select('id, title, slug, excerpt, published_at').eq('tenant_id', tenantId).not('published_at', 'is', null).order('published_at', { ascending: false }),
        supabase.from('page_content').select('title, subtitle').eq('tenant_id', tenantId).eq('page_slug', 'blog').maybeSingle(),
      ])
      if (postsRes.data && postsRes.data.length > 0) setPosts(postsRes.data)
      if (contentRes.data?.title) setHeroTitle(contentRes.data.title)
      if (contentRes.data?.subtitle) setHeroSubtitle(contentRes.data.subtitle)
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <StructuredData type="WebPage" pageSlug="blog" />
      <Navbar />

      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-white text-5xl md:text-7xl mb-4">{heroTitle}</h1>
          <p className="text-gray-300 text-xl">{heroSubtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group">
                <div className="bg-[#0a0f1e] h-40 flex items-center justify-center">
                  <span className="text-emerald-400/50 text-sm">Blog Image</span>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-400 mb-2">{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{post.excerpt?.slice(0, 120)}...</p>
                  <span className="text-emerald-500 font-medium text-sm">Read More →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated</h2>
          <p className="text-gray-600 mb-6">Get pest control tips and seasonal alerts delivered to your inbox.</p>
          <div className="flex gap-2">
            <input type="email" placeholder="Your email address" className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-3 transition">Subscribe</button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
