import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { PEST_CONTENT_MAP } from '../../../../../src/shells/_shared/pestContent';
import { PestIcon } from '../../../../../src/shells/_shared/PestIcon';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

type PageContent = { title?: string; subtitle?: string; intro?: string; hero_headline?: string } | null;
interface Props { tenant: Tenant; pestSlug: string; content?: PageContent }

const pickString = (...vals: Array<string | undefined | null>): string | undefined => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return undefined;
};

const EYEBROW_STYLE: React.CSSProperties = {
  fontFamily: 'var(--bl-font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 'var(--bl-letter-spacing-wide)',
  textTransform: 'uppercase',
  color: 'var(--bl-accent)',
};

const HEAD_STYLE: React.CSSProperties = {
  fontFamily: 'var(--bl-font-display)',
  fontWeight: 700,
  letterSpacing: 'var(--bl-letter-spacing-tight)',
  color: 'var(--bl-text)',
  lineHeight: 'var(--bl-line-height-tight)',
};

export function BoldLocalPestPage({ tenant, pestSlug, content = null }: Props) {
  const pest = PEST_CONTENT_MAP[pestSlug];
  const phone = tenant.phone ?? '';
  const bizName = tenant.business_name || tenant.name;
  const license = tenant.license_number?.trim() || 'Licensed';
  const founded = tenant.founded_year ? `Since ${tenant.founded_year}` : 'Established';

  const heroTitle = pickString(content?.hero_headline, content?.title, pest?.displayName) || 'Pest Control';
  const eyebrow = `${pest?.displayName || 'Pest'} / Strike-Ready`;
  const blurb = pickString(content?.subtitle, content?.intro, pest?.blurb)
    || `Industrial-strength ${pest?.displayName?.toLowerCase() || 'pest'} control — fast response, hard hits, no nonsense.`;
  const ctaHeadline = pickString(pest?.cta) || 'Ready to strike back?';

  return (
    <div style={{ backgroundColor: 'var(--bl-surface)' }}>

      {/* Hero */}
      <section style={{ backgroundColor: 'var(--bl-surface)', borderBottom: '1px solid var(--bl-border)', padding: 'var(--bl-space-2xl) 1rem var(--bl-space-xl)' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--bl-space-lg)', alignItems: 'center' }}>
          <style>{`@media(min-width:768px){.bl-pest-grid{grid-template-columns:1fr 360px !important}}`}</style>
          <div className="bl-pest-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--bl-space-lg)', alignItems: 'center' }}>
            <div>
              <p style={{ ...EYEBROW_STYLE, marginBottom: 'var(--bl-space-md)' }}>
                {eyebrow}
              </p>
              <h1 style={{ ...HEAD_STYLE, fontSize: 'clamp(34px,5.2vw,60px)', marginBottom: 'var(--bl-space-md)', textTransform: 'uppercase' }}>
                {heroTitle}
              </h1>
              <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 16, color: 'var(--bl-text-secondary)', lineHeight: 'var(--bl-line-height-loose)', marginBottom: 'var(--bl-space-lg)', maxWidth: '54ch' }}>
                {blurb}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--bl-space-sm)' }}>
                <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--bl-accent)', color: 'var(--bl-surface)', fontFamily: 'var(--bl-font-display)', fontWeight: 700, fontSize: 17, letterSpacing: 'var(--bl-letter-spacing-wide)', padding: '0.85rem 1.75rem', borderRadius: 'var(--bl-radius-md)', textDecoration: 'none', textTransform: 'uppercase' }}>
                  Strike Back
                </Link>
                {phone && (
                  <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', border: '2px solid var(--bl-accent)', color: 'var(--bl-text)', fontFamily: 'var(--bl-font-body)', fontWeight: 600, fontSize: 15, padding: '0.85rem 1.75rem', borderRadius: 'var(--bl-radius-md)', textDecoration: 'none' }}>
                    {formatPhone(phone)}
                  </a>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bl-surface-2)', border: '2px solid var(--bl-accent)', borderRadius: 'var(--bl-radius-md)', padding: 'var(--bl-space-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--bl-accent)' }}>
                <PestIcon pest={pestSlug} size={120} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* License-plate strip */}
      <section style={{ backgroundColor: 'var(--bl-surface-2)', borderTop: '1px solid rgba(245,166,35,0.25)', borderBottom: '1px solid rgba(245,166,35,0.25)' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            { label: 'License #', value: license },
            { label: 'Coverage', value: founded },
            { label: 'Response', value: 'Same-Day' },
          ].map((cell, i) => (
            <div key={cell.label} style={{ padding: 'var(--bl-space-md) var(--bl-space-md)', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--bl-border)' : 'none' }}>
              <span style={{ display: 'block', fontFamily: 'var(--bl-font-body)', fontSize: 10, fontWeight: 600, letterSpacing: 'var(--bl-letter-spacing-wide)', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginBottom: 4 }}>{cell.label}</span>
              <span style={{ display: 'block', fontFamily: 'var(--bl-font-display)', fontSize: 18, fontWeight: 700, color: 'var(--bl-accent)' }}>{cell.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Signs grid + Treatment */}
      <section style={{ backgroundColor: 'var(--bl-surface)', padding: 'var(--bl-space-2xl) 1rem' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--bl-space-xl)' }}>
          <style>{`@media(min-width:768px){.bl-pest-cols{grid-template-columns:1fr 1fr !important}}`}</style>
          <div className="bl-pest-cols" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--bl-space-xl)' }}>
            {pest?.signs && pest.signs.length > 0 && (
              <div>
                <p style={{ ...EYEBROW_STYLE, marginBottom: 'var(--bl-space-sm)' }}>What we hunt</p>
                <h2 style={{ ...HEAD_STYLE, fontSize: 'clamp(22px,3vw,32px)', marginBottom: 'var(--bl-space-md)', textTransform: 'uppercase' }}>
                  Signs of {pest.displayName.toLowerCase()}
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
                  {pest.signs.map((sign, i) => (
                    <li key={sign} style={{ display: 'flex', gap: 'var(--bl-space-md)', alignItems: 'flex-start', padding: 'var(--bl-space-md) 0', borderTop: i === 0 ? '1px solid var(--bl-border)' : 'none', borderBottom: '1px solid var(--bl-border)' }}>
                      <span style={{ fontFamily: 'var(--bl-font-display)', fontSize: 14, fontWeight: 700, color: 'var(--bl-accent)', minWidth: 28 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ fontFamily: 'var(--bl-font-body)', fontSize: 14, color: 'var(--bl-text-secondary)', lineHeight: 'var(--bl-line-height-loose)' }}>{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pest?.treatment && (
              <div>
                <p style={{ ...EYEBROW_STYLE, marginBottom: 'var(--bl-space-sm)' }}>Our hit plan</p>
                <h2 style={{ ...HEAD_STYLE, fontSize: 'clamp(22px,3vw,32px)', marginBottom: 'var(--bl-space-md)', textTransform: 'uppercase' }}>
                  How we treat it
                </h2>
                <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 15, color: 'var(--bl-text-secondary)', lineHeight: 'var(--bl-line-height-loose)' }}>
                  {pest.treatment}
                </p>
                {bizName && (
                  <p style={{ fontFamily: 'var(--bl-font-body)', fontSize: 14, color: 'var(--bl-text-muted)', lineHeight: 'var(--bl-line-height-loose)', marginTop: 'var(--bl-space-md)' }}>
                    {bizName} crews are licensed, insured, and dispatched same-day. We don&apos;t play around with infestations.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section style={{ backgroundColor: 'var(--bl-surface-2)', borderTop: '2px solid var(--bl-accent)', borderBottom: '2px solid var(--bl-accent)', padding: 'var(--bl-space-xl) 1rem' }}>
        <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--bl-space-md)' }}>
          {[
            { num: '24/7', label: 'Dispatch' },
            { num: '100%', label: 'Guarantee' },
            { num: '15+', label: 'Years on the job' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ ...HEAD_STYLE, fontSize: 'clamp(28px,4.5vw,48px)', color: 'var(--bl-accent)' }}>{s.num}</div>
              <div style={{ fontFamily: 'var(--bl-font-body)', fontSize: 11, fontWeight: 600, letterSpacing: 'var(--bl-letter-spacing-wide)', textTransform: 'uppercase', color: 'var(--bl-text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bar */}
      <section style={{ backgroundColor: 'var(--bl-accent)', padding: 'var(--bl-space-xl) 1rem', textAlign: 'center' }}>
        <div className="max-w-3xl mx-auto">
          <h2 style={{ fontFamily: 'var(--bl-font-display)', fontWeight: 700, fontSize: 'clamp(28px,4.5vw,42px)', color: 'var(--bl-surface)', textTransform: 'uppercase', letterSpacing: 'var(--bl-letter-spacing-tight)', marginBottom: 'var(--bl-space-md)', lineHeight: 'var(--bl-line-height-tight)' }}>
            {ctaHeadline}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--bl-space-sm)', justifyContent: 'center' }}>
            <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--bl-surface)', color: 'var(--bl-accent)', fontFamily: 'var(--bl-font-display)', fontWeight: 700, fontSize: 17, letterSpacing: 'var(--bl-letter-spacing-wide)', padding: '0.9rem 2rem', borderRadius: 'var(--bl-radius-md)', textDecoration: 'none', textTransform: 'uppercase' }}>
              Strike Back
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', border: '2px solid var(--bl-surface)', color: 'var(--bl-surface)', fontFamily: 'var(--bl-font-body)', fontWeight: 600, fontSize: 15, padding: '0.9rem 2rem', borderRadius: 'var(--bl-radius-md)', textDecoration: 'none' }}>
                Call {formatPhone(phone)}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
