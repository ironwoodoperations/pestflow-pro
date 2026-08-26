import Link from 'next/link';
import type { Tenant } from '../../../../../shared/lib/tenant/types';
import { getServiceEntry, resolveVertical } from '../../../../../src/shells/_shared/serviceEntry';
import { getVerticalCopy } from '../../../../../src/shells/_shared/verticalCopy';
import { formatPhone } from '../../../../../shared/lib/formatPhone';

type PageContent = { title?: string; subtitle?: string; intro?: string; hero_headline?: string } | null;
interface Props {
  tenant: Tenant;
  pestSlug: string;
  content?: PageContent;
  /**
   * S295 — resolved by the ROUTE via resolveHeroImage(content, heroMedia), the
   * same way every other tenant route does it. null means the tenant has no
   * hero image of any kind, and the hero keeps the gradient it has always had.
   */
  heroImageUrl?: string | null;
}

const pickString = (...vals: Array<string | undefined | null>): string | undefined => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return undefined;
};


// S302 — the hero scrim and the colours that depend on it. IDENTICAL to the
// treatment landed on ModernProAboutPage in S301, deliberately: the two heroes
// share a palette, and if they diverge the next person has to work out why.
//
// S295 shipped this hero at rgba(0,0,0,0.55), which reads well over the dark
// pest photography it was built against. pls uploaded turf and sod — bright
// shots — and at 0.55 the muted palette fails WCAG AA on them:
//
//                    0.55            0.60 + lifted
//   eyebrow          1.96-3.35 FAIL  4.55-7.36 PASS
//   blurb            1.85-3.16 FAIL  4.66-7.53 PASS
//   h1 (white)       4.74-8.11 PASS  5.74-9.28 PASS
//
// ONE ELEMENT HERE THAT THE ABOUT HERO DOES NOT HAVE: the outlined "Call"
// button is #3FB8AF text and border directly over the photo, so it measures
// exactly what the eyebrow does and fails with it. It takes the same lift. The
// FILLED "Request a Quote" button is untouched — it carries its own teal
// background with #0B1220 text, so its contrast never depended on the scrim.
//
// Image path only. With no hero image every byte is what it was.
const HERO_SCRIM = 'rgba(0,0,0,0.6)';
const TEAL_ON_PHOTO = '#A5F3EE';
const BLURB_ON_PHOTO = '#E2E8F0';

export function ModernProPestPage({ tenant, pestSlug, content = null, heroImageUrl = null }: Props) {
  // S-PLS-5 / D1 plumbing: vertical-aware accessor in place of the direct map
  // read. For pest tenants getServiceEntry('pest', slug) returns the SAME
  // object from PEST_CONTENT_MAP — identical render, locked by tests.
  const vertical = resolveVertical(tenant);
  const copy = getVerticalCopy(vertical);
  const pest = getServiceEntry(vertical, pestSlug);
  const phone = tenant.phone ?? '';
  const heroTitle = pickString(content?.hero_headline, content?.title, pest?.displayName) || 'Pest Control';
  const eyebrow = pickString(content?.subtitle) || `${pest?.displayName || 'Pest'} Protection`;
  const blurb = pickString(content?.intro, pest?.blurb)
    || `Engineered ${pest?.displayName?.toLowerCase() || 'pest'} elimination — measurable outcomes, documented protocols.`;

  // S295 — the same treatment DefaultPestPage has always used: the image as a
  // cover background under a 55% scrim, so white heading text keeps its
  // contrast over an arbitrary photograph.
  //
  // The keys below are spread in their ORIGINAL order, and position/z-index are
  // added ONLY on the image path. React serialises a style object in insertion
  // order, so with heroImageUrl === null this renders the exact string it
  // rendered before S295 — asserted byte-for-byte in the tests.
  const heroBase = { padding: '5rem 1rem 3rem', borderBottom: '1px solid rgba(63,184,175,0.2)' };

  return (
    <div style={{ backgroundColor: '#0B1220', color: '#E5E7EB', fontFamily: 'Inter, sans-serif' }}>
      {/* Hero */}
      <section style={heroImageUrl
        ? { ...heroBase, position: 'relative', backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { ...heroBase, background: 'linear-gradient(135deg,#1B2A4E,#0B1220)' }}>
        {heroImageUrl && <div style={{ position: 'absolute', inset: 0, background: HERO_SCRIM, zIndex: 0, pointerEvents: 'none' }} />}
        <div className="max-w-5xl mx-auto" style={heroImageUrl ? { textAlign: 'center', position: 'relative', zIndex: 1 } : { textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: heroImageUrl ? TEAL_ON_PHOTO : '#3FB8AF', marginBottom: '0.75rem' }}>{eyebrow}</p>
          <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, color: '#fff', marginBottom: '1rem', lineHeight: 1.15 }}>{heroTitle}</h1>
          <p style={{ fontSize: 17, color: heroImageUrl ? BLURB_ON_PHOTO : '#94A3B8', lineHeight: 1.6, maxWidth: '60ch', margin: '0 auto 2rem' }}>{blurb}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            <Link href="/quote" style={{ display: 'inline-block', backgroundColor: '#3FB8AF', color: '#0B1220', fontWeight: 600, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 8, textDecoration: 'none' }}>Request a Quote</Link>
            {phone && <a href={`tel:${phone.replace(/\D/g,'')}`} style={{ display: 'inline-block', border: `1px solid ${heroImageUrl ? TEAL_ON_PHOTO : '#3FB8AF'}`, color: heroImageUrl ? TEAL_ON_PHOTO : '#3FB8AF', fontWeight: 500, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 8, textDecoration: 'none' }}>Call {formatPhone(phone)}</a>}
          </div>
        </div>
      </section>

      {/* Numbered approach */}
      <section style={{ padding: '4rem 1rem' }}>
        <div className="max-w-6xl mx-auto">
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3FB8AF', marginBottom: '0.5rem', textAlign: 'center' }}>Our Process</p>
          <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: '2.5rem' }}>{copy.serviceProcessVerb} {pest?.displayName?.toLowerCase() || 'this'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.25rem' }}>
            {copy.serviceSteps.map((s) => (
              <div key={s.num} style={{ padding: '1.5rem', border: '1px solid rgba(63,184,175,0.2)', borderRadius: 8, backgroundColor: 'rgba(27,42,78,0.4)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 999, backgroundColor: '#3FB8AF', color: '#0B1220', fontWeight: 700, fontSize: 14, marginBottom: '0.75rem' }}>{s.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signs / treatment */}
      {(pest?.signs?.length || pest?.treatment) && (
        <section style={{ padding: '3rem 1rem', borderTop: '1px solid rgba(63,184,175,0.15)' }}>
          <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '2rem' }}>
            {pest?.signs && pest.signs.length > 0 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: '0.75rem', borderBottom: '1px solid #3FB8AF', paddingBottom: '0.5rem' }}>Signs</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {pest.signs.map((s) => (
                    <li key={s} style={{ fontSize: 14, color: '#CBD5E1', padding: '0.4rem 0', display: 'flex', gap: '0.6rem' }}><span style={{ color: '#3FB8AF', fontWeight: 700 }}>›</span><span>{s}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {pest?.treatment && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: '0.75rem', borderBottom: '1px solid #3FB8AF', paddingBottom: '0.5rem' }}>{copy.serviceSolutionLabel}</h3>
                <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.7 }}>{pest.treatment}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: '#1B2A4E' }}>
        <h2 style={{ fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>{pickString(pest?.cta) || 'Ready to engineer the fix?'}</h2>
        <Link href="/quote" style={{ display: 'inline-block', backgroundColor: '#3FB8AF', color: '#0B1220', fontWeight: 600, fontSize: 15, padding: '0.85rem 2rem', borderRadius: 8, textDecoration: 'none' }}>Request a Quote</Link>
      </section>
    </div>
  );
}
