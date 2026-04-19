interface Testimonial {
  id: string;
  author_name: string;
  review_text: string;
  rating: number;
  author_image_url?: string | null;
  featured?: boolean;
}

interface Props { testimonials?: Testimonial[] }

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: '0.75rem' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={14} height={14} viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={n <= rating ? 'var(--cf-ochre)' : 'none'} stroke={n <= rating ? 'var(--cf-ochre)' : 'var(--cf-divider)'} strokeWidth="1.5" />
        </svg>
      ))}
    </div>
  );
}

export function CleanFriendlyTestimonials({ testimonials = [] }: Props) {
  if (testimonials.length === 0) return null;

  const sorted = [...testimonials].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 6);

  return (
    <section style={{ backgroundColor: 'var(--cf-bg-sky)', borderBottom: '1px solid var(--cf-divider)', padding: '4rem 1rem' }}>
      <div className="max-w-6xl mx-auto">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: '0.5rem' }}>
            from our neighbors
          </p>
          <h2 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 'clamp(24px,3.5vw,36px)', color: 'var(--cf-ink)', lineHeight: 1.2 }}>
            What families are saying
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
          {sorted.map((t) => (
            <div key={t.id} style={{ backgroundColor: 'var(--cf-surface-card)', border: '1px solid var(--cf-divider)', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(31,58,77,0.06)', display: 'flex', flexDirection: 'column' }}>
              <StarRow rating={t.rating} />
              <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 14, color: 'var(--cf-ink-secondary)', lineHeight: 1.65, flex: 1, marginBottom: '1.25rem' }}>
                &ldquo;{t.review_text}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {t.author_image_url ? (
                  <img src={t.author_image_url} alt={t.author_name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} loading="lazy" />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--cf-bg-sky)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 14, color: 'var(--cf-ink)' }}>{initials(t.author_name)}</span>
                  </div>
                )}
                <div>
                  <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 14, color: 'var(--cf-ink)', margin: 0 }}>{t.author_name}</p>
                  <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 11, color: 'var(--cf-ink-muted)', margin: 0 }}>from our customer</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
