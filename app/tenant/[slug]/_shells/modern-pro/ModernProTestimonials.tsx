// S-PLS-7 / PR 5a: DB rows or nothing. The previous hardcoded REVIEWS array
// was three invented customers rendered for every modern-pro tenant — the
// `detail` line ("Verified Customer" etc.) had no DB column behind it and is
// dropped, not replaced.

export interface Testimonial {
  id: string;
  author_name: string;
  review_text: string;
  rating: number;
}

export function ModernProTestimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

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
          {testimonials.slice(0, 3).map((r) => {
            // rating is nullable (default 5) and the table has no CHECK
            // constraint — an out-of-range value must not throw at render.
            const stars = Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0)));
            return (
            <div
              key={r.id}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div className="text-lg mb-3" style={{ color: '#fbbf24' }}>
                {'★'.repeat(stars) + '☆'.repeat(5 - stars)}
              </div>
              <p className="text-sm italic leading-relaxed mb-4" style={{ color: '#ffffff' }}>
                &ldquo;{r.review_text}&rdquo;
              </p>
              <p className="font-semibold" style={{ color: '#ffffff' }}>{r.author_name}</p>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
