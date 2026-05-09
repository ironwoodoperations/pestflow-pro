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

export function ModernProServiceAreaPage({ heroTitle, heroSub, locations, phone, businessName }: Props) {
  return (
    <div style={{ backgroundColor: '#0B1220', color: '#E5E7EB', fontFamily: 'Inter, sans-serif' }}>
      <section style={{ padding: '5rem 1rem 3rem', borderBottom: '1px solid rgba(63,184,175,0.2)', background: 'linear-gradient(135deg,#1B2A4E,#0B1220)' }}>
        <div className="max-w-5xl mx-auto" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3FB8AF', marginBottom: '0.75rem' }}>Coverage Map</p>
          <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, color: '#fff', marginBottom: '1rem', lineHeight: 1.15 }}>{heroTitle}</h1>
          <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.6, maxWidth: '60ch', margin: '0 auto' }}>{heroSub}</p>
        </div>
      </section>

      <section style={{ padding: '3.5rem 1rem' }}>
        <div className="max-w-6xl mx-auto">
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3FB8AF', marginBottom: '0.5rem' }}>Active service grid</p>
          <h2 style={{ fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 700, color: '#fff', marginBottom: '1.5rem' }}>{businessName} coverage</h2>
          {locations.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '0.75rem' }}>
              {locations.map((loc, i) => (
                <Link key={loc.slug} href={`/${loc.slug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: 'rgba(27,42,78,0.4)', border: '1px solid rgba(63,184,175,0.2)', borderRadius: 8, textDecoration: 'none', color: '#E5E7EB' }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{loc.city}</span>
                  <span style={{ fontSize: 11, fontFamily: "'Roboto Mono',monospace", color: '#3FB8AF', letterSpacing: '0.05em' }}>{String(i + 1).padStart(2, '0')}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', backgroundColor: 'rgba(27,42,78,0.4)', border: '1px solid rgba(63,184,175,0.2)', borderRadius: 8, textAlign: 'center', color: '#94A3B8' }}>Service areas being mapped — call to confirm coverage.</div>
          )}
        </div>
      </section>

      <section style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: '#1B2A4E', borderTop: '1px solid rgba(63,184,175,0.15)' }}>
        <h2 style={{ fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>Off the grid?</h2>
        <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: '1.5rem' }}>Coverage expands monthly. Call to verify.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
          {phone && <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ display: 'inline-block', backgroundColor: '#3FB8AF', color: '#0B1220', fontWeight: 600, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 8, textDecoration: 'none' }}>Call {formatPhone(phone)}</a>}
          <Link href="/quote" style={{ display: 'inline-block', border: '1px solid #3FB8AF', color: '#3FB8AF', fontWeight: 500, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 8, textDecoration: 'none' }}>Request a Quote</Link>
        </div>
      </section>
    </div>
  );
}
