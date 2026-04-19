interface Testimonial {
  id: string;
  author_name: string;
  review_text: string;
  rating: number;
  author_image_url?: string | null;
  featured?: boolean;
}

interface Props {
  testimonials: Testimonial[];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'flex', gap: 2, marginBottom: '0.75rem' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 16 16" width={14} height={14} aria-hidden="true">
          <polygon
            points="8,1 10.2,5.5 15,6.2 11.5,9.6 12.4,14.4 8,12 3.6,14.4 4.5,9.6 1,6.2 5.8,5.5"
            fill={n <= rating ? 'var(--bl-accent)' : 'var(--bl-border)'}
            stroke={n <= rating ? 'var(--bl-accent)' : 'var(--bl-border)'}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </span>
  );
}

function Portrait({ t }: { t: Testimonial }) {
  const firstName = t.author_name.split(' ')[0];
  if (t.author_image_url) {
    return (
      <img
        src={t.author_image_url}
        alt={firstName}
        style={{ width: 48, height: 48, objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{ width: 48, height: 48, backgroundColor: 'var(--bl-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontWeight: 700, fontSize: 16, color: '#0F1216' }}>
        {initials(t.author_name)}
      </span>
    </div>
  );
}

export function BoldLocalTestimonials({ testimonials }: Props) {
  if (testimonials.length === 0) return null;

  const sorted = [...testimonials]
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 6);

  return (
    <section style={{ backgroundColor: 'var(--bl-surface)', borderBottom: '1px solid var(--bl-border)', padding: '4rem 1rem' }}>
      <div className="max-w-6xl mx-auto">
        <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginBottom: '0.5rem' }}>
          Customer reviews
        </p>
        <h2 style={{ fontFamily: "var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)", fontSize: 'clamp(26px,4vw,42px)', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--bl-text)', marginBottom: '2rem', lineHeight: 1.1 }}>
          What our customers say
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1px', backgroundColor: 'var(--bl-border)' }}>
          {sorted.map((t) => (
            <div key={t.id} style={{ backgroundColor: 'var(--bl-surface-2)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <Stars rating={t.rating} />
              <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 15, fontWeight: 400, color: 'var(--bl-text-secondary)', lineHeight: 1.55, flexGrow: 1, marginBottom: '1.25rem' }}>
                &ldquo;{t.review_text.slice(0, 200)}{t.review_text.length > 200 ? '…' : ''}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Portrait t={t} />
                <span style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, color: 'var(--bl-text-muted)', fontWeight: 500 }}>
                  {t.author_name.split(' ')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
