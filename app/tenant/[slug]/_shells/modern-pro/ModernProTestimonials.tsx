// S-PLS-7 / PR 5a: DB-driven only. The previous hardcoded REVIEWS array was
// three invented customers ("Sarah M.", "James R.", "Linda K.") rendered for
// every modern-pro tenant with no testimonials rows — fabricated social proof.
// Now: real rows or nothing. When the tenant has no testimonials, the section
// does not render — no placeholder people, no invented ratings.

export interface ModernProTestimonial {
  id: string;
  author_name: string;
  review_text: string;
  rating?: number | null;
  source?: string | null;
}

interface Props {
  testimonials: ModernProTestimonial[];
}

export function ModernProTestimonials({ testimonials }: Props) {
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section style={{ background: 'var(--color-bg-cta)' }} className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#ffffff' }}>
            TESTIMONIALS
          </p>
          <h2 className="text-3xl font-bold" style={{ color: '#ffffff' }}>
            What Our Customers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((r) => (
            <div
              key={r.id}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {typeof r.rating === 'number' && r.rating > 0 && (
                <div className="text-lg mb-3" style={{ color: '#fbbf24' }}>
                  {'★'.repeat(Math.min(r.rating, 5))}{'☆'.repeat(Math.max(0, 5 - r.rating))}
                </div>
              )}
              <p className="text-sm italic leading-relaxed mb-4" style={{ color: '#ffffff' }}>
                &ldquo;{r.review_text}&rdquo;
              </p>
              <p className="font-semibold" style={{ color: '#ffffff' }}>{r.author_name}</p>
              {r.source && (
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{r.source}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
