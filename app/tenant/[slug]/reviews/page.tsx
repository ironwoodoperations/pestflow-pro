import Link from 'next/link';
import type { Metadata } from 'next';
import { buildPageMetadata } from '../../../../shared/lib/buildPageMetadata';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';

export const revalidate = 300;

// S322 — canonical self-reference. This route had NO generateMetadata, so in the App Router
// it inherited the tenant LAYOUT's metadata, whose canonical is the bare site URL because it
// describes the SITE rather than a page. Every such page told Google it was a duplicate of
// the homepage and would not be indexed separately.
//
// buildPageMetadata was already correct — `pathname && pathname !== '/' ? siteUrl+pathname :
// siteUrl` — it was simply never called here. S276 wired only four route groups ([service],
// blog, blog/[post], home) and the rest were missed.
//
// The pathname is a LITERAL matching this route's own directory, never derived from a request
// header. Host is an untrusted selector, not a URL source (established in S321 PR B).
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) return {};
  const businessName = tenant.business_name || tenant.name;
  // A seo_meta row supplies the TITLE when one exists; the ROUTE supplies the path. A correct
  // canonical needs no row — that is why this is a code fix and not a per-tenant data fix.
  const seoMeta = await getSeoMeta(tenant.id, 'reviews');
  return buildPageMetadata(tenant, {
    pathname: '/reviews',
    seoMeta,
    fallback: {
      title: `Reviews | ${businessName}`,
      description: `Reviews and testimonials for ${businessName}.`,
    },
  });
}


export async function generateStaticParams() {
  return [];
}
import { getTestimonials, getPageContent, getHeroMedia, getSeoMeta } from '../_lib/queries';
import { resolveHeroImage } from '../_lib/heroImage';

// S-PLS-7 / PR 5a: no placeholder reviews — testimonials rows or nothing.
// Invented reviews attributed to review platforms are fabricated social proof.

type Params = { params: { slug: string } };

export default async function ReviewsPage({ params }: Params) {
  const tenant = await resolveTenantBySlug(params.slug);
  if (!tenant) notFound();

  const [rawReviews, content, heroMedia] = await Promise.all([
    getTestimonials(tenant.id),
    getPageContent(tenant.id, 'reviews'),
    getHeroMedia(tenant.id),
  ]);

  const c = content as { title?: string; subtitle?: string } | null;
  const heroTitle = c?.title    || 'What Our Customers Say';
  const heroSub   = c?.subtitle || 'Real reviews from real customers.';
  const heroImageUrl = resolveHeroImage(content, heroMedia);

  type Review = { id: string; author_name: string; review_text: string; rating: number; source?: string | null };
  const reviews: Review[] = rawReviews as Review[];

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

      {/* S-PLS-7 / PR 5a: no aggregate-rating strip — no real aggregate data
          source exists, and an invented one is a fabricated rating. */}

      {reviews.length > 0 && (
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="text-yellow-500 mb-3">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                <p className="text-gray-700 mb-4 italic">&ldquo;{r.review_text}&rdquo;</p>
                <div className="flex justify-between items-center">
                  <p className="font-bold" style={{ color: 'var(--color-heading, #1a1a1a)' }}>— {r.author_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      <section className="py-16" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero, #0a1628) 0%, var(--color-bg-hero-end, var(--color-primary)) 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Love Our Service?</h2>
          <p className="text-lg mb-8 text-white/75">Leave us a review on Google — we appreciate your feedback!</p>
          <Link href="/quote" className="inline-block font-bold rounded-lg px-10 py-4 text-lg transition hover:opacity-90 text-white" style={{ backgroundColor: 'var(--color-accent)' }}>
            Get a Free Quote
          </Link>
        </div>
      </section>

    </div>
  );
}
