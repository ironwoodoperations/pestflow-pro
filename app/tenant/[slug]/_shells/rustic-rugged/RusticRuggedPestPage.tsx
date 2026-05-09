import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { PEST_CONTENT_MAP } from '../../../../../src/shells/_shared/pestContent';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

type PageContent = { title?: string; subtitle?: string; intro?: string; hero_headline?: string } | null;
interface Props { tenant: Tenant; pestSlug: string; content?: PageContent }

const SERIF: React.CSSProperties = { fontFamily: "'Source Serif Pro', Georgia, serif" };
const BODY: React.CSSProperties = { fontFamily: "Inter, sans-serif" };

const pickString = (...vals: Array<string | undefined | null>): string | undefined => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return undefined;
};

const Check = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }}>
    <circle cx="12" cy="12" r="11" fill="#2D4A2B" />
    <polyline points="7 12 11 16 17 9" stroke="#F5F0E5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function RusticRuggedPestPage({ tenant, pestSlug, content = null }: Props) {
  const pest = PEST_CONTENT_MAP[pestSlug];
  const phone = tenant.phone ?? '';
  const heroTitle = pickString(content?.hero_headline, content?.title, pest?.displayName) || 'Pest Control';
  const eyebrow = pickString(content?.subtitle) || 'neighbor to neighbor';
  const blurb = pickString(content?.intro, pest?.blurb)
    || `Honest ${pest?.displayName?.toLowerCase() || 'pest'} work, done right the first time.`;

  return (
    <div style={{ backgroundColor: '#F5F0E5', color: '#2D2A24' }}>
      {/* Hero */}
      <section style={{ padding: '4rem 1rem 3rem', borderBottom: '1px solid #E0D7C0' }}>
        <div className="max-w-4xl mx-auto" style={{ textAlign: 'center' }}>
          <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 15, color: '#B85C38', marginBottom: '0.5rem' }}>{eyebrow}</p>
          <h1 style={{ ...SERIF, fontSize: 'clamp(36px,5.5vw,60px)', fontWeight: 600, color: '#2D4A2B', marginBottom: '1rem', lineHeight: 1.15 }}>{heroTitle}</h1>
          <p style={{ ...BODY, fontSize: 17, color: '#5A554A', lineHeight: 1.7, maxWidth: '52ch', margin: '0 auto 1.5rem' }}>{blurb}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            <Link href="/quote" style={{ ...BODY, display: 'inline-block', backgroundColor: '#B85C38', color: '#F5F0E5', fontWeight: 600, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 999, textDecoration: 'none' }}>Get Your Quote</Link>
            {phone && <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ ...BODY, display: 'inline-block', border: '2px solid #2D4A2B', color: '#2D4A2B', fontWeight: 500, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 999, textDecoration: 'none' }}>Call {formatPhone(phone)}</a>}
          </div>
        </div>
      </section>

      {/* Photo card + How we treat it */}
      <section style={{ padding: '3.5rem 1rem' }}>
        <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
          <style>{`@media(min-width:768px){.rr-pest-grid{grid-template-columns:0.9fr 1.1fr !important}}`}</style>
          <div className="rr-pest-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: '1rem', border: '4px solid #fff', boxShadow: '0 6px 20px rgba(45,74,43,0.12)' }}>
              <div style={{ aspectRatio: '4/3', borderRadius: 4, backgroundColor: '#EDE5D2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ ...SERIF, fontSize: 24, fontStyle: 'italic', color: '#2D4A2B' }}>{pest?.displayName || 'Pest'}</span>
              </div>
              <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 13, textAlign: 'center', color: '#5A554A', marginTop: '0.75rem' }}>seasonal pressures, local bugs</p>
            </div>
            <div>
              <p style={{ ...SERIF, fontStyle: 'italic', fontSize: 14, color: '#B85C38', marginBottom: '0.5rem' }}>how we treat it</p>
              <h2 style={{ ...SERIF, fontSize: 'clamp(24px,3vw,34px)', fontWeight: 600, color: '#2D4A2B', marginBottom: '1.25rem', lineHeight: 1.2 }}>The honest approach</h2>
              {pest?.treatment && (
                <p style={{ ...BODY, fontSize: 16, color: '#3D3A33', lineHeight: 1.75, marginBottom: '1.25rem' }}>{pest.treatment}</p>
              )}
              {pest?.signs && pest.signs.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {pest.signs.map((s) => (
                    <li key={s} style={{ ...BODY, fontSize: 14, color: '#3D3A33', display: 'flex', alignItems: 'flex-start', gap: '0.65rem', lineHeight: 1.55 }}><Check />{s}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: '#2D4A2B' }}>
        <h2 style={{ ...SERIF, fontSize: 'clamp(24px,3vw,34px)', fontWeight: 600, color: '#F5F0E5', marginBottom: '1.5rem' }}>{pickString(pest?.cta) || 'Ready for some peace of mind?'}</h2>
        <Link href="/quote" style={{ ...BODY, display: 'inline-block', backgroundColor: '#B85C38', color: '#F5F0E5', fontWeight: 600, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 999, textDecoration: 'none' }}>Get Your Quote</Link>
      </section>
    </div>
  );
}
