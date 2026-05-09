import Link from 'next/link';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface Loc { slug: string; city: string }

interface Props {
  heroTitle: string;
  heroSub: string;
  locations: Loc[];
  phone: string;
  businessName: string;
}

const SERIF: React.CSSProperties = { fontFamily: 'var(--cf-font-display)', fontStyle: 'italic' };
const BODY: React.CSSProperties = { fontFamily: 'var(--cf-font-body)' };

export function CleanFriendlyServiceAreaPage({ heroTitle, heroSub, locations, phone, businessName }: Props) {
  return (
    <div style={{ backgroundColor: 'var(--cf-surface)' }}>

      {/* Soft sky-tinted hero */}
      <section style={{ background: 'linear-gradient(180deg, var(--cf-bg-sky) 0%, var(--cf-surface) 100%)', borderBottom: '1px solid var(--cf-divider)', padding: 'var(--cf-space-3xl) 1rem var(--cf-space-2xl)', textAlign: 'center' }}>
        <div className="max-w-3xl mx-auto">
          <p style={{ ...SERIF, fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: 'var(--cf-space-sm)' }}>serving local families</p>
          <h1 style={{ ...BODY, fontWeight: 500, fontSize: 'clamp(36px,6vw,60px)', color: 'var(--cf-ink)', marginBottom: 'var(--cf-space-md)', lineHeight: 'var(--cf-line-height-tight)' }}>
            {heroTitle}
          </h1>
          <p style={{ ...BODY, fontSize: 17, color: 'var(--cf-ink-secondary)', lineHeight: 'var(--cf-line-height-loose)' }}>
            {heroSub}
          </p>
        </div>
      </section>

      {/* City cards (3-col, soft) */}
      <section style={{ padding: 'var(--cf-space-2xl) 1rem' }}>
        <div className="max-w-5xl mx-auto">
          <p style={{ ...SERIF, fontSize: 13, color: 'var(--cf-ink-secondary)', marginBottom: 'var(--cf-space-sm)', textAlign: 'center' }}>communities we serve</p>
          <h2 style={{ ...BODY, fontWeight: 500, fontSize: 'clamp(22px,3vw,32px)', color: 'var(--cf-ink)', textAlign: 'center', marginBottom: 'var(--cf-space-xl)', lineHeight: 'var(--cf-line-height-tight)' }}>
            Our service area
          </h2>
          {locations.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 'var(--cf-space-md)' }}>
              {locations.map((loc) => (
                <Link key={loc.slug} href={`/${loc.slug}`} style={{ display: 'block', backgroundColor: 'var(--cf-surface-card)', border: '1px solid var(--cf-divider)', borderRadius: 'var(--cf-radius-md)', padding: 'var(--cf-space-lg)', textDecoration: 'none', boxShadow: 'var(--cf-shadow-sm)', transition: 'box-shadow var(--cf-transition-normal), transform var(--cf-transition-normal)' }}>
                  <p style={{ ...SERIF, fontSize: 13, color: 'var(--cf-mint)', marginBottom: 'var(--cf-space-xs)' }}>visiting nearby</p>
                  <h3 style={{ ...SERIF, fontSize: 22, color: 'var(--cf-ink)', lineHeight: 'var(--cf-line-height-tight)' }}>{loc.city}</h3>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ ...BODY, fontSize: 15, color: 'var(--cf-ink-secondary)', textAlign: 'center' }}>Serving your area? Give us a call.</p>
          )}
        </div>
      </section>

      {/* Photo placeholder strip */}
      <section style={{ backgroundColor: 'var(--cf-bg-mint)', borderTop: '1px solid var(--cf-divider)', borderBottom: '1px solid var(--cf-divider)', padding: 'var(--cf-space-2xl) 1rem' }}>
        <div className="max-w-3xl mx-auto" style={{ textAlign: 'center' }}>
          <p style={{ ...SERIF, fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: 'var(--cf-space-sm)' }}>your neighbors, our customers</p>
          <h2 style={{ ...BODY, fontWeight: 500, fontSize: 'clamp(22px,3vw,32px)', color: 'var(--cf-ink)', marginBottom: 'var(--cf-space-md)', lineHeight: 'var(--cf-line-height-tight)' }}>
            {businessName ? `${businessName} is here for you` : 'A local team you can count on'}
          </h2>
          <p style={{ ...BODY, fontSize: 16, color: 'var(--cf-ink-secondary)', lineHeight: 'var(--cf-line-height-loose)' }}>
            Whichever community you call home, we&apos;ll be there — same-day service, family-safe treatments, and a guarantee on every job.
          </p>
        </div>
      </section>

      {/* Soft CTA */}
      <section style={{ backgroundColor: 'var(--cf-bg-cream)', padding: 'var(--cf-space-2xl) 1.5rem', textAlign: 'center' }}>
        <div className="max-w-2xl mx-auto">
          <p style={{ ...SERIF, fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: 'var(--cf-space-sm)' }}>need something nearby?</p>
          <h2 style={{ ...BODY, fontWeight: 500, fontSize: 'clamp(22px,3vw,32px)', color: 'var(--cf-ink)', marginBottom: 'var(--cf-space-sm)', lineHeight: 'var(--cf-line-height-tight)' }}>
            Don&apos;t see your city?
          </h2>
          <p style={{ ...BODY, fontSize: 16, color: 'var(--cf-ink-secondary)', marginBottom: 'var(--cf-space-lg)', lineHeight: 'var(--cf-line-height-loose)' }}>
            We may still serve your area — give us a call to find out.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--cf-space-sm)', justifyContent: 'center' }}>
            <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--cf-ink)', color: 'var(--cf-surface)', ...BODY, fontWeight: 500, fontSize: 16, padding: '0.85rem 2rem', borderRadius: 'var(--cf-radius-pill)', textDecoration: 'none' }}>
              Get a free quote
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', border: '1px solid var(--cf-ink)', color: 'var(--cf-ink)', ...BODY, fontWeight: 500, fontSize: 16, padding: '0.85rem 2rem', borderRadius: 'var(--cf-radius-pill)', textDecoration: 'none' }}>
                {formatPhone(phone)}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
