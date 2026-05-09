import Link from 'next/link';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

interface LocItem { slug: string; city: string }
interface Props {
  heroTitle: string;
  heroSub: string;
  locations: LocItem[];
  phone: string;
  businessName: string;
}

const DISPLAY: React.CSSProperties = { fontFamily: "'Barlow Condensed', Inter, sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' };
const BODY: React.CSSProperties = { fontFamily: 'Inter, sans-serif' };

// Quadrant grouping (N/S/E/W) based on string-hash, deterministic and metro-flavored.
function bucket(slug: string): 'N' | 'S' | 'E' | 'W' {
  const sum = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (['N', 'E', 'S', 'W'] as const)[sum % 4];
}

const QUADRANTS: Array<'N' | 'E' | 'S' | 'W'> = ['N', 'E', 'S', 'W'];
const QUAD_LABELS: Record<'N' | 'E' | 'S' | 'W', string> = { N: 'North', E: 'East', S: 'South', W: 'West' };

export function MetroProServiceAreaPage({ heroTitle, heroSub, locations, phone, businessName }: Props) {
  const grouped = QUADRANTS.map((q) => ({ q, items: locations.filter((l) => bucket(l.slug) === q) }));

  return (
    <div style={{ backgroundColor: '#0F172A', color: '#E2E8F0' }}>
      <section style={{ position: 'relative', padding: '5rem 1rem 3rem', borderBottom: '1px solid #14B8A6', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 24px, rgba(20,184,166,0.06) 24px, rgba(20,184,166,0.06) 26px)', pointerEvents: 'none' }} />
        <div className="max-w-5xl mx-auto" style={{ position: 'relative' }}>
          <p style={{ ...BODY, fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#14B8A6', marginBottom: '0.75rem' }}>Coverage Area</p>
          <h1 style={{ ...DISPLAY, fontSize: 'clamp(44px,6vw,72px)', fontWeight: 700, color: '#fff', marginBottom: '1rem', lineHeight: 1.05 }}>{heroTitle}</h1>
          <p style={{ ...BODY, fontSize: 16, color: '#94A3B8', lineHeight: 1.6, maxWidth: '60ch' }}>{heroSub}</p>
        </div>
      </section>

      <section style={{ padding: '3rem 1rem' }}>
        <div className="max-w-6xl mx-auto">
          <p style={{ ...BODY, fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#14B8A6', marginBottom: '0.5rem' }}>Neighborhoods served by quadrant</p>
          <h2 style={{ ...DISPLAY, fontSize: 'clamp(26px,3vw,36px)', fontWeight: 700, color: '#fff', marginBottom: '1.5rem' }}>{businessName} coverage</h2>

          {locations.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 0, border: '1px solid rgba(20,184,166,0.2)' }}>
              {grouped.map(({ q, items }, idx) => (
                <div key={q} style={{ padding: '1.5rem', borderRight: idx < QUADRANTS.length - 1 ? '1px solid rgba(20,184,166,0.15)' : 'none', borderBottom: '1px solid rgba(20,184,166,0.15)', backgroundColor: '#1E293B' }}>
                  <p style={{ ...DISPLAY, fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', color: '#14B8A6', marginBottom: '0.75rem' }}>{q} · {QUAD_LABELS[q]}</p>
                  {items.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {items.map((loc) => (
                        <li key={loc.slug} style={{ borderBottom: '1px dashed rgba(20,184,166,0.15)' }}>
                          <Link href={`/${loc.slug}`} style={{ ...BODY, display: 'block', fontSize: 14, padding: '0.55rem 0', color: '#E2E8F0', textDecoration: 'none' }}>{loc.city}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ ...BODY, fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>— pending</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ ...BODY, fontSize: 14, color: '#94A3B8' }}>Coverage map being assembled — call to confirm your address.</p>
          )}
        </div>
      </section>

      <section style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: '#14B8A6' }}>
        <h2 style={{ ...DISPLAY, fontSize: 'clamp(26px,3vw,36px)', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>Outside the grid?</h2>
        <p style={{ ...BODY, fontSize: 15, color: '#0F172A', marginBottom: '1.25rem' }}>The desk takes inquiries by phone or callback request.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
          {phone && <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ ...DISPLAY, display: 'inline-block', backgroundColor: '#0F172A', color: '#14B8A6', fontWeight: 700, fontSize: 14, padding: '0.95rem 2rem', textDecoration: 'none' }}>Call {formatPhone(phone)}</a>}
          <Link href="/quote" style={{ ...DISPLAY, display: 'inline-block', border: '2px solid #0F172A', color: '#0F172A', fontWeight: 700, fontSize: 14, padding: '0.85rem 2rem', textDecoration: 'none' }}>Book Consultation</Link>
        </div>
      </section>
    </div>
  );
}
