import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { getAllBlogPosts, getPageContent, getHeroMedia } from '../_lib/queries';
import { resolveHeroImage } from '../_lib/heroImage';

const PLACEHOLDER_POSTS = [
  { id: '1', title: '5 Signs You Have a Termite Problem', slug: '5-signs-termite-problem', excerpt: 'Learn the early warning signs of termite damage before it becomes costly.', published_at: '2026-03-15', intro_image: null },
  { id: '2', title: 'How to Prevent Mosquitoes in Your Yard', slug: 'prevent-mosquitoes-yard', excerpt: 'Simple steps to reduce mosquito breeding grounds around your home.', published_at: '2026-03-10', intro_image: null },
  { id: '3', title: 'Are Brown Recluse Spiders in Your Area?', slug: 'brown-recluse-spiders', excerpt: 'Yes — and they are more common than you think. Here is what you need to know.', published_at: '2026-03-05', intro_image: null },
];

type Params = { params: { slug: string } };

export default async function BlogPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [rawPosts, content, heroMedia] = await Promise.all([
    getAllBlogPosts(tenant.id),
    getPageContent(tenant.id, 'blog'),
    getHeroMedia(tenant.id),
  ]);

  const c = content as { title?: string; subtitle?: string } | null;
  const heroTitle = c?.title    || 'Pest Control Blog';
  const heroSub   = c?.subtitle || 'Tips, guides, and news from our pest control experts.';
  const heroImageUrl = resolveHeroImage(content, heroMedia);

  type BlogPost = { id: string; title: string; slug: string; excerpt?: string | null; published_at?: string | null; intro_image?: string | null };
  const posts: BlogPost[] = (rawPosts.length > 0 ? rawPosts : PLACEHOLDER_POSTS) as BlogPost[];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>

      <section className="relative py-20 md:py-28" style={heroImageUrl
        ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
        {heroImageUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0, pointerEvents: 'none' }} />}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">{heroTitle}</h1>
          <p className="text-xl text-white/75">{heroSub}</p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group">
                <div className="h-40 overflow-hidden" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <img
                    src={post.intro_image || '/images/pests/pest_control.jpg'}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  {post.published_at && <p className="text-sm text-gray-400 mb-2">{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                  <h3 className="text-lg font-bold mb-2 group-hover:opacity-70 transition" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{post.title}</h3>
                  {post.excerpt && <p className="text-gray-600 text-sm mb-3">{post.excerpt.slice(0, 120)}…</p>}
                  <span className="font-medium text-sm" style={{ color: 'var(--color-primary)' }}>Read More →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-heading, #1a1a1a)' }}>Stay Updated</h2>
          <p className="text-gray-600 mb-6">Get pest control tips and seasonal alerts delivered to your inbox.</p>
          <div className="flex gap-2">
            <input type="email" placeholder="Your email address" className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none" />
            <button className="font-bold rounded-lg px-6 py-3 transition hover:opacity-90 text-white" style={{ backgroundColor: 'var(--color-primary)' }}>Subscribe</button>
          </div>
        </div>
      </section>

    </div>
  );
}
