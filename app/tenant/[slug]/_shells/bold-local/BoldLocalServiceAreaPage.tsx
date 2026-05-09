import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface Loc { slug: string; city: string }

interface Props {
  heroTitle: string;
  heroSub: string;
  locations: Loc[];
  phone: string;
  businessName: string;
}

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--bl-font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 'var(--bl-letter-spacing-wide)',
  textTransform: 'uppercase',
  color: 'var(--bl-accent)',
};

const HEAD: React.CSSProperties = {
  fontFamily: 'var(--bl-font-display)',
  fontWeight: 700,
  letterSpacing: 'var(--bl-letter-spacing-tight)',
  color: 'var(--bl-text)',
  textTransform: 'uppercase',
  lineHeight: 'var(--bl-line-height-tight)',
};

export function BoldLocalServiceAreaPage({ heroTitle, heroSub, locations, phone, businessName }: Props) {
  return (
    <div style={{ backgroundColor: 'var(--bl-surface)' }}>

      {/* Stark hero with map-pin */}
      <section style={{ backgroundColor: 'var(--bl-surface)', borderBottom: '2px solid var(--bl-accent)', padding: 'var(--bl-space-2xl) 1rem' }}>
        <div className="max-w-5xl mx-auto" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--bl-space-sm)', marginBottom: 'var(--bl-space-md)' }}>
            <MapPin className="w-5 h-5" style={{ color: 'var(--bl-accent)' }} />
            <p style={{ ...EYEBROW, fontSize: 13 }}>Coverage Zone</p>
          </div>
          <h1 style={{ ...HEAD, fontSize: 'clamp(40px,7vw,80px)', marginBottom: 'var(--bl-space-md)' }}>
            {heroTitle}
          </h1>
          <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 17, color: 'var(--bl-text-secondary)', lineHeight: 'var(--bl-line-height-loose)', maxWidth: '60ch', margin: '0 auto' }}>
            {heroSub}
          </p>
        </div>
      </section>

      {/* Strike teams strip */}
      <section style={{ backgroundColor: 'var(--bl-accent)', padding: 'var(--bl-space-md) 1rem', textAlign: 'center' }}>
        <p style={{ ...HEAD, fontSize: 'clamp(16px,2.2vw,22px)', color: 'var(--bl-surface)', letterSpacing: 'var(--bl-letter-spacing-wide)' }}>
          Same-day strike teams in every city we cover
        </p>
      </section>

      {/* City rows */}
      <section style={{ padding: 'var(--bl-space-xl) 0' }}>
        <div className="max-w-5xl mx-auto" style={{ padding: '0 1rem' }}>
          <p style={{ ...EYEBROW, marginBottom: 'var(--bl-space-sm)' }}>Cities we hit</p>
          <h2 style={{ ...HEAD, fontSize: 'clamp(28px,4vw,44px)', marginBottom: 'var(--bl-space-lg)' }}>Coverage roster</h2>
          {locations.length > 0 ? (
            <div style={{ borderTop: '1px solid var(--bl-border)' }}>
              {locations.map((loc) => (
                <Link key={loc.slug} href={`/${loc.slug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--bl-space-md)', padding: 'var(--bl-space-md) var(--bl-space-md)', borderBottom: '1px solid var(--bl-border)', textDecoration: 'none', backgroundColor: 'var(--bl-surface)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--bl-space-md)' }}>
                    <MapPin className="w-5 h-5" style={{ color: 'var(--bl-accent)' }} />
                    <span style={{ ...HEAD, fontSize: 22 }}>{loc.city}</span>
                  </span>
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--bl-accent)' }} />
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 15, color: 'var(--bl-text-secondary)' }}>Call us to confirm coverage in your area.</p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section style={{ backgroundColor: 'var(--bl-surface-2)', borderTop: '2px solid var(--bl-accent)', borderBottom: '2px solid var(--bl-accent)' }}>
        <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            { num: locations.length > 0 ? `${locations.length}` : '—', label: 'Cities' },
            { num: '60min', label: 'Avg response' },
            { num: '24/7', label: 'Dispatch line' },
          ].map((c, i) => (
            <div key={c.label} style={{ padding: 'var(--bl-space-lg) var(--bl-space-md)', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--bl-border)' : 'none' }}>
              <div style={{ ...HEAD, fontSize: 'clamp(28px,4.5vw,48px)', color: 'var(--bl-accent)' }}>{c.num}</div>
              <div style={{ ...EYEBROW, color: 'var(--bl-text-muted)', marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: 'var(--bl-surface)', padding: 'var(--bl-space-2xl) 1rem', textAlign: 'center' }}>
        <h2 style={{ ...HEAD, fontSize: 'clamp(28px,4.5vw,44px)', marginBottom: 'var(--bl-space-md)' }}>
          Don&apos;t see your city?
        </h2>
        <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 16, color: 'var(--bl-text-secondary)', marginBottom: 'var(--bl-space-lg)', lineHeight: 'var(--bl-line-height-loose)' }}>
          {businessName ? `${businessName} covers` : 'We cover'} most of the metro. Call us — chances are we hit your area too.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--bl-space-sm)', justifyContent: 'center' }}>
          {phone && (
            <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', backgroundColor: 'var(--bl-accent)', color: 'var(--bl-surface)', ...HEAD, fontSize: 17, letterSpacing: 'var(--bl-letter-spacing-wide)', padding: '1rem 2rem', textDecoration: 'none' }}>
              Call {formatPhone(phone)}
            </a>
          )}
          <Link href="/quote" style={{ display: 'inline-block', border: '2px solid var(--bl-accent)', color: 'var(--bl-text)', fontFamily: 'var(--bl-font-body)', fontWeight: 600, fontSize: 16, padding: '1rem 2rem', textDecoration: 'none' }}>
            Get a Free Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
