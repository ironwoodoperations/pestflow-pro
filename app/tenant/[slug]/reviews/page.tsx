import Link from 'next/link';
import { Star } from 'lucide-react';
import { notFound } from 'next/navigation';
import { resolveTenantBySlug } from '../../../../shared/lib/tenant/resolve';

export async function generateStaticParams() {
  return [];
}
import { getTestimonials, getPageContent, getHeroMedia } from '../_lib/queries';
import { resolveHeroImage } from '../_lib/heroImage';

const PLACEHOLDER_REVIEWS = [
  { id: '1', author_name: 'Sarah M.', review_text: 'They showed up same day and solved our ant problem completely. Best pest company around!', rating: 5, source: 'Google' },
  { id: '2', author_name: 'James R.', review_text: 'Professional, on time, and effective. Our mosquito problem is gone. Highly recommend!', rating: 5, source: 'Google' },
  { id: '3', author_name: 'Linda K.', review_text: 'We had a serious roach issue and they knocked it out in one treatment. Amazing service.', rating: 5, source: 'Google' },
  { id: '4', author_name: 'Mike T.', review_text: 'Great experience from start to finish. Technician was knowledgeable and thorough. No more spiders!', rating: 5, source: 'Facebook' },
  { id: '5', author_name: 'Jennifer W.', review_text: "Affordable, effective, and friendly. They treat my home quarterly and I haven't seen a single pest.", rating: 5, source: 'Google' },
  { id: '6', author_name: 'David L.', review_text: 'Found scorpions in our new home. They came out the next day and solved it. Excellent service!', rating: 5, source: 'Yelp' },
];

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
  const reviews: Review[] = (rawReviews.length > 0 ? rawReviews : PLACEHOLDER_REVIEWS) as Review[];

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

      <section className="py-6" style={{ backgroundColor: 'var(--color-bg-cta, #0a1628)' }}>
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-center">
          <div><span className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>4.9</span> <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 inline" /><span className="text-sm ml-1 text-white/65">Google Rating</span></div>
          <div><span className="text-2xl font-bold text-white">200+</span><span className="text-sm ml-2 text-white/65">Reviews</span></div>
          <div><span className="text-2xl font-bold text-white">#1</span><span className="text-sm ml-2 text-white/65">Most Trusted</span></div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="text-yellow-500 mb-3">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                <p className="text-gray-700 mb-4 italic">&ldquo;{r.review_text}&rdquo;</p>
                <div className="flex justify-between items-center">
                  <p className="font-bold" style={{ color: 'var(--color-heading, #1a1a1a)' }}>— {r.author_name}</p>
                  {r.source && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">{r.source}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
