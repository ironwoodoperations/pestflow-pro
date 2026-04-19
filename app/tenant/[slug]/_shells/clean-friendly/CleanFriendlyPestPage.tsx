import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { PEST_CONTENT_MAP } from '../../../../../src/shells/_shared/pestContent';
import { PestIcon } from '../../../../../src/shells/_shared/PestIcon';
import { formatPhone } from '../../../../../shared/lib/formatPhone';
import { CleanFriendlyHowItWorks } from './CleanFriendlyHowItWorks';

interface Props { tenant: Tenant; pestSlug: string }

const MintCheck = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }}>
    <circle cx="12" cy="12" r="10" fill="var(--cf-bg-mint)" />
    <polyline points="8 12 11 15 16 9" stroke="var(--cf-mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function CleanFriendlyPestPage({ tenant, pestSlug }: Props) {
  const pest = PEST_CONTENT_MAP[pestSlug];
  const phone = tenant.phone ?? '';
  const bizName = tenant.business_name || tenant.name;

  return (
    <div style={{ backgroundColor: 'var(--cf-surface)' }}>

      {/* Hero */}
      <section style={{ backgroundColor: 'var(--cf-surface)', borderBottom: '1px solid var(--cf-divider)', padding: '4rem 1rem 3rem' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', alignItems: 'center' }}>
          <style>{`@media(min-width:768px){.cf-pest-grid{grid-template-columns:60% 40% !important}}`}</style>
          <div className="cf-pest-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: '0.75rem' }}>
                safe solutions for your family
              </p>
              <h1 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 'clamp(28px,4.5vw,48px)', lineHeight: 1.2, color: 'var(--cf-ink)', marginBottom: '1.25rem' }}>
                {pest?.displayName || 'Pest Control'}
              </h1>
              <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 17, lineHeight: 1.65, color: 'var(--cf-ink-secondary)', marginBottom: '2rem', maxWidth: '44ch' }}>
                {pest?.blurb || `Professional ${pest?.displayName.toLowerCase()} control, safe for your whole family.`}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--cf-ink)', color: 'var(--cf-surface)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 15, padding: '0.75rem 1.75rem', borderRadius: 28, textDecoration: 'none' }}>
                  Get your free quote
                </Link>
                {phone && (
                  <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', border: '1px solid var(--cf-ink)', color: 'var(--cf-ink)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 15, padding: '0.75rem 1.75rem', borderRadius: 28, textDecoration: 'none', backgroundColor: 'transparent' }}>
                    {formatPhone(phone)}
                  </a>
                )}
              </div>
            </div>

            {/* PestIcon card */}
            <div style={{ backgroundColor: 'var(--cf-surface-card)', border: '1px solid var(--cf-divider)', borderRadius: 16, padding: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(31,58,77,0.06)' }}>
              <span style={{ color: 'var(--cf-sky)' }}>
                <PestIcon pest={pestSlug} size={96} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Signs + Treatment */}
      <section style={{ backgroundColor: 'var(--cf-bg-sky)', borderBottom: '1px solid var(--cf-divider)', padding: '3.5rem 1rem' }}>
        <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '2.5rem' }}>
          {pest?.signs?.length > 0 && (
            <div>
              <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 13, color: 'var(--cf-ink-secondary)', marginBottom: '0.5rem' }}>what to look for</p>
              <h2 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 20, color: 'var(--cf-ink)', marginBottom: '1rem', lineHeight: 1.2 }}>
                Signs of {pest.displayName.toLowerCase()}
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {pest.signs.map((sign) => (
                  <li key={sign} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 14, color: 'var(--cf-ink-secondary)', lineHeight: 1.55 }}>
                    <MintCheck />{sign}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pest?.treatment && (
            <div>
              <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 13, color: 'var(--cf-ink-secondary)', marginBottom: '0.5rem' }}>our approach</p>
              <h2 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 20, color: 'var(--cf-ink)', marginBottom: '1rem', lineHeight: 1.2 }}>
                How we treat it
              </h2>
              <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 14, color: 'var(--cf-ink-secondary)', lineHeight: 1.65 }}>
                {pest.treatment}
              </p>
              {bizName && (
                <p style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 14, color: 'var(--cf-ink-muted)', lineHeight: 1.65, marginTop: '0.75rem' }}>
                  {bizName} technicians are licensed, background-checked, and use treatments safe for families and pets.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Brand signature — 3-step row */}
      <CleanFriendlyHowItWorks />

      {/* CTA */}
      <section style={{ backgroundColor: 'var(--cf-surface)', borderTop: '1px solid var(--cf-divider)', padding: '3.5rem 1rem', textAlign: 'center' }}>
        <div className="max-w-xl mx-auto">
          <h2 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 'clamp(22px,3vw,32px)', color: 'var(--cf-ink)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
            {pest?.cta || 'Ready for a pest-free home?'}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link href="/quote" style={{ display: 'inline-block', backgroundColor: 'var(--cf-ink)', color: 'var(--cf-surface)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 16, padding: '0.85rem 2rem', borderRadius: 28, textDecoration: 'none' }}>
              Get your free quote
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ display: 'inline-block', border: '1px solid var(--cf-ink)', color: 'var(--cf-ink)', fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 16, padding: '0.85rem 2rem', borderRadius: 28, textDecoration: 'none', backgroundColor: 'transparent' }}>
                {formatPhone(phone)}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
