import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { PEST_CONTENT_MAP } from '../../../../../src/shells/_shared/pestContent';

type PageContent = { title?: string; subtitle?: string; intro?: string; hero_headline?: string } | null;
interface Props { tenant: Tenant; pestSlug: string; content?: PageContent }

const DISPLAY: React.CSSProperties = { fontFamily: "'Barlow Condensed', Inter, sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' };
const BODY: React.CSSProperties = { fontFamily: 'Inter, sans-serif' };
const DIVIDER: React.CSSProperties = { ...DISPLAY, fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', color: '#14B8A6', textAlign: 'left', borderBottom: '1px solid #14B8A6', paddingBottom: '0.5rem', marginBottom: '1rem' };

const pickString = (...vals: Array<string | undefined | null>): string | undefined => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return undefined;
};

export function MetroProPestPage({ tenant, pestSlug, content = null }: Props) {
  const pest = PEST_CONTENT_MAP[pestSlug];
  const phone = tenant.phone ?? '';
  const heroTitle = pickString(content?.hero_headline, content?.title, pest?.displayName) || 'Pest Control';
  const eyebrow = pickString(content?.subtitle) || 'Service Spec';
  const blurb = pickString(content?.intro, pest?.blurb)
    || `Documented ${pest?.displayName?.toLowerCase() || 'pest'} elimination — formal procedure, sample report on request.`;

  return (
    <div style={{ backgroundColor: '#0F172A', color: '#E2E8F0' }}>
      {/* Hero */}
      <section style={{ position: 'relative', padding: '4.5rem 1rem 3rem', borderBottom: '1px solid #14B8A6', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 24px, rgba(20,184,166,0.06) 24px, rgba(20,184,166,0.06) 26px)', pointerEvents: 'none' }} />
        <div className="max-w-5xl mx-auto" style={{ position: 'relative' }}>
          <p style={{ ...BODY, fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#14B8A6', marginBottom: '0.75rem' }}>{eyebrow}</p>
          <h1 style={{ ...DISPLAY, fontSize: 'clamp(40px,5.5vw,68px)', fontWeight: 700, color: '#fff', marginBottom: '1rem', lineHeight: 1.05 }}>{heroTitle}</h1>
          <p style={{ ...BODY, fontSize: 16, color: '#94A3B8', lineHeight: 1.6, maxWidth: '60ch', marginBottom: '1.75rem' }}>{blurb}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Link href="/quote" style={{ ...DISPLAY, display: 'inline-block', backgroundColor: '#14B8A6', color: '#0F172A', fontWeight: 700, fontSize: 14, padding: '0.95rem 2rem', textDecoration: 'none' }}>Book Consultation</Link>
            {phone && <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ ...DISPLAY, display: 'inline-block', border: '2px solid #14B8A6', color: '#14B8A6', fontWeight: 700, fontSize: 14, padding: '0.85rem 2rem', textDecoration: 'none' }}>Call</a>}
          </div>
        </div>
      </section>

      {/* Defined Procedure */}
      <section style={{ padding: '3.5rem 1rem' }}>
        <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
          <style>{`@media(min-width:768px){.mtp-spec-grid{grid-template-columns:1fr 1fr !important}}`}</style>
          <div className="mtp-spec-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
            {pest?.signs && pest.signs.length > 0 && (
              <div>
                <p style={DIVIDER}>Indicators</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: "'Roboto Mono', monospace" }}>
                  {pest.signs.map((s, i) => (
                    <li key={s} style={{ fontSize: 13, color: '#CBD5E1', padding: '0.45rem 0', borderBottom: '1px dashed rgba(20,184,166,0.18)', display: 'flex', gap: '0.75rem' }}>
                      <span style={{ color: '#14B8A6', fontWeight: 700, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pest?.treatment && (
              <div>
                <p style={DIVIDER}>Procedure</p>
                <p style={{ ...BODY, fontSize: 14, color: '#CBD5E1', lineHeight: 1.7 }}>{pest.treatment}</p>
                <p style={{ ...BODY, fontSize: 12, color: '#64748B', marginTop: '1rem', fontStyle: 'italic' }}>Sample written report available on request.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Spec strip */}
      <section style={{ borderTop: '1px solid rgba(20,184,166,0.2)', borderBottom: '1px solid rgba(20,184,166,0.2)', backgroundColor: '#1E293B' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          {[
            { label: 'Coverage', value: 'Residential & Commercial' },
            { label: 'Response', value: 'Same-day available' },
            { label: 'Documentation', value: 'Service report each visit' },
          ].map((cell, i) => (
            <div key={cell.label} style={{ padding: '1.25rem', borderRight: i < 2 ? '1px solid rgba(20,184,166,0.15)' : 'none' }}>
              <p style={{ ...BODY, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#14B8A6', marginBottom: '0.4rem' }}>{cell.label}</p>
              <p style={{ ...BODY, fontSize: 13, color: '#CBD5E1' }}>{cell.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: '#14B8A6' }}>
        <h2 style={{ ...DISPLAY, fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, color: '#0F172A', marginBottom: '1.25rem', lineHeight: 1.1 }}>{pickString(pest?.cta) || 'Book Consultation'}</h2>
        <Link href="/quote" style={{ ...DISPLAY, display: 'inline-block', backgroundColor: '#0F172A', color: '#14B8A6', fontWeight: 700, fontSize: 14, padding: '0.95rem 2rem', textDecoration: 'none' }}>Book Consultation</Link>
      </section>
    </div>
  );
}
