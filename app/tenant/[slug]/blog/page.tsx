import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';
import { buildPageMetadata } from '../../../../shared/lib/buildPageMetadata';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
import { getAllBlogPosts, getPageContent, getHeroMedia, getSeoMeta } from '../_lib/queries';
import { resolveHeroImage } from '../_lib/heroImage';
import { resolveVertical } from '../../../../shared/lib/verticals';
import { getVerticalCopy } from '../../../../src/shells/_shared/verticalCopy';


type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) return {};
  const businessName = tenant.business_name || tenant.name;
  const seoMeta = await getSeoMeta(tenant.id, 'blog');
  return buildPageMetadata(tenant, {
    pathname: '/blog',
    seoMeta,
    fallback: {
      title: businessName,
      description: `${businessName} — ${getVerticalCopy(resolveVertical(tenant)).metadataFallbackDesc}`,
    },
  });
}

export default async function BlogPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [rawPosts, content, heroMedia] = await Promise.all([
    getAllBlogPosts(tenant.id),
    getPageContent(tenant.id, 'blog'),
    getHeroMedia(tenant.id),
  ]);

  const copy = getVerticalCopy(resolveVertical(tenant));
  const c = content as { title?: string; subtitle?: string } | null;
  const heroTitle = c?.title    || copy.blogHeading;
  const heroSub   = c?.subtitle || copy.blogSubtitle;
  const heroImageUrl = resolveHeroImage(content, heroMedia);

  type BlogPost = { id: string; title: string; slug: string; excerpt?: string | null; published_at?: string | null; intro_image?: string | null };
  // PR C: the placeholder array is DELETED, not swapped for a per-vertical one.
  // Three dated articles were being attributed to every tenant with an empty
  // blog_posts table — invented content on a real client's site. A tenant with
  // no posts now gets an honest empty state; nothing is fabricated to fill it.
  const posts: BlogPost[] = rawPosts as BlogPost[];

  // S267: dark cards/inputs gated to bold-local; Dang and other light themes
  // keep their exact white cards + gray text.
  const isBoldLocal = tenant.template === 'bold-local';

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
          {posts.length === 0 ? (
            <p className={`text-center ${isBoldLocal ? '' : 'text-gray-600'}`} style={isBoldLocal ? { color: 'var(--color-body-text)' } : undefined}>
              No posts published yet. Check back soon.
            </p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => {
              const cardImage = post.intro_image || copy.blogCardFallbackImage;
              return (
              <Link key={post.id} href={`/blog/${post.slug}`} className={`rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition group ${isBoldLocal ? 'border-[#2A3038]' : 'bg-white border-gray-200'}`} style={isBoldLocal ? { backgroundColor: 'var(--color-bg-cta)' } : undefined}>
                {cardImage && (
                  <div className="h-40 overflow-hidden" style={{ backgroundColor: 'var(--color-primary)' }}>
                    <img
                      src={cardImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
                  {post.published_at && <p className={`text-sm mb-2 ${isBoldLocal ? '' : 'text-gray-400'}`} style={isBoldLocal ? { color: '#9AA3AD' } : undefined}>{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                  <h3 className="text-lg font-bold mb-2 group-hover:opacity-70 transition" style={{ color: 'var(--color-heading, #1a1a1a)' }}>{post.title}</h3>
                  {post.excerpt && <p className={`text-sm mb-3 ${isBoldLocal ? '' : 'text-gray-600'}`} style={isBoldLocal ? { color: 'var(--color-body-text)' } : undefined}>{post.excerpt.slice(0, 120)}…</p>}
                  <span className="font-medium text-sm" style={{ color: 'var(--color-primary)' }}>Read More →</span>
                </div>
              </Link>
              );
            })}
          </div>
          )}
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: isBoldLocal ? 'var(--color-bg-cta)' : '#ffffff' }}>
        <div className="max-w-lg mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-heading, #1a1a1a)' }}>Stay Updated</h2>
          <p className={`mb-6 ${isBoldLocal ? '' : 'text-gray-600'}`} style={isBoldLocal ? { color: 'var(--color-body-text)' } : undefined}>{copy.blogNewsletterCopy}</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Your email address"
              className={`flex-1 border rounded-lg px-4 py-3 focus:outline-none ${isBoldLocal ? 'border-[#2A3038] text-white placeholder:text-[#9AA3AD]' : 'border-gray-300 text-gray-900'}`}
              style={isBoldLocal ? { backgroundColor: 'var(--color-primary-light)' } : undefined}
            />
            <button className="font-bold rounded-lg px-6 py-3 transition hover:opacity-90 text-white" style={{ backgroundColor: 'var(--color-primary)' }}>Subscribe</button>
          </div>
        </div>
      </section>

    </div>
  );
}
