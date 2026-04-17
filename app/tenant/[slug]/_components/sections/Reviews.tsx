import { Star } from 'lucide-react';

interface Testimonial { id: string; name: string; review_text: string; rating?: number }

const STATIC_REVIEWS: Testimonial[] = [
  { id: '1', name: 'Michael T.', review_text: "Exceptional service from start to finish. The technician was on time, professional, and explained everything he was doing. We haven't seen a single pest since the treatment.", rating: 5 },
  { id: '2', name: 'Sarah K.', review_text: 'I was dealing with a serious termite issue and they handled it quickly and efficiently. The pricing was fair and transparent, no hidden fees. Highly recommend!', rating: 5 },
  { id: '3', name: 'David R.', review_text: 'Great experience with their quarterly service plan. They always call before arriving, are respectful of the property, and address any concerns between visits at no extra charge.', rating: 5 },
];

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

export function Reviews({ testimonials }: { testimonials?: Testimonial[] }) {
  const reviews = (testimonials?.length ? testimonials.slice(0, 3) : STATIC_REVIEWS) as Testimonial[];

  return (
    <section className="py-16" style={{ backgroundColor: '#f1f3f5' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="text-5xl font-bold" style={{ color: 'var(--color-heading)' }}>4.8</span>
            <div>
              <div className="flex gap-0.5 mb-1">{[1,2,3,4,5].map((i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}</div>
              <p className="text-sm text-gray-500">Based on 200+ reviews</p>
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--color-accent)' }}>What Our Customers Say</p>
          <h2 className="text-3xl font-bold mt-1" style={{ color: 'var(--color-heading)' }}>Trusted by Homeowners &amp; Businesses</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: 'var(--color-primary)' }}>
                  {r.name?.[0] || 'A'}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>{r.name}</p>
                  <p className="text-xs text-gray-400">on Google</p>
                </div>
              </div>
              <StarRow count={r.rating ?? 5} />
              <p className="text-gray-600 text-sm mt-3 leading-relaxed">{r.review_text}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">⭐ Powered by Google Reviews</p>
      </div>
    </section>
  );
}
